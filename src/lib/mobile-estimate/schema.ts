import { z } from 'astro/zod';
export type Predicate =
  | { op: 'always' }
  | { op: 'all' | 'any'; conditions: Predicate[] }
  | { op: 'not'; condition: Predicate }
  | { op: 'eq' | 'ne' | 'contains'; field: string; value: string | number | boolean | null }
  | { op: 'in'; field: string; values: (string | number | boolean | null)[] }
  | { op: 'nonempty' | 'duplicates'; field: string };
const field = z
  .string()
  .regex(/^(answers|derived|review_context|calculation)\.[a-z][a-z0-9_]*$/)
  .refine((v) => !v.includes('__proto__') && !v.includes('constructor'));
const primitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const predicateSchema: z.ZodType<Predicate> = z.lazy(() =>
  z.union([
    z.strictObject({ op: z.literal('always') }),
    z.object({ op: z.enum(['all', 'any']), conditions: z.array(predicateSchema).min(1) }),
    z.strictObject({ op: z.literal('not'), condition: predicateSchema }),
    z.strictObject({ op: z.enum(['eq', 'ne', 'contains']), field, value: primitive }),
    z.strictObject({ op: z.literal('in'), field, values: z.array(primitive).min(1) }),
    z.strictObject({ op: z.enum(['nonempty', 'duplicates']), field }),
  ]),
);
const optionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
});
export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z_]*$/),
    label: z.string().min(1),
    type: z.enum(['single_select', 'multi_select', 'textarea']),
    required: z.boolean(),
    options: z.array(optionSchema).min(1).optional(),
    help_text: z.string().optional(),
    notice: z.string().optional(),
    min_selections: z.number().int().nonnegative().optional(),
    unique_items: z.boolean().optional(),
    max_length: z.number().int().positive().optional(),
    default: z.string().optional(),
    visible_when: predicateSchema.optional(),
    required_when_visible: z.boolean().optional(),
    hidden_value: z.literal('not_assessed').optional(),
  })

  .superRefine((q, ctx) => {
    if (q.type !== 'textarea' && !q.options)
      ctx.addIssue({ code: 'custom', message: 'Options required' });
    if (q.visible_when && !q.hidden_value)
      ctx.addIssue({ code: 'custom', message: 'Hidden value required' });
    if (q.options && new Set(q.options.map((o) => o.id)).size !== q.options.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate options' });
  });
export const servicesSchema = z
  .object({
    schema_version: z.literal('1.0.0'),
    configuration_id: z.string(),
    version: z.string(),
    compatible_pricing_version: z.string(),
    service_id: z.literal('mobile_app_development'),
    steps: z
      .array(
        z.object({
          id: z.string(),
          number: z.number().int().min(1).max(5),
          title: z.string(),
          questions: z.array(questionSchema).min(1),
          suggestions: z
            .object({
              behaviour: z.string(),
              by_app_type: z.record(z.string(), z.array(z.string())),
            })
            .optional(),
        }),
      )
      .length(5),
    normalization: z
      .object({
        rules: z.array(z.object({ when: predicateSchema, set: z.record(z.string(), z.string()) })),
      })
      .catchall(z.unknown()),
    automatic_inclusions: z.array(
      z.object({
        id: z.string(),
        answer_field: z.string(),
        value: z.string(),
        customer_label: z.string(),
        customer_selectable: z.literal(false),
      }),
    ),
    final_review: z
      .object({
        hidden_status_label: z.string(),
        actions: z.array(z.strictObject({ id: z.string(), label: z.string() })),
      })
      .catchall(z.unknown()),
    delivery: z.strictObject({ customer_status_label: z.string() }).catchall(z.unknown()),
    response_schema: z
      .object({
        required: z.array(z.string()),
        properties: z.record(
          z.string(),
          z.object({
            type: z.string().optional(),
            enum: z.array(z.string()).optional(),
            const: z.string().optional(),
            maxLength: z.number().optional(),
            uniqueItems: z.boolean().optional(),
            items: z
              .strictObject({ type: z.literal('string'), enum: z.array(z.string()) })
              .optional(),
          }),
        ),
      })
      .catchall(z.unknown()),
  })
  .catchall(z.unknown())
  .superRefine((s, ctx) => {
    const questions = s.steps.flatMap((step) => step.questions);
    if (
      new Set(questions.map((q) => q.id)).size !== questions.length ||
      s.steps.some((step, i) => step.number !== i + 1)
    )
      ctx.addIssue({ code: 'custom', message: 'Question IDs and step order must be unique' });
    for (const q of questions)
      if (
        !s.response_schema.properties[q.id] ||
        (q.options &&
          q.options.some(
            (o) =>
              !(
                q.type === 'multi_select'
                  ? s.response_schema.properties[q.id].items?.enum
                  : s.response_schema.properties[q.id].enum
              )?.includes(o.id),
          ))
      )
        ctx.addIssue({ code: 'custom', message: `Question/response contract mismatch: ${q.id}` });
  });
const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const itemSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    charge_type: z.enum(['one_time', 'monthly']),
    price_mode: z.enum(['fixed', 'included', 'provisional', 'from', 'pending', 'manual_quote']),
    amount_pence: money.nullable(),
    assumption: z.string().optional(),
    scope: z.string().optional(),
    inclusions: z.array(z.string()).optional(),
    exclusions: z.array(z.string()).optional(),
    screen_band: z.string().optional(),
    replaces: z.string().optional(),
    quantity_policy: z.string().optional(),
    requires_review: z.boolean().optional(),
  })

  .superRefine((item, ctx) => {
    if (
      ['pending', 'manual_quote'].includes(item.price_mode) !== (item.amount_pence === null) ||
      (item.price_mode === 'included' && item.amount_pence !== 0)
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid price-mode amount' });
  });
const componentSchema = z.union([
  z.object({
    id: z.string(),
    selection: z.literal('first_match'),
    choices: z.array(z.strictObject({ when: predicateSchema, item_id: z.string() })).min(1),
  }),
  z.object({
    id: z.literal('features'),
    selection: z.literal('for_each_unique'),
    source_field: field,
    item_id_prefix: z.literal('feature.'),
  }),
]);
export const vatSchema = z
  .object({
    registration_status: z.enum(['unverified', 'registered', 'not_registered']),
    registration_verified: z.boolean(),
    registration_number: z.string().nullable(),
    registration_verified_at: z.string().nullable(),
    registration_verification_reference: z.string().nullable(),
    transaction_treatment: z.enum([
      'unverified',
      'taxable',
      'not_applicable',
      'exempt',
      'outside_scope',
    ]),
    rate_basis_points: z.number().int().min(0).max(10000).nullable(),
    rate_verified_at: z.string().nullable(),
    default_auto_add: z.boolean(),
    unverified_output: z.object({
      status: z.literal('not_calculated_unverified'),
      one_time_vat_pence: z.null(),
      monthly_vat_pence: z.null(),
      one_time_including_vat_pence: z.null(),
      monthly_including_vat_pence: z.null(),
      customer_message: z.string(),
    }),
  })
  .catchall(z.unknown());
const backendRuleSchema = z.object({
  id: z.string(),
  when: predicateSchema,
  tier: z.enum(['none', 'existing', 'basic', 'standard', 'advanced', 'unknown']).optional(),
  tier_from: field.optional(),
  reason: z.string().optional(),
  requires: z.string().optional(),
});
export const reviewRuleSchema = z.object({
  id: z.string(),
  severity: z.enum(['information', 'warning', 'blocking']),
  when: predicateSchema,
  explanation: z.string(),
  affected_components: z.array(z.string()),
  recommended_review_action: z.string(),
  initial_resolution_status: z.literal('unresolved'),
  blocks_fixed_price_approval: z.boolean(),
  auto_remove_charges: z.literal(false),
});
export const calculationConfigSchema = z
  .object({
    version: z.string(),
    compatible_services_version: z.string(),
    currency: z.literal('GBP'),
    catalogue: z.record(z.string(), itemSchema),
    calculation: z
      .object({ version: z.string(), components: z.array(componentSchema) })
      .catchall(z.unknown()),
    backend_recommendation: z
      .object({ rules: z.array(backendRuleSchema).min(1) })
      .catchall(z.unknown()),
    vat: vatSchema,
    internal_validation: z.strictObject({ rules: z.array(reviewRuleSchema) }).catchall(z.unknown()),
  })
  .catchall(z.unknown())
  .superRefine((p, ctx) => {
    for (const [id, item] of Object.entries(p.catalogue))
      if (id !== item.id) ctx.addIssue({ code: 'custom', message: 'Catalogue ID mismatch' });
    for (const c of p.calculation.components)
      if (c.selection === 'first_match')
        for (const choice of c.choices)
          if (!p.catalogue[choice.item_id])
            ctx.addIssue({ code: 'custom', message: `Unknown price item ${choice.item_id}` });
    if (new Set(p.calculation.components.map((c) => c.id)).size !== p.calculation.components.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate components' });
  });
export const pricingSchema = calculationConfigSchema.and(
  z
    .object({
      schema_version: z.literal('1.0.0'),
      configuration_id: z.string(),
      service_id: z.literal('mobile_app_development'),
      money_unit: z.literal('integer_pence'),
      prices_exclude_vat: z.literal(true),
      quotation_workflow: z
        .object({
          states: z.array(z.enum(['draft', 'indicative', 'needs_review', 'approved', 'issued'])),
          approval_enabled_by_default: z.literal(false),
          issuance_enabled_by_default: z.literal(false),
        })
        .catchall(z.unknown()),
      maintenance_terms: z
        .object({
          basic: z
            .object({
              hours_per_month: z.number(),
              initial_email_response_business_days: z.number(),
            })
            .catchall(z.unknown()),
          premium: z
            .object({
              hours_per_month: z.number(),
              priority_initial_response_business_days: z.number(),
            })
            .catchall(z.unknown()),
        })
        .catchall(z.unknown()),
      publishing_terms: z
        .object({ customer_notice: z.string(), developer_account_fees_included: z.literal(false) })
        .catchall(z.unknown()),
    })
    .catchall(z.unknown()),
);
export type ServicesConfig = z.infer<typeof servicesSchema>;
export type Question = z.infer<typeof questionSchema>;
export type CalculationConfig = z.infer<typeof calculationConfigSchema>;
export type PriceItem = z.infer<typeof itemSchema>;
export type VatConfig = z.infer<typeof vatSchema>;

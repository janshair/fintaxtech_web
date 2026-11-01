import type { TemplateBriefSchema } from './index';
import { beautyDemo, treatmentGroups } from '../beauty-demo';
import { duration, price, rowValues, sampleChoice, slug, whenOwn } from './shared';

// beauty-08 (Top Coat). Content mirrors src/content/beauty-demo.ts: the treatments
// export, plus flow.technicians, policy, patchTest, voucher and aftercare.
// Nails, lashes and brows only: the template has no place for injectables or medical treatments.
const groups = Object.fromEntries(
  treatmentGroups.map((group) => [group.label, group.id]),
) as Record<string, string>;
const technicianOptions = {
  own: 'I’ll add my technicians',
  sample: 'Use the template’s sample names for now',
  none: 'Leave technician choice out',
};
const voucherOptions = { yes: 'Yes, we sell gift vouchers', no: 'No gift vouchers' };

export const beauty08: TemplateBriefSchema = {
  id: 'beauty-08',
  prefix: 'beauty',
  files: {
    treatments: 'Treatment photos — nails, lashes, brows (up to 6)',
    salon: 'Salon photos',
    team: 'Team photos',
  },
  sections: [
    {
      title: 'Your treatments',
      fields: [
        sampleChoice(
          'beautyTreatmentsSource',
          'Treatments and prices',
          '6 to 16 treatments across nails, lashes, brows and extras. Please don’t include injectables or medical treatments.',
        ),
        {
          id: 'beautyTreatments',
          label: 'Your treatments',
          type: 'rows',
          when: whenOwn('beautyTreatmentsSource'),
          repeat: {
            title: (n) => `Treatment ${n}`,
            add: 'Add a treatment',
            remove: (n) => `Remove treatment ${n}`,
            min: 6,
            max: 16,
            fields: [
              { key: 'group', label: 'Group', type: 'single', options: Object.keys(groups) },
              { key: 'name', label: 'Treatment name', type: 'text', maxLength: 28 },
              { key: 'description', label: 'Short description', type: 'text', maxLength: 90 },
              {
                key: 'duration',
                label: 'Length in minutes, like 45, or +15 for an add-on',
                type: 'text',
                maxLength: 16,
                format: duration,
              },
              {
                key: 'price',
                label: 'Price, like £28, From £5 or POA',
                type: 'text',
                maxLength: 16,
                format: { ...price, words: ['POA'] },
              },
            ],
          },
        },
        {
          id: 'beautyTechniciansSource',
          label: 'Technicians in the booking demo',
          type: 'single',
          options: Object.values(technicianOptions),
        },
        {
          id: 'beautyTechnicians',
          label: 'Your technicians',
          type: 'rows',
          when: { id: 'beautyTechniciansSource', values: [technicianOptions.own] },
          repeat: {
            title: (n) => `Technician ${n}`,
            add: 'Add a technician',
            remove: (n) => `Remove technician ${n}`,
            max: 6,
            fields: [
              { key: 'name', label: 'First name', type: 'text', maxLength: 20 },
              {
                key: 'specialism',
                label: 'Specialism, like Lashes (optional)',
                type: 'text',
                maxLength: 40,
                optional: true,
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Your policies and aftercare',
      fields: [
        sampleChoice('beautyPolicySource', 'Deposit and cancellation policy'),
        {
          id: 'beautyPolicy',
          label: 'Your policy',
          type: 'long',
          maxLength: 280,
          when: whenOwn('beautyPolicySource'),
          help: 'Like: a £10 deposit secures your appointment. Please give 24 hours’ notice to cancel.',
        },
        {
          id: 'beautyPatchTest',
          label: 'Patch-test wording',
          type: 'confirm',
          confirmText: `Show this on my website: “${beautyDemo.patchTest}”`,
        },
        {
          id: 'beautyVouchers',
          label: 'Gift vouchers',
          type: 'single',
          options: Object.values(voucherOptions),
        },
        {
          id: 'beautyVoucherFrom',
          label: 'Vouchers from, like £20 (optional)',
          type: 'text',
          optional: true,
          maxLength: 10,
          format: price,
          when: { id: 'beautyVouchers', values: [voucherOptions.yes] },
        },
        sampleChoice('beautyAftercareSource', 'Aftercare tips', 'Up to 4 short tips.'),
        {
          id: 'beautyAftercare',
          label: 'Your aftercare tips',
          type: 'rows',
          when: whenOwn('beautyAftercareSource'),
          repeat: {
            title: (n) => `Tip ${n}`,
            add: 'Add a tip',
            remove: (n) => `Remove tip ${n}`,
            max: 4,
            fields: [{ key: 'tip', label: 'Tip', type: 'text', maxLength: 70 }],
          },
        },
      ],
    },
  ],
  toTemplateData(answers, rows) {
    const treatments = rowValues(answers, rows, 'beautyTreatmentsSource', 'beautyTreatments');
    const aftercare = rowValues(answers, rows, 'beautyAftercareSource', 'beautyAftercare');
    const technicians =
      answers.beautyTechniciansSource === technicianOptions.own
        ? (rows.beautyTechnicians ?? []).map((row) => row.values)
        : null;
    const ids = new Set<string>();
    return {
      treatments:
        treatments?.map(({ group, name, description, duration, price }) => {
          let id = slug(name);
          while (ids.has(id)) id += '-2';
          ids.add(id);
          return { id, group: groups[group], name, description, duration, price };
        }) ?? null,
      flow: {
        technicians: technicians
          ? ['Any available', ...technicians.map((row) => row.name)]
          : answers.beautyTechniciansSource === technicianOptions.none
            ? []
            : null,
      },
      technicians:
        technicians?.map(({ name, specialism }) => ({ name, specialism: specialism || null })) ??
        null,
      policy:
        answers.beautyPolicySource === 'I’ll enter my own' ? { text: answers.beautyPolicy } : null,
      patchTest: answers.beautyPatchTest === true ? beautyDemo.patchTest : null,
      voucher:
        answers.beautyVouchers === voucherOptions.yes
          ? {
              value:
                typeof answers.beautyVoucherFrom === 'string' ? answers.beautyVoucherFrom : null,
            }
          : false,
      aftercare: aftercare?.map((row) => row.tip) ?? null,
    };
  },
};

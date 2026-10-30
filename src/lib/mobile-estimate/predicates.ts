import type { Predicate } from './schema';
export function lookup(context: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  if (
    parts.length !== 2 ||
    !['answers', 'derived', 'review_context', 'calculation'].includes(parts[0]) ||
    !/^[a-z][a-z0-9_]*$/.test(parts[1]) ||
    ['constructor', 'prototype', '__proto__'].includes(parts[1])
  )
    throw new Error('Invalid predicate path');
  const parent = context[parts[0]];
  return parent && typeof parent === 'object' && Object.hasOwn(parent, parts[1])
    ? (parent as Record<string, unknown>)[parts[1]]
    : null;
}
export function evaluate(p: Predicate, context: Record<string, unknown>): boolean {
  switch (p.op) {
    case 'always':
      return true;
    case 'all':
      return p.conditions.every((v) => evaluate(v, context));
    case 'any':
      return p.conditions.some((v) => evaluate(v, context));
    case 'not':
      return !evaluate(p.condition, context);
    case 'eq':
      return lookup(context, p.field) === p.value;
    case 'ne':
      return lookup(context, p.field) !== p.value;
    case 'in':
      return p.values.some((value) => lookup(context, p.field) === value);
    case 'contains': {
      const v = lookup(context, p.field);
      return Array.isArray(v) && v.includes(p.value);
    }
    case 'nonempty': {
      const v = lookup(context, p.field);
      return Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim().length > 0;
    }
    case 'duplicates': {
      const v = lookup(context, p.field);
      return Array.isArray(v) && new Set(v).size !== v.length;
    }
    default:
      throw new Error('Unknown predicate operator');
  }
}
export function hasControllers(p: Predicate, answers: Record<string, unknown>): boolean {
  if ('conditions' in p) return p.conditions.every((v) => hasControllers(v, answers));
  if ('condition' in p) return hasControllers(p.condition, answers);
  return !('field' in p) || lookup({ answers }, p.field) !== null;
}

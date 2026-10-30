import { services as s, condition, get } from './config';
import type { Answers } from './calculate';
export function answerSummary(a: Answers): string[] {
  const rows: string[] = [];
  function visit(q: any, obj: any = a, prefix = '') {
    if (!condition(q.visibleWhen, { ...a, $row: obj })) return;
    const path = prefix + q.id;
    const value = get(obj, path);
    if (q.type === 'repeatable_pages') {
      for (const row of a.pages) {
        rows.push(row.name);
        for (const f of q.rowFields) if (f.type !== 'generated_id') visit(f, row);
      }
      return;
    }
    if (q.type === 'selected_feature_details') {
      for (const id of a.features) {
        rows.push(id);
        for (const f of q.fieldsForEverySelection) visit(f, a.featureDetails[id] ?? {});
      }
      return;
    }
    if (q.fields) {
      for (const f of q.fields) visit(f, obj, path + '.');
      return;
    }
    if (value === undefined || value === '') return;
    const options = q.optionsRef ? s.packageOptions : q.options;
    const label = (v: any) => options?.find((o: any) => o.id === v)?.label ?? String(v);
    rows.push(`${q.label}: ${Array.isArray(value) ? value.map(label).join(', ') : label(value)}`);
  }
  for (const step of s.steps) for (const q of step.questions) visit(q);
  return rows;
}

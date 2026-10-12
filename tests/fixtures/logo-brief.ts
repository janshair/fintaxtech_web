import { logoBriefSections } from '../../src/content/logo-brief';
import { emptyBrief, fieldOptions, isVisible } from '../../src/lib/client-brief/rules';

export function completeLogoBrief() {
  const state = emptyBrief();
  for (const field of logoBriefSections.flatMap((section) => section.fields)) {
    if (
      field.optional ||
      !isVisible(field, state.answers) ||
      ['images', 'competitors'].includes(field.type)
    )
      continue;
    state.answers[field.id] =
      field.type === 'single'
        ? fieldOptions(field, state.answers)[0]
        : field.type === 'multi'
          ? [fieldOptions(field, state.answers)[0]]
          : field.type === 'confirm'
            ? true
            : 'Example business';
  }
  state.answers.references = 'No';
  return state;
}

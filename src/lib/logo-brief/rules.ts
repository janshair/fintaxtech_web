import { logoBriefSections } from '../../content/logo-brief';
import { createBriefRules } from '../client-brief/rules';
export {
  emptyBrief,
  includesAnswer,
  isVisible,
  hasOther,
  toggleChoice,
  limits,
} from '../client-brief/rules';
export const { pruneBrief, validateField, invalidSection, briefSummary } =
  createBriefRules(logoBriefSections);

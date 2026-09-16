import { logoBriefCopy, logoBriefSections } from '../../content/logo-brief';
import { websiteBriefCopy, websiteBriefSections } from '../../content/website-brief';
import type { BriefCopy } from '../../content/client-brief';
import type { BriefSection } from './types';

export interface BriefDefinition {
  copy: BriefCopy;
  sections: BriefSection[];
  subtitleAnswer?: string;
  includeWorkflowInPDF?: boolean;
}
export const clientBriefDefinitions: Record<'logo' | 'website', BriefDefinition> = {
  logo: { copy: logoBriefCopy, sections: logoBriefSections, subtitleAnswer: 'trading' },
  website: { copy: websiteBriefCopy, sections: websiteBriefSections, includeWorkflowInPDF: true },
};

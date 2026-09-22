import { promptBriefCopy, promptBriefSections } from '../../content/prompt-brief';
import { mobileAppBriefCopy, mobileAppBriefSections } from '../../content/mobile-app-brief';
import { logoBriefCopy, logoBriefSections } from '../../content/logo-brief';
import { websiteBriefCopy, websiteBriefSections } from '../../content/website-brief';
import type { BriefCopy } from '../../content/client-brief';
import type { BriefKind, BriefSection } from './types';

export interface BriefDefinition {
  copy: BriefCopy;
  sections: BriefSection[];
  subtitleAnswer?: string;
  includeWorkflowInPDF?: boolean;
}
export const clientBriefDefinitions: Record<BriefKind, BriefDefinition> = {
  prompt: { copy: promptBriefCopy, sections: promptBriefSections, includeWorkflowInPDF: true },
  mobile: {
    copy: mobileAppBriefCopy,
    sections: mobileAppBriefSections,
    includeWorkflowInPDF: true,
  },
  logo: { copy: logoBriefCopy, sections: logoBriefSections, subtitleAnswer: 'trading' },
  website: { copy: websiteBriefCopy, sections: websiteBriefSections, includeWorkflowInPDF: true },
};

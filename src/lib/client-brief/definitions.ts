import { mobileAppBriefCopy, mobileAppBriefSections } from '../../content/mobile-app-brief';
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
export const clientBriefDefinitions: Record<'logo' | 'website' | 'mobile', BriefDefinition> = {
  mobile: {
    copy: mobileAppBriefCopy,
    sections: mobileAppBriefSections,
    includeWorkflowInPDF: true,
  },
  logo: { copy: logoBriefCopy, sections: logoBriefSections, subtitleAnswer: 'trading' },
  website: { copy: websiteBriefCopy, sections: websiteBriefSections, includeWorkflowInPDF: true },
};

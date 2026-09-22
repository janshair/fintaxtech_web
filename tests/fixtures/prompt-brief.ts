import { emptyBrief } from '../../src/lib/client-brief/rules';

export function completePromptBrief() {
  const state = emptyBrief();
  state.answers = {
    content: ['Website content', 'Blog/article', 'Other'],
    contentOther: 'Customer guide',
    purpose: 'Explain',
    audience: ['Prospective customers', 'General public'],
    usage: ['Website', 'Downloadable PDF/document'],
    sourceStatus: 'Partly ready',
    sourceFormats: ['PDF', 'Existing web pages/URLs'],
    permission: 'Publicly available',
    tone: ['Professional', 'Friendly', 'Concise'],
    language: 'Another language',
    languageDetail: 'French',
    sensitivity: ['Technical', 'Legal/regulatory'],
    humanReview: 'Both',
    output: 'Combination',
    deadline: 'Yes',
    deadlineDate: '2026-12-31',
    deadlineReason: 'Business launch',
    approver: 'Group providing one consolidated decision',
    anything: 'Keep terminology consistent across all content.',
  };
  return state;
}

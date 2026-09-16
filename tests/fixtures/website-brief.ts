import { emptyBrief } from '../../src/lib/client-brief/rules';

export function completeWebsiteBrief(redesign = false) {
  const state = emptyBrief();
  state.answers = {
    project: redesign ? 'Complete redesign' : 'New website',
    ...(redesign ? { existingURL: 'https://example.org', retain: ['Domain'] } : {}),
    goals: ['Enquiries', 'Credibility'],
    audience: ['Businesses'],
    location: ['Local', 'One country'],
    localPlaces: 'Dundee',
    country: 'United Kingdom',
    pages: ['Home', 'About', 'Services', 'Contact'],
    action: 'Enquire',
    content: 'Customer provides all final copy',
    assets: ['None'],
    capabilities: ['Online payments', 'Other'],
    capabilitiesOther: 'Customer accounts for scope review',
    updates: 'FinTaxTech through separately agreed changes',
    domain: 'Already owned',
    domainProvider: 'Example domain provider',
    email: 'Not yet purchased',
    deadline: 'Yes',
    deadlineDate: '2026-12-31',
    deadlineReason: 'Business launch',
    anything: 'Please prioritise clear navigation and readable content.',
  };
  state.additionalPages = [
    { id: 'careers', name: 'Careers', purpose: 'Show open roles and how to apply.' },
    { id: 'press', name: 'Press', purpose: '' },
  ];
  return state;
}

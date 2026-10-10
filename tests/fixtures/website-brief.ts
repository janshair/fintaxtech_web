import { emptyBrief } from '../../src/lib/client-brief/rules';

export function completeWebsiteBrief(redesign = false) {
  const state = emptyBrief();
  state.answers = {
    project: redesign ? 'Complete redesign' : 'New website',
    ...(redesign ? { existingURL: 'https://example.org', retain: ['Domain'] } : {}),
    goals: 'Enquiries',
    secondaryGoals: ['Credibility'],
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

export function detailedWebsiteBrief() {
  const state = completeWebsiteBrief(true);
  state.answers = {
    ...state.answers,
    trading: 'Production Orchard Ltd',
    sector: 'Garden design',
    customerProblem: 'Homeowners seeking easy-to-maintain gardens.',
    differentiators: 'Seasonal planting expertise.',
    laterPages: 'Plant care library',
    content: 'FinTaxTech creates all copy from agreed source material',
    sourceMaterial: 'Approved service brochure and verified staff qualifications.',
    designPreferences: 'Warm green colours and clear type.',
    designAvoid: 'Avoid autoplay video.',
    assets: ['Logo/brand guidelines', 'Photos'],
    assetNotes: 'Existing brand palette and licensed photos available.',
    assetPermission: 'Some assets need permission',
    capabilities: [
      'Product catalogue',
      'Online payments',
      'Booking integration',
      'Custom booking functionality',
      'Multiple languages',
    ],
    catalogueBehaviour: 'Browse plants by category with enquiry links.',
    paymentProvider: 'Stripe',
    paymentBehaviour: 'Hosted checkout for agreed deposits.',
    bookingProvider: 'Calendly',
    bookingBehaviour: 'Embed the existing consultation widget.',
    customBookingBehaviour: 'Staff availability and manual confirmation, subject to scope review.',
    languageRequirements: 'UK English and French; client approves translations.',
    laterFeatures: 'Customer planting reminders',
    updateNeeds: 'Monthly service and pricing updates.',
    domainName: 'orchard.example',
    email: 'Already owned',
    emailProvider: 'Microsoft 365',
    businessEmailAddress: 'hello@orchard.example',
    hostingOwner: 'Customer account',
    hostingProvider: 'Existing host account',
    dnsOwner: 'Client operations manager',
    existingURLs: 'https://orchard.example/services\nhttps://orchard.example/old-contact',
    redirectNotes: 'Keep services; redirect old-contact to contact.',
    launchRequirements: 'Launch after client sign-off and DNS authorization.',
    approverName: 'Jamie Orchard',
    approvalEmail: 'jamie@orchard.example',
  };
  delete state.answers.capabilitiesOther;
  state.rows.priorityOfferings = [
    { id: 'design', values: { description: 'Garden planning consultations' } },
  ];
  state.rows.referenceWebsites = [
    {
      id: 'reference',
      values: {
        url: 'https://reference.example/design',
        explanation: 'The calm layout, clear navigation and strong typography.',
      },
    },
  ];
  return state;
}

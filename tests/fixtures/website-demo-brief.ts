import { emptyBrief } from '../../src/lib/client-brief/rules';

export function completeWebsiteDemoBrief() {
  const state = emptyBrief();
  state.answers = {
    trading: 'Demo Orchard Ltd',
    sector: 'Garden design',
    prioritySource: 'I will list up to three',
    primaryCustomers: ['Homeowners', 'Businesses'],
    demoBooking: 'Appointment enquiry / request',
    pricingDirection: 'Request a quote',
    assets: ['Logo', 'Brand guidance', 'Photos'],
    existingURL: 'https://orchard.example',
    serviceArea: 'Dundee and Angus',
    customerProblem: 'Local homeowners who need a manageable garden.',
    goals: 'Enquiries',
    action: 'Book',
    differentiators: 'Personal garden plans with seasonal advice.',
    designPreferences: 'Warm green colours, spacious layout and readable typography.',
    designAvoid: 'Avoid moving backgrounds.',
    assetNotes: 'Logo, brand colour guide and licensed garden photos available manually.',
    provisionalAssets: 'Provisional styling only',
    homepageSections: 'Introduction, services, team and contact.',
    verifiedFacts: 'Established in 2015. Approved service descriptions available.',
    approverName: 'Jamie Orchard',
    approvalEmail: 'jamie@orchard.example',
    success: 'A welcoming homepage with a clear route to book a consultation.',
    reviewDeadline: '2026-12-15',
  };
  state.rows.priorityOfferings = [
    { id: 'garden', values: { description: 'Garden planning and design consultations' } },
  ];
  state.rows.referenceWebsites = [
    {
      id: 'reference',
      values: {
        url: 'https://reference.example/gardens',
        explanation: 'The spacious layout, green colours and service navigation.',
      },
    },
  ];
  return state;
}

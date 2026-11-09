export const gymPackages = [
  {
    name: 'Website',
    monthly: 79,
    setup: 499,
    description: 'A managed website that helps prospective members discover your gym and enquire.',
    inclusions: [
      'Website customised from our gym template',
      'Your branding, photos, services and membership information',
      'Hosting and maintenance',
      'Working enquiry form',
      'Link or supported embed for your existing booking provider',
      'Basic search-engine setup',
      'Up to 30 minutes of routine website edits each month',
    ],
    note: '',
    cta: 'Enquire about a website',
  },
  {
    name: 'Connected Gym',
    monthly: 149,
    setup: 749,
    description: 'Your website and a gym-branded training experience inside Metoni.',
    inclusions: [
      'Everything in Website',
      'Your gym’s branded area inside the shared Metoni app',
      'Coach dashboard and member invitations',
      'Workout programme assignment',
      'Synchronised workout history and progress',
      'Gym announcements',
      'One location, up to 250 enrolled members and five staff accounts',
    ],
    note: 'Members download Metoni. This package does not include a separate app-store listing.',
    cta: 'Enquire about the pilot',
  },
  {
    name: 'Own Brand',
    monthly: 249,
    setup: 999,
    description: 'Your website and training app, presented under your gym’s brand.',
    inclusions: [
      'Everything in Connected Gym',
      'Your own app name and icon',
      'Separate Apple App Store and Google Play listings',
      'Assistance preparing your store listings',
      'Ongoing app maintenance',
      'One location, up to 250 enrolled members and five staff accounts',
    ],
    note: 'Requires gym-owned developer accounts and app-store approval.',
    cta: 'Discuss your branded app',
  },
];
export const gymCommercialDetails = [
  'Prices exclude VAT where applicable.',
  'Additional capacity: £50/month per extra 250 enrolled members. Archived members do not count.',
  'Multi-location packages are quoted separately.',
  'Domain registration, developer-account fees, third-party booking subscriptions and payment-processing fees are additional.',
  'Setup includes one template-based website, supporting policy pages and two revision rounds.',
  'Proposed subscriptions are monthly rolling with 30 days’ cancellation notice.',
  'Gym members pay no additional Metoni subscription for the service included in their gym’s package.',
];
export const gymQuestions: [string, string][] = [
  [
    'Will members download Metoni or our own app?',
    'With Connected Gym, members download Metoni and access your gym’s branded area inside the shared app. Own Brand proposes a separate app name, icon and listings in the Apple App Store and Google Play. It requires gym-owned developer accounts and app-store approval.',
  ],
  [
    'Does this replace our gym-management software?',
    'Initially, these packages complement your existing booking and payment tools. Your gym can continue using those systems alongside its website and training app.',
  ],
  [
    'What does booking integration include?',
    'A supported link or embed for your existing booking provider. Deeper integrations require separate scoping.',
  ],
  [
    'When will gym packages be available?',
    'Pilot enquiries are open. The gym packages are in development, and delivery scope and timing will be agreed before you commit.',
  ],
  [
    'Do these prices apply to individual Metoni users?',
    'These are business packages for gyms. Individual users can continue with the existing consumer app offer through the App Store and Google Play links on this page.',
  ],
];

export const metoniGym = {
  route: '/metoni/#for-gyms',
  title: 'Gym websites and white-label training app packages',
  summary:
    'FinTaxTech invites pilot enquiries for three Metoni gym packages: Website, Connected Gym and Own Brand. Options range from a managed gym website to a gym-branded area inside Metoni or a white-label app with separate store listings.',
  status:
    'Gym packages are in development. Pilot enquiries are open; features, delivery scope and launch timing will be agreed before you commit.',
  consumerScope:
    'The current consumer Metoni app is an offline workout tracker with no account required and on-device workout storage. Coach accounts, member invitations and synchronised workout history are planned gym-package features, not features already available in the consumer app.',
  heroLabel: 'For gym owners: website and white-label app packages (pilot enquiries)',
  packages: gymPackages,
  commercialDetails: gymCommercialDetails,
};

export const gymSuitabilityQuestion: [string, string] = [
  'Can I use Metoni for my gym?',
  `${metoniGym.summary} ${metoniGym.status} The packages initially complement your existing booking and payment tools; they are not a complete gym-management replacement.`,
];

export const gymPricingQuestion: [string, string] = [
  'What do the Metoni gym packages cost?',
  `${gymPackages.map((plan) => `${plan.name}: £${plan.monthly}/month plus £${plan.setup} one-time setup`).join('; ')}. These are proposed gym-package prices, not consumer app-store prices. ${gymCommercialDetails[0]} ${metoniGym.status}`,
];

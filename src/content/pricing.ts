// Published packages for /pricing/. Every amount is read from the same catalogue the
// matching estimate calculator uses, so a catalogue change updates this page too.
import brandingCatalogue from './branding-estimate/pricing.json';
import websiteCatalogue from './website-estimate/pricing.json';
import mobileCatalogue from './mobile-estimate/pricing.json';
import automationCatalogue from './ai-automation-estimate/pricing.json';

/** Shown after every price. Change here if the VAT treatment changes. */
export const vatSuffix = '+ VAT';

const brand = (id: string) => {
  const pricing = (
    brandingCatalogue.items as Record<
      string,
      { pricing: { amountMinor?: number | null; minimumAmountMinor?: number } }
    >
  )[id].pricing;
  return (pricing.amountMinor ?? pricing.minimumAmountMinor ?? 0) / 100;
};
const web = (id: keyof typeof websiteCatalogue.packages) =>
  (websiteCatalogue.packages[id].amountMinor ?? 0) / 100;
const webItem = (id: keyof typeof websiteCatalogue.items) =>
  (websiteCatalogue.items[id].amountMinor ?? 0) / 100;
const webPlan = (id: keyof typeof websiteCatalogue.monthlyPlans) =>
  websiteCatalogue.monthlyPlans[id].amountMinor / 100;
const app = (id: keyof typeof mobileCatalogue.catalogue) =>
  (mobileCatalogue.catalogue[id].amount_pence ?? 0) / 100;
const automation = automationCatalogue;

export const money = (pounds: number) =>
  `£${pounds.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

export interface PricingPackage {
  name: string;
  /** Pounds, before VAT. Omitted when the package is quoted after review. */
  price?: number;
  /** True when the figure is the lowest price for that package, not a fixed price. */
  from?: boolean;
  summary: string;
  includes: string[];
}
export interface PricingGroup {
  id: 'websites' | 'branding' | 'mobile-apps' | 'ai-automation';
  name: string;
  /** How the service reads mid-sentence, e.g. "a website". */
  noun: string;
  startingPrice: number;
  intro: string;
  packages: PricingPackage[];
  notes: string[];
  estimate: { href: string; label: string };
  examples: { href: string; label: string; text: string };
  service: string;
}

const logo = brand('branding.logo');
const basicStyle = brand('branding.guidelines.basic');
const fullGuidelines = brand('branding.guidelines.full');
const designSet = brand('branding.stationery');
const extraDesignItem =
  brandingCatalogue.items['branding.stationery'].pricing.additionalItemAmountMinor / 100;
const logoDays = brandingCatalogue.items['branding.logo'].estimatedDelivery;

const onePlatform = app('architecture.ios');
const bothPlatforms = app('architecture.both');
const starterDesign = app('design.standard.1_5');
const growthDesign = app('design.standard.6_10');
const growthScreens = app('screens.6_10');

const starter = automation.starter;
const addOns = automation.addOns;
const care = automation.supportPlans.find((plan) => plan.id === 'care')!.monthlyPrice;

const weeks = (id: 'business' | 'corporate' | 'shopify') => {
  const { min, max } = websiteCatalogue.packages[id].timelineWeeks;
  return `Typical delivery ${min}–${max} weeks`;
};

export const pricingGroups: PricingGroup[] = [
  {
    id: 'branding',
    name: 'Branding packages',
    noun: 'branding',
    startingPrice: designSet,
    intro:
      'Logo design, brand guidelines and the business materials that carry your identity. Combine them as a package or order one piece at a time.',
    packages: [
      {
        name: 'Design Set',
        price: designSet,
        from: true,
        summary: 'Stationery, marketing or social media designs for a brand you already have.',
        includes: [
          'Three items from one set, such as business card, letterhead and email signature',
          `Further items ${money(extraDesignItem)} each`,
          'Uses your existing logo and guidelines',
        ],
      },
      {
        name: 'Logo Design',
        price: logo,
        summary: 'A professional logo with the files you need to use it anywhere.',
        includes: [
          'Three initial concept directions',
          'Three consolidated revision rounds on your chosen concept',
          'Final files in SVG, PNG, PDF and JPG',
          'Colour, black-and-white and transparent versions',
          `Typical delivery ${logoDays.minimumBusinessDays}–${logoDays.maximumBusinessDays} working days`,
        ],
      },
      {
        name: 'Logo and Brand Style',
        price: logo + basicStyle,
        summary: 'Your logo plus a short style guide so it is used consistently.',
        includes: [
          'Everything in Logo Design',
          'Primary and secondary colours and typography',
          'Logo spacing, sizing and placement rules',
          'PDF brand style guide',
        ],
      },
      {
        name: 'Full Brand Identity',
        price: logo + fullGuidelines,
        summary: 'A logo and complete guidelines for a growing business.',
        includes: [
          'Everything in Logo Design',
          'Full colour system and typography',
          'Supporting visual elements and imagery guidance',
          'PDF brand guidelines document',
        ],
      },
      {
        name: 'Brand Launch Kit',
        price: logo + fullGuidelines + designSet,
        summary: 'Everything a new business needs to look established from day one.',
        includes: [
          'Everything in Full Brand Identity',
          'One Design Set of three items',
          'Stationery, marketing or social media set, your choice',
        ],
      },
    ],
    notes: [
      'Business naming, trademark searches and printing are not included. Extra concepts and revision rounds are agreed before any extra work starts.',
    ],
    estimate: { href: '/estimate/branding/', label: 'Get a branding estimate' },
    examples: {
      href: '/templates/branding/',
      label: 'Browse branding styles',
      text: 'See logo and identity styles before you decide.',
    },
    service: '/services/branding/',
  },
  {
    id: 'websites',
    name: 'Website packages',
    noun: 'a website',
    startingPrice: web('placeholder'),
    intro:
      'Fixed-price website packages for new businesses and complete redesigns. Pick a package, choose a design you like, and we build it around your content.',
    packages: [
      {
        name: websiteCatalogue.packages.placeholder.label,
        price: web('placeholder'),
        summary: 'A single page that puts your business online quickly.',
        includes: [
          'One responsive static page',
          'Your existing logo and brand colours',
          'Business name, tagline, email and WhatsApp button',
          'One minor revision',
        ],
      },
      {
        name: websiteCatalogue.packages.landing.label,
        price: web('landing'),
        summary: 'One scrolling page built around a single offer or campaign.',
        includes: [
          'Headline, introduction and call to action',
          'Services or key benefits section',
          'Contact details and contact call to action',
          'One revision',
        ],
      },
      {
        name: websiteCatalogue.packages.business.label,
        price: web('business'),
        summary: 'The standard website for a small business.',
        includes: [
          `Up to ${websiteCatalogue.packages.business.standardPageAllowance} pages with branded layouts`,
          'Contact form, map, gallery and testimonials',
          'Essential SEO, AEO and GEO',
          'Launch on your existing domain with HTTPS',
          weeks('business'),
        ],
      },
      {
        name: websiteCatalogue.packages.corporate.label,
        price: web('corporate'),
        summary: 'A larger site your team can edit without a developer.',
        includes: [
          `Up to ${websiteCatalogue.packages.corporate.standardPageAllowance} pages with premium layouts`,
          'Content management system and handover',
          'Case studies or portfolio layouts',
          'Analytics and search performance setup',
          weeks('corporate'),
        ],
      },
      {
        name: websiteCatalogue.packages.shopify.label,
        price: web('shopify'),
        summary: 'An online shop on Shopify, ready to take orders.',
        includes: [
          `Storefront with up to ${websiteCatalogue.packages.shopify.initialProductAllowance} products loaded`,
          'Basket, checkout and one standard payment gateway',
          'Shipping, tax, inventory and order setup',
          'Store training and handover',
          weeks('shopify'),
        ],
      },
      {
        name: websiteCatalogue.packages.custom_web_app.label,
        summary: 'Accounts, dashboards, booking engines and other custom software.',
        includes: [
          'Scoped around your process and users',
          'Back end, database and integrations',
          'Price, timeline and milestones agreed after review',
        ],
      },
    ],
    notes: [
      `Extra pages cost ${money(webItem('page_standard'))} each. A content management system can be added to the Business Website for ${money(webItem('cms'))}.`,
      `Optional hosting and care plans start at ${money(webPlan('hosting_essentials'))} a month. The Placeholder Website and Single Landing Page are fixed-scope and do not include SEO services, forms beyond those listed, or hosting.`,
    ],
    estimate: { href: '/estimate/website/', label: 'Get a website estimate' },
    examples: {
      href: '/templates/website/',
      label: 'Browse website designs',
      text: 'Choose your favourite design.',
    },
    service: '/services/websites/',
  },
  {
    id: 'mobile-apps',
    name: 'Mobile app packages',
    noun: 'a mobile app',
    startingPrice: onePlatform + starterDesign,
    intro:
      'App prices are built from the platforms, screens and features you need. These three packages show where most projects start.',
    packages: [
      {
        name: 'Starter App',
        price: onePlatform + starterDesign,
        from: true,
        summary: 'A focused app for iPhone or Android.',
        includes: [
          'One platform: iOS or Android',
          'Architecture, navigation and up to five screens',
          'Standard interface design',
          'Standard testing before release',
        ],
      },
      {
        name: 'iOS and Android App',
        price: bothPlatforms + starterDesign,
        from: true,
        summary: 'The same starter scope released on both platforms.',
        includes: [
          'iOS and Android from a shared codebase',
          'Architecture, navigation and up to five screens',
          'Standard interface design',
          'Standard testing before release',
        ],
      },
      {
        name: 'Growth App',
        price: bothPlatforms + growthScreens + growthDesign,
        from: true,
        summary: 'A fuller product with more screens on both platforms.',
        includes: [
          'iOS and Android from a shared codebase',
          'Six to ten screens',
          'Standard interface design for every screen',
          'Features, back end and admin panel priced from your list',
        ],
      },
    ],
    notes: [
      `Features are added to the package price, for example login ${money(app('feature.registration'))}, push notifications ${money(app('feature.push'))} and online payments ${money(app('feature.payments'))}. A back end starts at ${money(app('backend.basic'))}.`,
      `App Store or Google Play publishing costs ${money(app('publishing.apple'))} for one store or ${money(app('publishing.both'))} for both. Optional maintenance starts at ${money(app('maintenance.basic'))} a month. Every app estimate is confirmed after a technical review.`,
    ],
    estimate: { href: '/estimate/mobile/', label: 'Get a mobile app estimate' },
    examples: {
      href: '/templates/mobile-apps/',
      label: 'Browse app concepts',
      text: 'See example app concepts for booking, loyalty and field work.',
    },
    service: '/services/mobile-apps/',
  },
  {
    id: 'ai-automation',
    name: 'AI automation packages',
    noun: 'AI automation',
    startingPrice: starter.price,
    intro:
      'One defined business process, automated and handed over with documentation. Add steps, connections or a knowledge base as the workflow grows.',
    packages: [
      {
        name: 'Starter Automation',
        price: starter.price,
        summary: 'One repetitive process turned into a reviewed workflow.',
        includes: [
          `${starter.includedWorkflows} workflow with up to ${starter.includedStandardSteps} standard steps`,
          `${starter.includedSupportedConnections} supported tool connections`,
          'Error notifications, logging, testing and deployment',
          `Documentation, handover and a ${starter.defectWarrantyDays}-day defect warranty`,
          `Typical delivery ${starter.targetDeliveryWorkingDays.min}–${starter.targetDeliveryWorkingDays.max} working days`,
        ],
      },
      {
        name: 'Assistant with Knowledge Base',
        price: starter.price + addOns.knowledgeBaseSetup.price,
        summary: 'A starter workflow that answers from your approved information.',
        includes: [
          'Everything in Starter Automation',
          `Knowledge base of up to ${addOns.knowledgeBaseSetup.maxApprovedFaqEntries} approved FAQ entries`,
          'Answers limited to information you have approved',
        ],
      },
      {
        name: 'Multi-Workflow Automation',
        price: starter.price + addOns.additionalIndependentWorkflow.startingPrice,
        from: true,
        summary: 'Two or more connected processes, scoped after review.',
        includes: [
          'Everything in Starter Automation',
          `Each further workflow from ${money(addOns.additionalIndependentWorkflow.startingPrice)}`,
          'Scope confirmed after a manual review',
        ],
      },
    ],
    notes: [
      `Extra steps cost ${money(addOns.additionalStandardStep.price)} each and extra tool connections ${money(addOns.additionalSupportedConnection.price)} each. Optional monitoring starts at ${money(care)} a month.`,
      'AI platform and usage fees from third parties are paid by you and are not included. Sensitive or regulated processes may be declined.',
    ],
    estimate: { href: '/estimate/ai-automation/', label: 'Get an AI automation estimate' },
    examples: {
      href: '/templates/ai-automation/',
      label: 'Browse automation examples',
      text: 'See example workflows by industry.',
    },
    service: '/services/ai-automation/',
  },
];

export const priceLabel = (pkg: PricingPackage) =>
  pkg.price === undefined
    ? 'Quoted after review'
    : `${pkg.from ? 'From ' : ''}${money(pkg.price)} ${vatSuffix}`;
export const startingLabel = (group: PricingGroup) =>
  `from ${money(group.startingPrice)} ${vatSuffix}`;

const group = (id: PricingGroup['id']) => pricingGroups.find((g) => g.id === id)!;
const priceOf = (id: PricingGroup['id'], name: string) =>
  money(group(id).packages.find((pkg) => pkg.name === name)!.price!);

export const pricingCopy = {
  title: 'Pricing: packages and starting prices',
  intro: `Clear starting prices for every service. Branding ${startingLabel(group('branding'))}, websites ${startingLabel(group('websites'))}, mobile apps ${startingLabel(group('mobile-apps'))} and AI automation ${startingLabel(group('ai-automation'))}.`,
  seoTitle: 'Website, App, Branding & AI Automation Prices UK',
  seoDescription: `FinTaxTech prices: branding from ${money(group('branding').startingPrice)}, websites from ${money(group('websites').startingPrice)}, mobile apps from ${money(group('mobile-apps').startingPrice)} and AI automation from ${money(group('ai-automation').startingPrice)}, all ${vatSuffix}. Compare packages and get an instant estimate.`,
  summaryLabel: 'Starting prices by service',
  heroLabel:
    'An estimate sheet listing starting prices for branding, websites, mobile apps and AI automation.',
  heroCaption: 'Starting from',
  basis:
    'All prices are in pounds sterling and exclude VAT. They are one-off project prices unless marked monthly. Domains, hosting, app-store and third-party fees are separate.',
  faqTitle: 'Common pricing questions',
  howTitle: 'How pricing works',
  serviceLink: 'About this service',
  estimateTitle: 'Get your estimate',
  estimateText:
    'Answer a few questions and see a price for your own project. Estimates are free, stay in your browser and create no obligation.',
  promoLead: 'Starting a new UK company?',
};

export const pricingFaqs: [string, string][] = [
  [
    'How much does a website cost in the UK?',
    `A FinTaxTech website costs from ${priceOf('websites', 'Placeholder Website')} ${vatSuffix} for a one-page placeholder site. A five-page Business Website is ${priceOf('websites', 'Business Website')}, a ten-page Corporate Website with a content management system is ${priceOf('websites', 'Corporate Website')} and a Shopify online shop is ${priceOf('websites', 'Shopify E-commerce')}, all ${vatSuffix}. Custom web applications are quoted after review.`,
  ],
  [
    'How much does a logo or brand identity cost?',
    `Logo design costs ${priceOf('branding', 'Logo Design')} ${vatSuffix}, including three concepts and three revision rounds. A logo with full brand guidelines costs ${priceOf('branding', 'Full Brand Identity')} ${vatSuffix}. Stationery, marketing and social media design sets start at ${money(designSet)} ${vatSuffix} for three items.`,
  ],
  [
    'How much does it cost to build a mobile app?',
    `A FinTaxTech mobile app starts at ${priceOf('mobile-apps', 'Starter App')} ${vatSuffix} for one platform with up to five designed screens. The same scope on both iOS and Android starts at ${priceOf('mobile-apps', 'iOS and Android App')} ${vatSuffix}. Features such as login, payments and push notifications, a back end and store publishing are added to that price.`,
  ],
  [
    'How much does AI automation cost for a small business?',
    `AI automation starts at ${money(starter.price)} ${vatSuffix} for one workflow with up to ${starter.includedStandardSteps} steps and ${starter.includedSupportedConnections} tool connections, delivered in ${starter.targetDeliveryWorkingDays.min}–${starter.targetDeliveryWorkingDays.max} working days. Optional monitoring costs from ${money(care)} a month. Third-party AI usage fees are separate.`,
  ],
  [
    'Do the prices include VAT?',
    'No. Every price on this page excludes VAT. The tax treatment for your project is confirmed in the written proposal and on the invoice.',
  ],
  [
    'Are there monthly costs after launch?',
    `Only if you choose them. Website hosting and care plans start at ${money(webPlan('hosting_essentials'))} a month, automation monitoring at ${money(care)} a month and app maintenance at ${money(app('maintenance.basic'))} a month. Domain, hosting, app-store and third-party platform fees are paid to those providers in your own name.`,
  ],
  [
    'Can I choose the design of my website?',
    'Yes. Browse the FinTaxTech website designs, choose your favourite and we adapt it to your brand, content and pages. You can also supply your own design direction.',
  ],
];

/** Plain-text summary for llms.txt. */
export const pricingSummaryText = () =>
  [
    '## Pricing',
    '',
    `[Pricing and packages](https://fintaxtech.co.uk/pricing/): published starting prices in GBP. ${pricingCopy.basis}`,
    '',
    ...pricingGroups.flatMap((g) => [
      `- ${g.name}, ${startingLabel(g)}: ${g.packages
        .map((pkg) => `${pkg.name} (${priceLabel(pkg)})`)
        .join(
          '; ',
        )}. [${g.name.replace(' packages', '')} service](https://fintaxtech.co.uk${g.service}).`,
    ]),
  ].join('\n');

// Published packages for /pricing/. Every amount is read from the same catalogue the
// matching estimate calculator uses, so a catalogue change updates this page too.
import brandingCatalogue from './branding-estimate/pricing.json' with { type: 'json' };
import websiteCatalogue from './website-estimate/pricing.json' with { type: 'json' };
import mobileCatalogue from './mobile-estimate/pricing.json' with { type: 'json' };
import automationCatalogue from './ai-automation-estimate/pricing.json' with { type: 'json' };

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
const logoDays = brandingCatalogue.items['branding.logo'].estimatedDelivery;

const onePlatform = app('architecture.ios');
const bothPlatforms = app('architecture.both');
const starterDesign = app('design.standard.1_5');
const growthDesign = app('design.standard.6_10');
const growthScreens = app('screens.6_10');

const starter = automation.starter;
const addOns = automation.addOns;

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
          `Further items can be agreed to suit the project`,
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
      'FinTaxTech supplies design files. Business naming, trademark searches and supplier production are outside the scope. Extra concepts and revision rounds are agreed before any extra work starts.',
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
      `We can agree extra pages or add a content management system to the Business Website.`,
      `Optional hosting and care plans are discussed separately. The Placeholder Website and Single Landing Page are fixed-scope and do not include SEO services, forms beyond those listed, or hosting.`,
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
      `We scope features such as login, push notifications, payments and back-end services around your requirements.`,
      `We can agree publishing support for the App Store and Google Play, as well as ongoing maintenance.`,
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
          `Additional workflows can be agreed separately`,
          'Scope confirmed after a manual review',
        ],
      },
    ],
    notes: [
      `We discuss any extra steps, tool connections and ongoing monitoring before agreeing the scope.`,
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

export const pricingCopy = {
  title: 'Project packages and proposals',
  intro: 'Compare what is included in our branding, website, mobile app and AI automation packages. We review your requirements before proposing a scope.',
  seoTitle: 'Website, App, Branding & AI Automation Packages UK',
  seoDescription: 'Compare FinTaxTech project packages for branding, websites, mobile apps and AI automation. Tell us what you need for a written proposal.',
  summaryLabel: 'Packages by service',
  heroLabel: 'Project packages for branding, websites, mobile apps and AI automation.',
  heroCaption: 'Project packages',
  basis: 'We confirm the agreed scope and any third-party costs in your written proposal.',
  faqTitle: 'Common questions',
  howTitle: 'How we prepare a proposal',
  serviceLink: 'About this service',
  estimateTitle: 'Request a proposal',
  estimateText: 'Tell us what you would like to create and the tools you already use. We review the details before sending a proposal.',
  promoLead: 'Starting a new UK company?',
};

export const pricingFaqs: [string, string][] = [
  ['What affects the scope of a website?', 'We look at the pages, content, design and features your customers need, including any booking, shop or other tools the site should connect to.'],
  ['What is included in branding?', 'We agree the logo, guidelines and artwork you need before starting. FinTaxTech provides design files for you and your chosen suppliers.'],
  ['How do you scope a mobile app?', 'We discuss the platforms, screens, device features and integrations your users need, along with testing and support.'],
  ['How do you scope AI automation?', 'We review the workflow, tools, source information and points where a person needs to approve the result.'],
  ['Can I choose the design of my website?', 'Yes. Browse the FinTaxTech website designs, choose your favourite and we adapt it to your brand, content and pages. You can also supply your own design direction.'],
];

export const pricingSummaryText = () =>
  [
    '## Project packages',
    '',
    '[Project packages](https://fintaxtech.co.uk/pricing/): compare scope and ask for a written proposal.',
    '',
    ...pricingGroups.map(
      (group) => `- ${group.name}: ${group.packages.map(({ name }) => name).join('; ')}. [About this service](https://fintaxtech.co.uk${group.service}).`,
    ),
  ].join('\n');

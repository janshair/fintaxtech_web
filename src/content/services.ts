import type { ServiceId } from '../lib/types';
export const services = [
  {
    id: 'branding',
    name: 'Branding and Graphic Design',
    short: 'Brand or graphic design',
    description: 'A recognisable identity you can use across everything you publish.',
    title: 'Give your business a clear identity.',
    capabilities: [
      'Logo systems',
      'Brand direction and visual strategy',
      'Stationery and marketing assets',
      'Compact or extended brand guidelines',
      'Human refinement of AI-assisted concepts',
    ],
    suits:
      'New businesses, growing brands, new products, and organisations ready for a clearer visual direction.',
    boundary:
      'No trademark availability or legal exclusivity guarantee. Naming, extra concepts, and source files must be agreed in the proposal.',
    ownership:
      'You approve the brief and visual direction. Agreed final assets transfer after full payment; editable source is included only where agreed.',
    number: '01',
  },
  {
    id: 'websites',
    name: 'Website Design and Development',
    short: 'Website',
    description: 'A new site, built to explain what you do and bring in enquiries.',
    title: 'A website that moves your business forward.',
    capabilities: [
      'Brochure websites and landing pages',
      'Complete redesigns and rebuilds',
      'Ecommerce and booking experiences',
      'Web applications, dashboards and accounts',
      'Back ends, databases and integrations',
    ],
    suits: 'Businesses launching a new website or replacing their existing design and codebase.',
    boundary:
      'New websites and complete rebuilds only. We do not repair, debug, extend, or take over abandoned legacy code.',
    ownership:
      'Your repository, domain, email, analytics, and service accounts stay in your name. Supply one approved Website Content File, or commission content creation separately.',
    number: '02',
  },
  {
    id: 'mobile-apps',
    name: 'Mobile App Development',
    short: 'Mobile app',
    description: 'An app your customers or your team can use every day.',
    title: 'Turn a product idea into an app people can use.',
    capabilities: [
      'Native Android and iOS',
      'Kotlin Multiplatform and Flutter',
      'Product planning and UX/UI',
      'Back-end services and administration tools',
      'Quality assurance and store-submission support',
    ],
    suits:
      'Founders, internal teams, and businesses creating a new mobile product or commissioning a complete rebuild.',
    boundary:
      'New builds and complete rebuilds only. Legacy-code repair and partial rescue projects are outside our scope. Store approval cannot be guaranteed.',
    ownership:
      'You own app-store, cloud, infrastructure, and related accounts. You approve the specification and provide access and approved content.',
    number: '03',
  },
  {
    id: 'prompt-services',
    name: 'Prompt Services',
    short: 'Content from my documents',
    description: 'Turn source documents into the content you need, reviewed by a person.',
    title: 'Turn source documents into useful content.',
    capabilities: [
      'Content creation and rewriting',
      'Summarisation and extraction',
      'Restructuring and conversion',
      'Analysis and recommendations',
      'Human editorial review',
    ],
    suits: 'Teams with source documents who need clear, structured content for a defined audience.',
    boundary:
      'A managed service, with no downloadable prompt products. Highly sensitive or regulated material requires review and may be declined.',
    ownership:
      'You must have authority to supply and process the material. After engagement, transfer documents securely. Internal prompts, workflows, and templates remain ours.',
    number: '04',
  },
] satisfies {
  id: ServiceId;
  name: string;
  short: string;
  description: string;
  title: string;
  capabilities: string[];
  suits: string;
  boundary: string;
  ownership: string;
  number: string;
}[];
export const serviceCopy = {
  title: 'Four ways to move your business forward.',
  intro:
    'Brands, websites, mobile apps, and managed content services. Choose a starting point. We will help make the requirements clear.',
  capabilities: 'What we can create',
  suits: 'Is this the right fit?',
  boundary: 'A clear scope from the start',
  ownership: 'Ownership and your part in the project',
  process: 'How we work together',
  processText:
    'Describe your requirements, share your enquiry PDF, and agree a written proposal. We produce the work, gather consolidated feedback, and deliver after approval and full payment.',
  lead: 'Start a project enquiry',
  brief: 'Complete a detailed brief',
  briefText: 'Already discussing the project with us? Use the detailed requirements brief.',
  faq: 'Questions before we begin',
};

export type Service = (typeof services)[number];

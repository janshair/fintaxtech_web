import { company } from './site';
import { googleBusinessProfile } from './social';

export interface LocationPage {
  name: string;
  slug: string;
  seoTitle: string;
  description: string;
  h1: string;
  intro: string;
  availability: string;
  sectionTitle: string;
  paragraphs: string[];
  faqTitle: string;
  faqs: [string, string][];
  canonical: string;
  welcomeHeading: string;
  office?: { label: string; address: string; profileLabel: string; profileURL: string };
}

export const locationCopy = { areasTitle: 'Areas We Serve' };

export const locations: LocationPage[] = [
  {
    name: 'Dundee',
    slug: 'dundee',
    seoTitle: 'Software Company in Dundee | Websites, Apps & Automation',
    description:
      'FinTaxTech is a Dundee-based software and creative business. Plan a new website, mobile app, brand or AI automation workflow with a clear written scope.',
    h1: 'A software company in Dundee for websites, apps and automation.',
    intro:
      'FinTaxTech helps businesses turn a website, mobile app or automation idea into an agreed plan. Branding and graphic design can be scoped alongside the software so your digital presence has a consistent identity.',
    availability:
      'Based in Dundee, Scotland. Projects are delivered remotely, with email, WhatsApp and Zoom available to discuss your requirements.',
    sectionTitle: 'Planning a digital project from Dundee',
    paragraphs: [
      'For a Dundee business, the first decision is what customers or staff need to do. A public website may need to explain services and generate enquiries; an internal tool may need accounts, records and a repeatable process. We help distinguish those needs before agreeing the build.',
      'Our registered office is in Dundee, and our delivery process is remote. Share your requirements digitally and agree the pages, app features or workflow, content responsibilities and business accounts in a written proposal. A Dundee address does not mean a walk-in service or an in-person appointment is included.',
    ],
    faqTitle: 'Working with FinTaxTech in Dundee',
    faqs: [
      [
        'Is FinTaxTech based in Dundee?',
        'Yes. Fintaxtech Ltd is registered at 79 Yarrow Terrace, Dundee, Scotland, DD2 4DX. FinTaxTech delivers projects remotely; the registered office is not advertised as a walk-in customer location.',
      ],
      [
        'Can you help decide between a website and custom software?',
        'Yes. Start with the tasks visitors or staff need to complete. A website, mobile app or back-end integration can then be scoped around those tasks. New builds and complete rebuilds are supported; legacy-code repairs are outside our scope.',
      ],
      [
        'How can a Dundee business start a project?',
        'Choose a service and prepare your requirements through Start Your Project. We review the scope before confirming deliverables, timing and charges in a written proposal. Preparing an enquiry does not commit you to a project.',
      ],
    ],
    canonical: `${company.url}/locations/dundee/`,
    welcomeHeading: 'What would you like to create for your Dundee business?',
    office: {
      label: 'Dundee registered office',
      address: company.address,
      profileLabel: googleBusinessProfile.label,
      profileURL: googleBusinessProfile.url,
    },
  },
  {
    name: 'Edinburgh',
    slug: 'edinburgh',
    seoTitle: 'Software Services for Edinburgh Businesses | Remote Delivery',
    description:
      'Websites, mobile apps, branding and AI automation for Edinburgh businesses, delivered remotely by Dundee-based FinTaxTech. No Edinburgh office.',
    h1: 'Software and digital services for Edinburgh businesses.',
    intro:
      'Plan a website, mobile app or business workflow with a clear scope and remote collaboration. FinTaxTech brings software development, branding and AI automation together around the work your business needs to do.',
    availability:
      'FinTaxTech is based in Dundee and works remotely with businesses in Edinburgh. We do not have an Edinburgh office.',
    sectionTitle: 'Keeping an Edinburgh project clear across a remote team',
    paragraphs: [
      'If colleagues or decision-makers in Edinburgh need to approve a new digital service, settle who supplies content, who signs off and which features belong in the first release. One consolidated feedback list per revision round helps keep decisions coherent without requiring everyone to attend in person.',
      'Remote delivery means your location does not determine which accounts you control. Your repository, domain, email, analytics and app-store accounts remain in your name. We agree access and responsibilities in the proposal rather than relying on office visits or informal handovers.',
    ],
    faqTitle: 'Remote projects for Edinburgh businesses',
    faqs: [
      [
        'Do you have an office in Edinburgh?',
        'No. FinTaxTech is based in Dundee and serves Edinburgh businesses remotely. Email, WhatsApp and Zoom support the project discussions; this page does not describe an Edinburgh branch.',
      ],
      [
        'How does approval work when our team is in Edinburgh?',
        'Nominate an approver and provide consolidated feedback at the agreed review stages. The written proposal defines deliverables, revision rounds and responsibilities so remote reviews have a clear decision process.',
      ],
      [
        'Can we commission branding alongside a new website?',
        'Yes. Branding and website work can be scoped together. Agree the logo and visual assets, website content and pages, and the final files to be delivered. Additional work is included only when agreed in the proposal.',
      ],
    ],
    canonical: `${company.url}/locations/edinburgh/`,
    welcomeHeading: 'What would you like to create for your Edinburgh business?',
  },
  {
    name: 'Glasgow',
    slug: 'glasgow',
    seoTitle: 'Software Services for Glasgow Businesses | Remote Delivery',
    description:
      'Plan websites, mobile apps and AI-assisted workflows for your Glasgow business with Dundee-based FinTaxTech. Remote delivery, with no Glasgow office.',
    h1: 'Websites, apps and software services for Glasgow businesses.',
    intro:
      'Start with the customer journey or operational task you want to improve. FinTaxTech scopes new websites, mobile apps and automation workflows for Glasgow businesses, with branding available where the project needs it.',
    availability:
      'FinTaxTech is based in Dundee and delivers remotely to businesses in Glasgow. We do not have a Glasgow office.',
    sectionTitle: 'Scoping customer-facing and operational software in Glasgow',
    paragraphs: [
      'A Glasgow business planning bookings, orders or a staff workflow needs more than a list of screens. Identify where information comes from, which existing systems must connect and who approves exceptions. Those decisions help distinguish a straightforward website from an application or integration project.',
      'For teams working away from a desk, discuss device features and unreliable connectivity before deciding on a mobile app. For automation, describe the repetitive process and the points that need human review. We assess source quality, access, privacy and risk before agreeing what can be delivered remotely.',
    ],
    faqTitle: 'Software projects for Glasgow businesses',
    faqs: [
      [
        'Is FinTaxTech located in Glasgow?',
        'No. FinTaxTech is based in Dundee and works with Glasgow businesses remotely. There is no Glasgow office or local walk-in service.',
      ],
      [
        'Can you connect a website or app to our business tools?',
        'Back-end services and integrations can be scoped where system access and suitable APIs are available. Describe the tools, required information and intended result. Feasibility and third-party costs are reviewed before inclusion in the proposal.',
      ],
      [
        'Can we start with an automation workflow instead of an app?',
        'Yes. Describe the current process, the source information and the result you need. We assess whether an AI-assisted workflow is appropriate, including human approvals and exceptions. Fully autonomous or error-free decisions are not promised.',
      ],
    ],
    canonical: `${company.url}/locations/glasgow/`,
    welcomeHeading: 'What would you like to create for your Glasgow business?',
  },
];

// Exact allowlist matching: raw query text is never used in page copy or links.
export const locationFromSlug = (slug: string | null | undefined) =>
  locations.find((location) => location.slug === slug);
export const locationFromPath = (path: string) =>
  locations.find((location) => path === `/locations/${location.slug}/`);
export const locationStartURL = (location: LocationPage) => `/start/?location=${location.slug}`;

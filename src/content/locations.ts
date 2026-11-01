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

// Edit shared wording here once. Add a city to the array to generate its page.
export const locations: LocationPage[] = [
  'London',
  'Birmingham',
  'Manchester',
  'Leeds',
  'Liverpool',
  'Newcastle upon Tyne',
  'Sheffield',
  'Bristol',
  'Leicester',
  'Coventry',
  'Nottingham',
  'Kingston upon Hull',
  'Bradford',
  'Stoke-on-Trent',
  'Wolverhampton',
  'Plymouth',
  'Southampton',
  'Reading',
  'Derby',
  'Glasgow',
  'Edinburgh',
  'Aberdeen',
  'Dundee',
  'Dunfermline',
  'Inverness',
  'Perth',
  'Stirling',
  'Cardiff',
  'Swansea',
  'Newport',
  'Bangor',
  'St Asaph',
  'St Davids',
  'Wrexham',
  'Belfast',
  'Derry',
  'Lisburn',
  'Newry',
  'Armagh',
  'England',
  'Scotland',
  'Wales',
  'Northern Ireland',
  'NorthernIreland',
  'NI',
].map((name): LocationPage => {
  const city = {
    name,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    isBase: name === 'Dundee',
  };
  return {
    name: city.name,
    slug: city.slug,
    seoTitle: city.isBase
      ? `Software Company in ${city.name} | Websites, Apps & Automation`
      : `Software Services for ${city.name} Businesses | Remote Delivery`,
    description: `Websites, mobile apps, branding and AI automation for ${city.name} businesses, delivered remotely by Dundee-based FinTaxTech.`,
    h1: city.isBase
      ? `A software company in ${city.name} for websites, apps and automation.`
      : `Software and digital services for ${city.name} businesses.`,
    intro: `Plan a website, mobile app or automation workflow for your ${city.name} business. FinTaxTech helps define the tasks, content and integrations before agreeing the project scope.`,
    availability: city.isBase
      ? 'Based in Dundee, Scotland. Projects are delivered remotely, with email, WhatsApp and Zoom available to discuss your requirements.'
      : `FinTaxTech is based in Dundee and works remotely with businesses in ${city.name}. We do not have an office in ${city.name}.`,
    sectionTitle: `Planning a remote project for your ${city.name} business`,
    paragraphs: [
      `Start with what customers or staff in ${city.name} need to do. Describe the current process, the tools involved and the result you want, so we can distinguish a public website from a mobile app or integration project.`,
      'Agree the deliverables, content responsibilities, revision rounds and business accounts in a written proposal. Projects are delivered remotely through email, WhatsApp and Zoom; your location does not change ownership of your business accounts.',
    ],
    faqTitle: `Working with FinTaxTech in ${city.name}`,
    faqs: [
      [
        `Do you have an office in ${city.name}?`,
        city.isBase
          ? `Yes. Our registered office is ${company.address}. Projects are delivered remotely; the registered office is not advertised as a walk-in customer location.`
          : `No. FinTaxTech is based in Dundee and serves ${city.name} businesses remotely. This page describes our service area, not a local branch or walk-in office.`,
      ],
      [
        `How can my ${city.name} business start a project?`,
        'Choose a service and prepare your requirements through Start Your Project. Deliverables, timing and charges are confirmed in a written proposal before work begins.',
      ],
    ],
    ...(city.isBase
      ? {
          office: {
            label: `${city.name} registered office`,
            address: company.address,
            profileLabel: googleBusinessProfile.label,
            profileURL: googleBusinessProfile.url,
          },
        }
      : {}),
    canonical: `${company.url}/locations/${city.slug}/`,
    welcomeHeading: `What would you like to create for your ${city.name} business?`,
  };
});

// Exact allowlist matching: raw query text is never used in page copy or links.
export const locationFromSlug = (slug: string | null | undefined) =>
  locations.find((location) => location.slug === slug);
export const locationFromPath = (path: string) =>
  locations.find((location) => path === `/locations/${location.slug}/`);
export const locationStartURL = (location: LocationPage) => `/start/?location=${location.slug}`;

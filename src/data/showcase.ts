import type { ServiceId } from '../lib/types';

/** One part of a kit, listed in the page's structured data (an ItemList). */
export interface ShowcasePart {
  /** Section id on the kit page, e.g. "brand" for /work/garage/#brand. */
  anchor: string;
  name: string;
  /** Where the part lives, when not its section on the kit page (e.g. a live template). */
  url?: string;
  image?: string;
  /** The service page this part demonstrates, if there is one. */
  service?: ServiceId;
}

/** One growth kit per trade. Add a new trade by adding one entry here. */
export interface ShowcaseEntry {
  id: string;
  trade: string;
  /** Page title, without the " | FinTaxTech" suffix (keep the total under 60 characters). */
  title: string;
  /** Card text on /work/ and the page's meta description (under 160 characters). */
  description: string;
  /** Open Graph / Twitter description, when it should differ from the meta description. */
  socialDescription?: string;
  image: { src: string; alt: string; width: number; height: number };
  url: string;
  /** ISO date the kit was first published; used in structured data. */
  datePublished: string;
  /** The invented business the kit is designed for (always fictional). */
  sampleBusiness: string;
  parts: ShowcasePart[];
  /** Visible FAQ on the kit page; also emitted as FAQPage. */
  faqs?: { question: string; answer: string; schemaAnswer?: string }[];
  /** Lines for /llms.txt; defaults to one generated line. */
  llms?: string[];
}

/**
 * /work/ shows two kinds of work, kept apart so nobody mistakes one for the other:
 * live client projects (finished, built for real businesses and live today) first,
 * then concept growth kits (skill demonstrations made for invented businesses).
 */
export const showcaseIndex = {
  route: '/work/',
  title: 'Our work: client projects and concept kits',
  description:
    'Live websites and apps FinTaxTech has built for real clients, plus concept growth kits that show what we can design for a small business.',
  intro:
    'Two kinds of work, kept separate. Client projects are finished and live for real businesses. Concept kits are not client work: they use invented businesses to show what we can design.',
  navLabel: 'Our work',
  jumpLabel: 'On this page',
  live: {
    id: 'client-projects',
    eyebrow: 'Finished and live',
    title: 'Client projects',
    intro:
      'Websites and apps we have built for real businesses. Each one is finished, launched and in use today.',
    badge: 'Live',
  },
  concepts: {
    id: 'concept-kits',
    eyebrow: 'What we can do',
    title: 'Concept kits',
    intro:
      'These are not client projects. Each kit uses an invented business to show how we would design a website, brand, customer app and AI automation together for one trade.',
    badge: 'Concept',
    sampleLabel: 'Invented business:',
  },
  cardLink: 'See the kit',
  llmsHeading: '## Our work: concept growth kits',
};

const redirect = (route: string, destination: string, name: string) => ({
  route,
  destination,
  title: `Continue to ${name}`,
  message: `This page has moved to ${name}. Follow the link below if you are not redirected automatically.`,
  label: `Go to ${name}`,
});

/** Old addresses that now live under /work/. Each is a noindex redirect page. */
export const workRedirects = [
  redirect('/showcase/', '/work/', 'Our work'),
  redirect('/showcase/garage/', '/work/garage/', 'the garage concept kit'),
  redirect('/showcase/plumbing/', '/work/plumbing/', 'the plumbing concept kit'),
  redirect('/selected-work/', '/work/', 'Our work'),
];

export const showcase: ShowcaseEntry[] = [
  {
    id: 'garage',
    trade: 'Garages & mechanics',
    title: 'Garage Growth Kit: website, logo, app and AI automation',
    description:
      'Sample work for garages: an animated website, brand identity, customer app and AI automation for MOT and service reminders. Designed by FinTaxTech.',
    image: {
      src: '/showcase/garage/brand-board.png',
      alt: 'Vector Motorworks brand identity board: logo, colours, type, app icon and social profile picture',
      width: 3200,
      height: 2002,
    },
    url: '/work/garage/',
    datePublished: '2026-11-12',
    sampleBusiness: 'Vector Motorworks',
    parts: [
      {
        anchor: 'website',
        name: 'A website that turns visits into bookings',
        service: 'websites',
        image: '/showcase/garage/website-showcase.png',
      },
      {
        anchor: 'brand',
        name: 'A brand customers remember',
        service: 'branding',
        image: '/showcase/garage/brand-board.png',
      },
      {
        anchor: 'app',
        name: 'Book, track and approve work from a phone',
        service: 'mobile-apps',
        image: '/showcase/garage/app-showcase.png',
      },
      {
        anchor: 'automation',
        name: 'Reminders that book themselves in',
        service: 'ai-automation',
        image: '/showcase/garage/automation-showcase.png',
      },
    ],
  },
  {
    id: 'plumbing',
    trade: 'Plumbers & heating engineers',
    title: 'Plumber & Heating Engineer Growth Kit',
    description:
      'Sample work for plumbers and heating engineers: a website, logo, customer app, missed-call AI automation and SEO, AEO and GEO. Designed by FinTaxTech.',
    socialDescription:
      'Website, logo, app, AI automation and SEO/AEO/GEO for plumbing and heating businesses. Sample concept work.',
    image: {
      src: '/showcase/plumbing/brand-board.png',
      alt: 'Copperwell brand identity board: logo versions, colours, type, app icon and social profile picture',
      width: 3200,
      height: 2002,
    },
    url: '/work/plumbing/',
    datePublished: '2026-11-12',
    sampleBusiness: 'Copperwell Plumbing & Heating',
    parts: [
      {
        anchor: 'website',
        name: 'Website template for plumbers and heating engineers',
        url: '/templates/website/motion/plumbing-10/',
        service: 'websites',
      },
      {
        anchor: 'brand',
        name: 'Brand identity concept: Copperwell Plumbing & Heating',
        image: '/showcase/plumbing/brand-board.png',
        service: 'branding',
      },
      {
        anchor: 'app',
        name: 'Customer app concept for a plumbing and heating business',
        image: '/showcase/plumbing/app-showcase.png',
        service: 'mobile-apps',
      },
      {
        anchor: 'automation',
        name: 'Missed-call and boiler service AI automation',
        image: '/showcase/plumbing/automation-showcase.png',
        service: 'ai-automation',
      },
      {
        anchor: 'get-found',
        name: 'SEO, AEO and GEO for a local trade business',
        image: '/showcase/plumbing/getfound-showcase.png',
      },
    ],
    faqs: [
      {
        question: "What does a plumber's website need?",
        answer:
          'It needs to work well on a phone, with a call button, a way to send a photo for a quote, clear services and areas covered, opening hours, and answers to common questions.',
      },
      {
        question: 'How can a plumber stop losing jobs to missed calls?',
        answer:
          'An automatic text-back can reply to every missed call within seconds, ask for a photo and postcode, flag emergencies to the engineer on call and offer time slots for routine jobs.',
      },
      {
        question: 'What are SEO, AEO and GEO?',
        answer:
          'SEO helps a business show up in Google search and maps. AEO (answer engine optimisation) helps its answers appear for questions and voice search. GEO (generative engine optimisation) helps AI assistants such as ChatGPT and Gemini describe the business correctly.',
      },
      {
        question: 'Do I need all five parts of the kit?',
        answer:
          'No. I suggest only the parts your business would genuinely use. Many start with the website and add automation later.',
        // Third person for search and AI answers, as approved in the kit's JSON-LD.
        schemaAnswer:
          'No. FinTaxTech suggests only the parts a business would genuinely use. Many start with the website and add automation later.',
      },
    ],
    llms: [
      '- [Concept growth kit for plumbers and heating engineers](https://fintaxtech.co.uk/work/plumbing/): sample website, brand identity, customer app, missed-call AI automation and SEO/AEO/GEO, made for an invented business (Copperwell Plumbing & Heating).',
      // The snippet's template line is held back: llms.txt links only to indexable pages
      // (tests/company-identity.test.ts), and every template demo is noindex,nofollow.
    ],
  },
];

/** "See a concept kit" lines on the service pages, one per kit. */
export const serviceExamples: Partial<Record<ServiceId, { label: string; href: string }[]>> = {
  branding: [
    { label: 'See a concept kit for a garage', href: '/work/garage/#brand' },
    { label: 'See a concept kit for a plumbing business', href: '/work/plumbing/#brand' },
  ],
  'mobile-apps': [
    { label: 'See a concept kit for a garage', href: '/work/garage/#app' },
    { label: 'See a concept kit for a plumbing business', href: '/work/plumbing/#app' },
  ],
  'ai-automation': [
    { label: 'See a concept kit for a garage', href: '/work/garage/#automation' },
    {
      label: 'See a concept kit for a plumbing business',
      href: '/work/plumbing/#automation',
    },
  ],
};

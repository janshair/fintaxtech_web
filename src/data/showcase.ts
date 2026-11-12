import type { ServiceId } from '../lib/types';

/** One growth kit per trade. Add a new trade by adding one entry here. */
export interface ShowcaseEntry {
  id: string;
  trade: string;
  title: string;
  /** Short line under the card title on /showcase/ and the page's meta description. */
  description: string;
  image: { src: string; alt: string; width: number; height: number };
  url: string;
  /** ISO date the kit was first published; used in structured data. */
  datePublished: string;
  /** The invented business the kit is designed for (always fictional). */
  sampleBusiness: string;
  /** Page sections, in order. `name` must match the section's visible <h2>. */
  parts: { anchor: string; name: string; service: ServiceId; image: string }[];
}

export const showcaseIndex = {
  route: '/showcase/',
  title: 'Our work: growth kits for small businesses',
  description:
    'Sample growth kits from FinTaxTech: a website, brand identity, customer app and AI automation designed together for one kind of small business.',
  intro:
    'Each kit shows a website, a brand, a mobile app and AI automation designed together for one trade, using an invented business.',
  navLabel: 'Our work',
  cardLink: 'See the kit',
};

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
    url: '/showcase/garage/',
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
];

/** "See a full example" lines on the service pages. */
export const serviceExamples: Partial<Record<ServiceId, { label: string; href: string }>> = {
  branding: { label: 'See a full example for a garage', href: '/showcase/garage/#brand' },
  'mobile-apps': { label: 'See a full example for a garage', href: '/showcase/garage/#app' },
  'ai-automation': {
    label: 'See a full example for a garage',
    href: '/showcase/garage/#automation',
  },
};

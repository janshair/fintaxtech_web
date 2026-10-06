import { metoni } from './metoni';
export const workCopy = { appsEyebrow: 'Mobile app development', appsTitle: 'Our published apps' };
export const publishedApps = [
  {
    name: metoni.name,
    summary: metoni.summary,
    pageURL: metoni.route,
    pageLabel: metoni.exploreLabel,
    playStoreUrl: metoni.playStoreURL,
    visitLabel: 'View Metoni on Google Play',
  },
  {
    name: 'Safos',
    summary: 'A mobile app built and published by FinTaxTech, available on Android.',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=uk.co.fintaxtech.safos',
    visitLabel: 'View Safos on Google Play',
  },
] as const;

export const featuredWork = {
  name: 'Ask Appliance Repairs',
  category: 'Website design and development',
  summary:
    'A responsive website for a London appliance repair business. Visitors can explore repair services, check the London service area and find a way to get in touch.',
  url: 'https://askappliancerepairs.com/',
  visitLabel: 'Visit Ask Appliance Repairs',
  desktopAlt:
    'Desktop view of the Ask Appliance Repairs website showing its appliance repair hero and service cards.',
  mobileAlt:
    'Mobile view of the Ask Appliance Repairs website showing its repair booking hero and service cards.',
  desktopCaption: 'Desktop website',
  mobileCaption: 'Mobile website',
  feedback: {
    label: 'Client feedback',
    quote: "They didn't just build a website; they became a trusted partner in our online growth.",
    attribution: 'Usman Riaz, owner of Ask Appliance Repairs',
    disclosure: '',
  },
} as const;

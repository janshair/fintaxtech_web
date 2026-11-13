import { metoni } from './metoni';
import { safos } from './safos';
export const workCopy = { appsEyebrow: 'Mobile app development', appsTitle: 'Our published apps' };
export const publishedApps = [
  {
    name: metoni.name,
    summary: metoni.summary,
    pageURL: metoni.route,
    pageLabel: metoni.exploreLabel,
    playStoreUrl: metoni.playStoreURL,
    appStoreUrl: metoni.appStoreURL,
    appStoreLabel: metoni.appStoreLabel,
    visitLabel: 'View Metoni on Google Play',
  },
  {
    name: safos.name,
    summary: safos.intro,
    pageURL: safos.route,
    pageLabel: 'Explore Safos',
    playStoreUrl: safos.playStoreURL,
    appStoreUrl: safos.appStoreURL,
    appStoreLabel: safos.appStoreLabel,
    visitLabel: 'View Safos on Google Play',
  },
] as const;

export const featuredWork = {
  id: 'client-01',
  route: '/work/client-01/',
  // Page title (without " | FinTaxTech") and meta description for the project page.
  title: 'Ask Appliance Repairs: brand, website and AI blog',
  description:
    'How FinTaxTech designed the brand, built the website and set up AI blog writing from reviews and job photos for Ask Appliance Repairs in London.',
  statusBadge: 'Live',
  cardLink: 'See the project',
  name: 'Ask Appliance Repairs',
  category: 'Branding, website and AI automation',
  summary:
    'A logo, brand identity, responsive website and AI blog writing for a London appliance repair business. Visitors can explore repair services, check the London service area and find a way to get in touch.',
  projectDetails: [
    [
      'What does the website help visitors do?',
      'Visitors can explore domestic appliance repair services, check whether the business covers their part of London and find a way to get in touch. These tasks give the website a clear service-enquiry focus.',
    ],
    [
      'What did FinTaxTech deliver?',
      'FinTaxTech designed the Ask Appliance Repairs logo and brand identity, then built the responsive website. The brand work includes a 12-page brand guide, business cards and a Google Maps promotion graphic. An AI automation turns customer reviews and job photos into blog articles. The desktop and mobile screenshots show the repair-service hero and service cards, and the linked business website shows the live project.',
    ],
    [
      'What evidence is available?',
      'The project is supported by the brand files shown below, desktop and mobile screenshots, a link to the business website and feedback attributed to its owner, Usman Riaz. The feedback describes the client experience; it is not a measurement of enquiry growth or sales.',
    ],
  ],
  url: 'https://askappliancerepairs.com/',
  visitLabel: 'Visit Ask Appliance Repairs',
  desktopAlt:
    'Desktop view of the Ask Appliance Repairs website showing its appliance repair hero and service cards.',
  mobileAlt:
    'Mobile view of the Ask Appliance Repairs website showing its repair booking hero and service cards.',
  desktopCaption: 'Desktop website',
  mobileCaption: 'Mobile website',
  websiteTitle: 'Website',
  brand: {
    title: 'Logo and brand identity',
    intro:
      'We designed the logo, then wrote a brand guide so the business, its printers and its web pages use it the same way. Business cards and a Google Maps promotion followed from the same system.',
    logoAlt:
      'Ask Appliance Repairs Ltd logo: a navy washing machine outline with a teal drum beside the word Ask and the full business name.',
    logoCaption: 'Primary logo',
    mapsAlt:
      'Google Maps promotion graphic for Ask Appliance Repairs Ltd: appliance repairs from £75, parts extra if required, London and Surrey, beside a washing machine, dryer, oven and teal toolbox.',
    mapsCaption: 'Google Maps promotion',
    guideTitle: 'Brand guidelines (12 pages)',
    guide: [
      [
        'cover',
        'Brand guidelines cover: the Ask Appliance Repairs logo above a navy panel titled Brand Guidelines, version 1.0.',
        'Cover',
      ],
      [
        'colour',
        'Brand guidelines colour page: Engineering Navy, Appliance Teal, White and Mist swatches with hex, RGB and CMYK values.',
        'Colour palette',
      ],
      [
        'type',
        'Brand guidelines typography page: Manrope in four weights with a heading and body hierarchy.',
        'Typography',
      ],
    ],
    cardAlt:
      'Ask Appliance Repairs business card: the logo on the front, and the founder’s name, phone number, website, Facebook page and a QR code on the back.',
    cardCaption: 'Business card, front and back',
  },
  automation: {
    title: 'AI automation: blog articles from reviews and job photos',
    intro:
      'Every repair is a story worth telling, but an engineer on the road has no time to write. We set up an AI workflow that turns a finished job into a blog article for the website.',
    stepsLabel: 'How it works',
    steps: [
      [
        'Paste the review and photos',
        'The business pastes the customer’s review and the photos taken on the job.',
      ],
      [
        'AI writes the article',
        'It explains the fault, how it was diagnosed and how it was fixed, with a search-friendly title, description and photo captions.',
      ],
      [
        'Published on the website',
        'Photos are resized and compressed, and the article goes live on the blog, RSS feed, sitemap and llms.txt.',
      ],
    ],
    inputLabel: 'In: a photo from the job',
    inputAlt:
      'Job photo: the engineer holds the new De’Longhi dual grill element next to the old one, with the open oven and tool bag behind.',
    outputLabel: 'Out: a published article',
    outputAlt:
      'The published Ask Appliance Repairs blog article “De’Longhi Cooker Tripping the Electrics: How We Found and Fixed the Fault”, with the cooker photo below the title.',
    articleURL: 'https://askappliancerepairs.com/blog/delonghi-cooker-tripping-electrics/',
    articleLabel: 'Read the De’Longhi article',
    blogURL: 'https://askappliancerepairs.com/blog/',
    blogLabel: 'See the Ask Appliance Repairs blog',
  },
  feedback: {
    label: 'Client feedback',
    quote: "They didn't just build a website; they became a trusted partner in our online growth.",
    attribution: 'Usman Riaz, owner of Ask Appliance Repairs',
    disclosure: '',
  },
} as const;

export const homeWorkCopy = {
  title: 'See what we have created.',
  websiteLink: 'Explore Ask Appliance Repairs',
  allWorkLink: 'See all our work',
};

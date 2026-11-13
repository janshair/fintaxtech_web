import { pricingCopy, pricingFaqs, pricingGroups } from '../content/pricing';
import { mobileAppGallery } from '../content/mobile-app-templates';
import { industryDirectory } from '../content/automation-industries';
import { brandingGallery, logoGallery } from '../content/branding-gallery';
import { locationFromPath } from '../content/locations';
import { company, ui } from '../content/site';
import { seoPages } from '../content/seo';
import { publicProfiles } from '../content/social';
import { services } from '../content/services';
import { blogCopy } from '../content/blog';
import { metoni } from '../content/metoni';
import { safos } from '../content/safos';
import { careersCopy } from '../content/careers';
import { templateDirectory, websiteGallery } from '../content/templates';
import { jobStructuredData, type JobSEO } from './job-seo';
import { showcase, showcaseIndex } from '../data/showcase';
export interface ArticleSEO {
  title: string;
  pubDate: Date;
  updatedDate?: Date;
  author: string;
  category: string;
  tags: string[];
}
export interface SocialImage {
  url: string;
  width: number;
  height: number;
  type: string;
  alt: string;
}
export const absoluteURL = (path: string) => new URL(path, company.url).href;
const normalizeAuthor = (name: string) => name.trim().replace(/\.$/, '').toLowerCase();
const organizationNames = [company.name, company.legal].map(normalizeAuthor);
export function breadcrumbs(path: string, title?: string) {
  if (path === '/' || seoPages[path]?.noindex) return [];
  const items = [{ name: ui.home, url: absoluteURL('/') }];
  if (path.startsWith(templateDirectory.route) && path !== templateDirectory.route)
    items.push({
      name: templateDirectory.breadcrumbLabel,
      url: absoluteURL(templateDirectory.route),
    });
  for (const parent of [brandingGallery, logoGallery, industryDirectory, mobileAppGallery]) {
    if (path.startsWith(parent.route) && path !== parent.route)
      items.push({ name: parent.title, url: absoluteURL(parent.route) });
  }
  if (path.startsWith(websiteGallery.route) && path !== websiteGallery.route)
    items.push({ name: websiteGallery.title, url: absoluteURL(websiteGallery.route) });
  if (path.startsWith(safos.route) && path !== safos.route)
    items.push({ name: safos.name, url: absoluteURL(safos.route) });
  if (path.startsWith(metoni.route) && path !== metoni.route)
    items.push({ name: metoni.name, url: absoluteURL(metoni.route) });
  if (path.startsWith('/services/') && path !== '/services/')
    items.push({ name: ui.services, url: absoluteURL('/services/') });
  if (path.startsWith(showcaseIndex.route) && path !== showcaseIndex.route)
    items.push({ name: showcaseIndex.navLabel, url: absoluteURL(showcaseIndex.route) });
  if (path.startsWith('/blog/') && path !== '/blog/')
    items.push({ name: blogCopy.label, url: absoluteURL('/blog/') });
  if (path.startsWith(careersCopy.route) && path !== careersCopy.route)
    items.push({ name: careersCopy.label, url: absoluteURL(careersCopy.route) });
  items.push({
    name: locationFromPath(path)?.name ?? seoPages[path]?.title ?? title ?? company.name,
    url: absoluteURL(path),
  });
  return items;
}
export function structuredData(
  path: string,
  title: string,
  description: string,
  article?: ArticleSEO,
  image = absoluteURL('/social.png'),
  job?: JobSEO,
) {
  const url = absoluteURL(path);
  const organization = absoluteURL('/#organization');
  const website = absoluteURL('/#website');
  const crumbs = breadcrumbs(path, article?.title ?? job?.title);
  const jobPosting = jobStructuredData(path, job);
  const location = locationFromPath(path);
  const service = services.find((s) => path === `/services/${s.id}/`);
  const kit = showcase.find((entry) => entry.url === path);
  const isShowcaseIndex = path === showcaseIndex.route;
  const isPricing = path === '/pricing/';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organization,
        name: company.name,
        legalName: company.legal,
        description: company.description,
        identifier: {
          '@type': 'PropertyValue',
          propertyID: company.registryName,
          value: company.number,
          url: company.registryURL,
        },
        url: absoluteURL('/'),
        logo: absoluteURL('/mark.svg'),
        email: company.email,
        telephone: company.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: '79 Yarrow Terrace',
          addressLocality: 'Dundee',
          postalCode: 'DD2 4DX',
          addressCountry: 'GB',
        },
        areaServed: [
          { '@type': 'Country', name: 'United Kingdom' },
          { '@type': 'AdministrativeArea', name: 'Scotland' },
          'Worldwide',
        ],
        sameAs: [...publicProfiles.map((s) => s.url), company.registryURL],
      },
      {
        '@type': 'WebSite',
        '@id': website,
        url: absoluteURL('/'),
        name: company.name,
        publisher: { '@id': organization },
        inLanguage: 'en',
      },
      {
        '@type':
          path === '/about/'
            ? 'AboutPage'
            : isShowcaseIndex
              ? 'CollectionPage'
              : isPricing
                ? ['WebPage', 'FAQPage']
                : 'WebPage',
        '@id': url + '#webpage',
        url,
        name: title,
        description,
        isPartOf: { '@id': website },
        ...(path === '/about/' ? { mainEntity: { '@id': organization } } : {}),
        ...(path === metoni.route ? { mainEntity: { '@id': absoluteURL('/metoni/#app') } } : {}),
        ...(crumbs.length ? { breadcrumb: { '@id': url + '#breadcrumb' } } : {}),
        ...(service || location ? { mainEntity: { '@id': url + '#service' } } : {}),
        ...(article ? { mainEntity: { '@id': url + '#article' } } : {}),
        ...(jobPosting ? { mainEntity: { '@id': jobPosting['@id'] } } : {}),
        ...(kit
          ? {
              mainEntity: { '@id': url + '#parts' },
              primaryImageOfPage: { '@id': url + '#primaryimage' },
              datePublished: kit.datePublished,
            }
          : {}),
        ...(isShowcaseIndex ? { mainEntity: { '@id': url + '#kits' } } : {}),
        ...(isPricing
          ? {
              about: { '@id': url + '#packages' },
              mainEntity: pricingFaqs.map(([name, text]) => ({
                '@type': 'Question',
                name,
                acceptedAnswer: { '@type': 'Answer', text },
              })),
            }
          : {}),
      },
      ...(isPricing
        ? [
            {
              '@type': 'OfferCatalog',
              '@id': url + '#packages',
              name: pricingCopy.title,
              url,
              itemListElement: pricingGroups.map((group) => ({
                '@type': 'OfferCatalog',
                name: group.name,
                url: `${url}#${group.id}`,
                itemListElement: group.packages
                  .filter((pkg) => pkg.price !== undefined)
                  .map((pkg) => ({
                    '@type': 'Offer',
                    name: pkg.name,
                    description: pkg.summary,
                    url: `${url}#${group.id}`,
                    priceCurrency: 'GBP',
                    price: pkg.price,
                    priceSpecification: {
                      '@type': 'PriceSpecification',
                      priceCurrency: 'GBP',
                      ...(pkg.from ? { minPrice: pkg.price } : { price: pkg.price }),
                      valueAddedTaxIncluded: false,
                    },
                    seller: { '@id': organization },
                    itemOffered: {
                      '@type': 'Service',
                      name: pkg.name,
                      description: pkg.includes.join('. ') + '.',
                      provider: { '@id': organization },
                      url: absoluteURL(group.service),
                    },
                  })),
              })),
            },
          ]
        : []),
      ...(location
        ? [
            {
              '@type': 'Service',
              '@id': url + '#service',
              name: location.h1,
              description: location.description,
              url,
              provider: { '@id': organization },
              areaServed: { '@type': 'City', name: location.name },
              serviceType: services.map((service) => service.name),
            },
          ]
        : []),
      ...(jobPosting ? [jobPosting] : []),
      ...(kit
        ? [
            {
              '@type': 'ImageObject',
              '@id': url + '#primaryimage',
              url: absoluteURL(kit.image.src),
              contentUrl: absoluteURL(kit.image.src),
              width: kit.image.width,
              height: kit.image.height,
              caption: kit.image.alt,
            },
            {
              '@type': 'ItemList',
              '@id': url + '#parts',
              name: `${kit.title}: sample work for ${kit.sampleBusiness}, an invented business`,
              numberOfItems: kit.parts.length,
              itemListElement: kit.parts.map((part, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                  '@type': 'CreativeWork',
                  name: part.name,
                  url: absoluteURL(part.url ?? `${kit.url}#${part.anchor}`),
                  ...(part.image ? { image: absoluteURL(part.image) } : {}),
                  creator: { '@id': organization },
                  ...(part.service
                    ? { about: { '@id': absoluteURL(`/services/${part.service}/`) + '#service' } }
                    : {}),
                },
              })),
            },
            ...(kit.faqs?.length
              ? [
                  {
                    '@type': 'FAQPage',
                    '@id': url + '#faq',
                    mainEntity: kit.faqs.map((faq) => ({
                      '@type': 'Question',
                      name: faq.question,
                      acceptedAnswer: { '@type': 'Answer', text: faq.schemaAnswer ?? faq.answer },
                    })),
                  },
                ]
              : []),
          ]
        : []),
      ...(isShowcaseIndex
        ? [
            {
              '@type': 'ItemList',
              '@id': url + '#kits',
              name: showcaseIndex.title,
              numberOfItems: showcase.length,
              itemListElement: showcase.map((entry, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: entry.trade,
                url: absoluteURL(entry.url),
                image: absoluteURL(entry.image.src),
              })),
            },
          ]
        : []),
      ...(path === metoni.route
        ? [
            {
              '@type': 'MobileApplication',
              '@id': absoluteURL('/metoni/#app'),
              name: metoni.name,
              description: metoni.description,
              url,
              operatingSystem: metoni.appStoreURL ? ['Android', 'iOS'] : 'Android',
              image,
              applicationCategory: 'HealthApplication',
              installUrl: metoni.playStoreURL,
              downloadUrl: metoni.appStoreURL
                ? [metoni.playStoreURL, metoni.appStoreURL]
                : metoni.playStoreURL,
              publisher: { '@id': organization },
              creator: { '@id': organization },
              mainEntityOfPage: { '@id': url + '#webpage' },
              featureList: metoni.features.map(([title]) => title),
              softwareHelp: { '@type': 'WebPage', url: absoluteURL(metoni.supportRoute) },
            },
          ]
        : []),
      ...(article
        ? [
            {
              '@type': 'BlogPosting',
              '@id': url + '#article',
              url,
              headline: article.title,
              description,
              datePublished: article.pubDate.toISOString(),
              ...(article.updatedDate ? { dateModified: article.updatedDate.toISOString() } : {}),
              author: organizationNames.includes(normalizeAuthor(article.author))
                ? { '@id': organization }
                : { '@type': 'Person', name: article.author },
              publisher: { '@id': organization },
              mainEntityOfPage: { '@id': url + '#webpage' },
              isPartOf: { '@id': absoluteURL('/blog/#webpage') },
              articleSection: article.category,
              keywords: article.tags,
              image,
              inLanguage: 'en',
            },
          ]
        : []),
      ...(crumbs.length
        ? [
            {
              '@type': 'BreadcrumbList',
              '@id': url + '#breadcrumb',
              itemListElement: crumbs.map((c, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: c.name,
                item: c.url,
              })),
            },
          ]
        : []),
      ...(service
        ? [
            {
              '@type': 'Service',
              '@id': url + '#service',
              name: service.name,
              description: service.description,
              url,
              provider: { '@id': organization },
            },
          ]
        : []),
    ],
  };
}

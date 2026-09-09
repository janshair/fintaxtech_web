import { company, ui } from '../content/site';
import { seoPages } from '../content/seo';
import { socialProfiles } from '../content/social';
import { services } from '../content/services';
export const absoluteURL = (path: string) => new URL(path, company.url).href;
export function breadcrumbs(path: string) {
  if (path === '/' || seoPages[path]?.noindex) return [];
  const items = [{ name: ui.home, url: absoluteURL('/') }];
  if (path.startsWith('/services/') && path !== '/services/')
    items.push({ name: ui.services, url: absoluteURL('/services/') });
  items.push({ name: seoPages[path]?.title ?? company.name, url: absoluteURL(path) });
  return items;
}
export function structuredData(path: string, title: string, description: string) {
  const url = absoluteURL(path);
  const organization = absoluteURL('/#organization');
  const website = absoluteURL('/#website');
  const crumbs = breadcrumbs(path);
  const service = services.find((s) => path === `/services/${s.id}/`);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organization,
        name: company.name,
        legalName: company.legal,
        url: absoluteURL('/'),
        logo: absoluteURL('/mark.svg'),
        email: company.email,
        telephone: company.phone,
        sameAs: socialProfiles.map((s) => s.url),
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
        '@type': 'WebPage',
        '@id': url + '#webpage',
        url,
        name: title,
        description,
        isPartOf: { '@id': website },
        ...(crumbs.length ? { breadcrumb: { '@id': url + '#breadcrumb' } } : {}),
        ...(service ? { mainEntity: { '@id': url + '#service' } } : {}),
      },
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

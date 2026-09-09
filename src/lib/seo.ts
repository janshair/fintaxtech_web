import { company, ui } from '../content/site';
import { seoPages } from '../content/seo';
import { socialProfiles } from '../content/social';
import { services } from '../content/services';
import { blogCopy } from '../content/blog';
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
export function breadcrumbs(path: string, title?: string) {
  if (path === '/' || seoPages[path]?.noindex) return [];
  const items = [{ name: ui.home, url: absoluteURL('/') }];
  if (path.startsWith('/services/') && path !== '/services/')
    items.push({ name: ui.services, url: absoluteURL('/services/') });
  if (path.startsWith('/blog/') && path !== '/blog/')
    items.push({ name: blogCopy.label, url: absoluteURL('/blog/') });
  items.push({ name: seoPages[path]?.title ?? title ?? company.name, url: absoluteURL(path) });
  return items;
}
export function structuredData(
  path: string,
  title: string,
  description: string,
  article?: ArticleSEO,
  image = absoluteURL('/social.png'),
) {
  const url = absoluteURL(path);
  const organization = absoluteURL('/#organization');
  const website = absoluteURL('/#website');
  const crumbs = breadcrumbs(path, article?.title);
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
        ...(article ? { mainEntity: { '@id': url + '#article' } } : {}),
      },
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
              author:
                article.author === company.name
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

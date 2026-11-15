import { describe, it, expect } from 'vitest';
import { blogFields, validUpdatedDate } from '../src/lib/blog-schema';
import {
  publishedPosts,
  postURL,
  formatPostDate,
  relatedPosts,
  searchTitle,
} from '../src/lib/blog-posts';
import { structuredData } from '../src/lib/seo';

const fields = {
  title: 'A useful article',
  description: 'A useful description of a digital project.',
  pubDate: new Date('2026-09-09'),
  author: 'FinTaxTech',
  category: 'Mobile App Development',
  tags: [],
  draft: false,
};
const entry = (id: string, draft = false, date = '2026-09-09') => ({
  id,
  data: { ...fields, draft, pubDate: new Date(date) },
});

describe('blog publishing', () => {
  it('keeps a distinct SEO title and recognises the company legal-name author', () => {
    expect(blogFields.parse({ ...fields, seoTitle: 'Short search title' }).seoTitle).toBe(
      'Short search title',
    );
    expect(blogFields.safeParse({ ...fields, seoTitle: '' }).success).toBe(false);
    const article = { ...fields, author: 'FinTaxTech Ltd.' };
    const graph = structuredData(
      '/blog/checklist/',
      'Short search title | FinTaxTech',
      fields.description,
      article,
    )['@graph'];
    expect(graph.find((node) => node['@type'] === 'BlogPosting')).toMatchObject({
      headline: fields.title,
      author: { '@id': 'https://fintaxtech.co.uk/#organization' },
    });
  });
  it('excludes drafts and orders newest first without mutating the collection', () => {
    const input = [entry('old', false, '2026-01-01'), entry('draft', true), entry('new')];
    expect(publishedPosts(input).map(postURL)).toEqual(['/blog/new/', '/blog/old/']);
    expect(input.map((post) => post.id)).toEqual(['old', 'draft', 'new']);
  });
  it('requires valid metadata and defaults unspecified draft status to unpublished', () => {
    expect(blogFields.parse({ ...fields, draft: undefined }).draft).toBe(true);
    for (const override of [
      { title: '' },
      { pubDate: 'invalid' },
      { author: '' },
      { tags: [''] },
      { slug: '../private' },
    ])
      expect(blogFields.safeParse({ ...fields, ...override }).success).toBe(false);
    expect(validUpdatedDate({ ...fields, updatedDate: new Date('2026-09-08') })).toBe(false);
    expect(validUpdatedDate({ ...fields, updatedDate: new Date('2026-09-10') })).toBe(true);
  });
  it('rejects invalid and duplicate public paths', () => {
    expect(() => publishedPosts([entry('../enquiry')])).toThrow();
    expect(() => publishedPosts([entry('same'), entry('same')])).toThrow();
    expect(postURL(entry('custom-slug'))).toBe('/blog/custom-slug/');
    const explicit = { ...entry('filename'), data: { ...fields, slug: 'custom-slug' } };
    expect(postURL(explicit)).toBe('/blog/custom-slug/');
    expect(() => publishedPosts([explicit, entry('custom-slug')])).toThrow();
  });
  it('uses a stable date and accurate article/breadcrumb relationships', () => {
    expect(formatPostDate(fields.pubDate)).toBe('9 September 2026');
    const graph = structuredData('/blog/example/', fields.title, fields.description, fields)[
      '@graph'
    ];
    expect(graph.find((node) => node['@type'] === 'BlogPosting')).toMatchObject({
      headline: fields.title,
      datePublished: '2026-09-09T00:00:00.000Z',
      author: { '@id': 'https://fintaxtech.co.uk/#organization' },
    });
    expect(graph.find((node) => node['@type'] === 'BlogPosting')).not.toHaveProperty(
      'dateModified',
    );
    expect(graph.find((node) => node['@type'] === 'BreadcrumbList')).toMatchObject({
      itemListElement: [
        { position: 1, item: 'https://fintaxtech.co.uk/' },
        { position: 2, item: 'https://fintaxtech.co.uk/blog/' },
        { position: 3, name: fields.title, item: 'https://fintaxtech.co.uk/blog/example/' },
      ],
    });
  });
  it('publishes the short answer and questions as structured data', () => {
    expect(blogFields.parse(fields).faqs).toEqual([]);
    expect(blogFields.safeParse({ ...fields, summary: 'Too short' }).success).toBe(false);
    const article = {
      ...fields,
      summary: 'A direct answer to the question in the title.',
      faqs: [{ question: 'What does it cost?', answer: 'It depends on the scope of the project.' }],
    };
    const graph = structuredData('/blog/example/', fields.title, fields.description, article)[
      '@graph'
    ];
    expect(graph.find((node) => node['@type'] === 'BlogPosting')).toMatchObject({
      abstract: article.summary,
    });
    expect(graph.find((node) => node['@type'] === 'FAQPage')).toMatchObject({
      '@id': 'https://fintaxtech.co.uk/blog/example/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What does it cost?',
          acceptedAnswer: { '@type': 'Answer', text: 'It depends on the scope of the project.' },
        },
      ],
    });
    const plain = structuredData('/blog/example/', fields.title, fields.description, fields)[
      '@graph'
    ];
    expect(plain.some((node) => node['@type'] === 'FAQPage')).toBe(false);
  });
  it('suggests same-category articles first and brands only the titles that fit', () => {
    const post = (id: string, category: string, date: string) => ({
      id,
      data: { ...fields, category, pubDate: new Date(date) },
    });
    const posts = publishedPosts([
      post('current', 'Branding', '2026-09-01'),
      post('newest-other', 'Websites', '2026-09-05'),
      post('same-old', 'Branding', '2026-08-01'),
      post('same-new', 'Branding', '2026-08-20'),
    ]);
    const current = posts.find((entry) => entry.id === 'current')!;
    expect(relatedPosts(current, posts, 3).map((entry) => entry.id)).toEqual([
      'same-new',
      'same-old',
      'newest-other',
    ]);
    expect(relatedPosts(current, posts)).toHaveLength(2);
    expect(searchTitle('Short title', 'FinTaxTech')).toBe('Short title | FinTaxTech');
    const long = 'A search title that is already close to the sixty limit';
    expect(searchTitle(long, 'FinTaxTech')).toBe(long);
  });
});

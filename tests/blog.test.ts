import { describe, it, expect } from 'vitest';
import { blogFields, validUpdatedDate } from '../src/lib/blog-schema';
import { publishedPosts, postURL, formatPostDate } from '../src/lib/blog-posts';
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
});

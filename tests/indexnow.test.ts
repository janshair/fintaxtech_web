import { describe, expect, it } from 'vitest';
import { articleURL, changedArticles, sitemapURLs } from '../scripts/indexnow.mjs';

const origin = 'https://fintaxtech.co.uk';
const article = (lines: string) => `---\ntitle: 'A useful article'\n${lines}\n---\n\nBody text.\n`;

describe('IndexNow submission', () => {
  it('maps a published article to its public URL and skips drafts', () => {
    expect(articleURL(article('draft: false'), 'src/content/blog/file-name.md', origin)).toBe(
      'https://fintaxtech.co.uk/blog/file-name/',
    );
    expect(
      articleURL(article('slug: custom-slug\ndraft: false'), 'src/content/blog/x.md', origin),
    ).toBe('https://fintaxtech.co.uk/blog/custom-slug/');
    expect(articleURL(article('draft: true'), 'src/content/blog/x.md', origin)).toBeNull();
    // An article without a draft field is unpublished, as in the content schema.
    expect(articleURL(article('slug: x'), 'src/content/blog/x.md', origin)).toBeNull();
  });
  it('picks out added, changed and renamed articles from a push', () => {
    const listing = [
      'M\tsrc/content/blog/changed.md',
      'A\tsrc/content/blog/new.md',
      'D\tsrc/content/blog/removed.md',
      'R100\tsrc/content/blog/old-name.md\tsrc/content/blog/new-name.md',
      'M\tsrc/layouts/ArticleLayout.astro',
      'A\tsrc/assets/blog/new/new-hero.png',
    ].join('\n');
    expect(changedArticles(listing)).toEqual({
      files: [
        'src/content/blog/changed.md',
        'src/content/blog/new.md',
        'src/content/blog/new-name.md',
      ],
      added: true,
    });
    expect(changedArticles('M\tsrc/content/blog/changed.md')).toEqual({
      files: ['src/content/blog/changed.md'],
      added: false,
    });
    expect(changedArticles('')).toEqual({ files: [], added: false });
  });
  it('reads every address from a sitemap', () => {
    const xml =
      '<urlset><url><loc>https://fintaxtech.co.uk/</loc></url><url><loc> https://fintaxtech.co.uk/blog/ </loc></url></urlset>';
    expect(sitemapURLs(xml)).toEqual([
      'https://fintaxtech.co.uk/',
      'https://fintaxtech.co.uk/blog/',
    ]);
  });
});

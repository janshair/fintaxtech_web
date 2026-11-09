import { describe, expect, it } from 'vitest';
import { appKnowledge, metoniKnowledge, safosKnowledge } from '../src/content/app-knowledge';
import { appLLMSText } from '../src/lib/app-llms';
import { GET as metoniGET } from '../src/pages/metoni/llms.txt';
import { GET as safosGET } from '../src/pages/safos/llms.txt';
import { GET as rootGET } from '../src/pages/llms.txt';

describe('app summaries and canonical answers', () => {
  for (const [app, get] of [
    [metoniKnowledge, metoniGET],
    [safosKnowledge, safosGET],
  ] as const) {
    it(`${app.name}: serves a plain-text summary from the same facts used in HTML`, async () => {
      const response = get();
      expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
      const text = await response.text();
      expect(text).toBe(appLLMSText(app));
      expect(text.startsWith(`# ${app.name}\n`)).toBe(true);
      expect(text).toContain(app.description);
      for (const [question, answer] of app.questions) {
        expect(text).toContain(`### ${question}\n\n${answer}`);
      }
      for (const [title, description] of app.features)
        expect(text).toContain(`${title}: ${description}`);
      for (const link of [app.playStoreURL, app.appStoreURL, app.supportRoute, app.privacyRoute])
        expect(text).toContain(link);
      expect(text).not.toMatch(/release pending|not yet available|{{|undefined/);
    });
  }
  it('root overview discovers both summaries without stale duplicated product facts', async () => {
    const text = await rootGET().text();
    for (const app of appKnowledge) {
      expect(text).toContain(app.description);
      expect(text).toContain(`https://fintaxtech.co.uk${app.llmsRoute}`);
      expect(text).toContain(`https://fintaxtech.co.uk${app.supportRoute}`);
    }
    expect(text).not.toContain('{{PUBLISHED_APPS}}');
    expect(text.match(/## Published apps/g)).toHaveLength(1);
  });
  it('keeps storage and diagnostics distinct and documents destructive troubleshooting risks', () => {
    const metoni = appLLMSText(metoniKnowledge);
    expect(metoni).toContain('analytics');
    expect(metoni).toContain('Uninstalling the app can permanently delete');
    const safos = appLLMSText(safosKnowledge);
    expect(safos).toContain('On Android, use Settings → Export all data');
    expect(safos).toContain('platform features can differ');
    expect(safos).toContain('Sharing a PDF sends it to the recipient or service you choose');
  });
});

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

it('keeps gym pilot packages, prices and limits consistent across both summaries', async () => {
  const { metoniGym, gymSuitabilityQuestion } = await import('../src/content/metoni-gym');
  const appText = appLLMSText(metoniKnowledge);
  const rootText = await rootGET().text();
  for (const text of [appText, rootText]) {
    expect(text).toContain('Connected Gym');
    expect(text).toContain('Own Brand');
    expect(text).toContain('white-label');
    expect(text).toContain(metoniGym.status);
    expect(text).toContain('Prices exclude VAT where applicable.');
    expect(text).toContain('https://fintaxtech.co.uk/metoni/#for-gyms');
    for (const plan of metoniGym.packages) {
      expect(text).toContain(`£${plan.monthly}/month plus £${plan.setup}`);
      expect(text).toContain(plan.note);
    }
  }
  expect(appText).toContain(gymSuitabilityQuestion[1]);
  expect(appText).toContain(
    'planned gym-package features, not features already available in the consumer app',
  );
  expect(appText).toContain('Coach dashboard and member invitations');
  expect(appText).toContain('One location, up to 250 enrolled members and five staff accounts');
  expect(appText).toContain('complement your existing booking and payment tools');
  expect(appText).toContain('app-store approval');
  expect(appLLMSText(safosKnowledge)).not.toContain('Connected Gym');
});

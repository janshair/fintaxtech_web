import { describe, it, expect } from 'vitest';
import { legacyJourneyURL } from '../src/lib/journey-url';
describe('legacy questionnaire URLs', () => {
  it('preserves supported questionnaire routing', () => {
    expect(legacyJourneyURL('?service=branding&stage=2&brief=short')).toBe(
      '/enquiry/?service=branding&stage=2&brief=short',
    );
    expect(legacyJourneyURL('?route=help')).toBe('/enquiry/?route=help');
  });
  it('never forwards personal fields, unknown values or arbitrary destinations', () => {
    expect(
      legacyJourneyURL(
        '?service=websites&email=private@example.com&answer=secret&redirect=https://example.com&stage=99',
      ),
    ).toBe('/enquiry/?service=websites');
    expect(legacyJourneyURL('?service=unknown&stage=2')).toBeUndefined();
    expect(legacyJourneyURL('?utm_source=campaign')).toBeUndefined();
    expect(legacyJourneyURL('')).toBeUndefined();
  });
});

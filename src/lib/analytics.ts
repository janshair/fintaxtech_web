import { company } from '../content/site';
import { readPreference } from './storage';
const events = [
  'service_selected',
  'questionnaire_started',
  'question_step_completed',
  'questionnaire_completed',
  'pdf_generation_started',
  'pdf_generated',
  'pdf_generation_failed',
  'email_selected',
  'whatsapp_selected',
  'device_share_selected',
  'theme_changed',
  'promo_viewed',
  'promo_application_started',
  'external_project_viewed',
] as const;
export type EventName = (typeof events)[number];
const measurementId = import.meta.env.PUBLIC_GA_MEASUREMENT_ID as string | undefined;
let permitted = readPreference('consent') === 'accepted';
let loaded = false;
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
export function setAnalyticsConsent(allowed: boolean) {
  permitted = allowed;
  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = !allowed;
  if (!allowed) {
    window.gtag?.('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_ga')) {
        for (const domain of ['', location.hostname, '.' + location.hostname])
          document.cookie = `${name}=; Max-Age=0; path=/;${domain ? ' domain=' + domain + ';' : ''}`;
      }
    });
    return;
  }
  if (!loaded) {
    loaded = true;
    window.dataLayer = [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      page_location: location.origin + location.pathname,
      page_referrer: '',
      page_title: company.name,
      ignore_referrer: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.append(script);
  } else window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
}
// Deliberately accepts no payload: answers, service text, URLs, filenames and PII cannot flow here.
export function track(event: EventName) {
  if (!permitted || !events.includes(event)) return;
  window.gtag?.('event', event, {
    page_location: location.origin + location.pathname,
    page_referrer: '',
    page_title: company.name,
    send_to: measurementId,
  });
}
export function initAnalytics() {
  if (permitted) setAnalyticsConsent(true);
}

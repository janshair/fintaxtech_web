import { ADS_ID, GA4_ID, deniedConsent } from '../content/google-tag';
import { company } from '../content/site';
import { readPreference } from './storage';
const events = [
  'generate_lead',
  'whatsapp_click',
  'phone_click',
  'email_click',
  'template_preview',
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
  'project_assistant_invitation_shown',
  'project_assistant_opened',
  'project_assistant_option_selected',
  'project_assistant_destination_clicked',
  'project_assistant_dismissed',
] as const;
export type EventName = (typeof events)[number];
const measurementId =
  GA4_ID !== 'G-XXXXXXXXXX' && /^G-[A-Z0-9]+$/.test(GA4_ID) ? GA4_ID : undefined;
const adsId = ADS_ID !== 'AW-XXXXXXXXXX' && /^AW-[A-Z0-9]+$/.test(ADS_ID) ? ADS_ID : undefined;
const grantedConsent = {
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
} as const;
let permitted = hasAnalyticsConsent();
let loaded = false;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function hasAnalyticsConsent() {
  return readPreference('consent') === 'accepted-v2';
}

const measurementContext = () => ({
  page_location: location.origin + location.pathname,
  page_referrer: '',
  page_title: company.name,
});

export function setAnalyticsConsent(allowed: boolean) {
  if (location.pathname.startsWith('/client/')) return;
  permitted = allowed;
  const tagId = measurementId ?? adsId;
  if (!tagId || !window.gtag) return;
  if (measurementId)
    (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = !allowed;
  if (!allowed) {
    if (loaded) window.gtag('consent', 'update', deniedConsent);
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (/^_(?:ga|gcl)(?:_|$)/.test(name)) {
        for (const domain of new Set(['', location.hostname, new URL(company.url).hostname]))
          document.cookie = `${name}=; Max-Age=0; path=/${domain ? '; domain=' + domain : ''}`;
      }
    }
    return;
  }
  window.gtag('consent', 'update', grantedConsent);
  if (loaded) return;
  loaded = true;
  window.gtag('js', new Date());
  if (measurementId)
    window.gtag('config', measurementId, {
      ...measurementContext(),
      send_page_view: false,
      ignore_referrer: true,
    });
  if (adsId) window.gtag('config', adsId, { ...measurementContext(), send_page_view: false });
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
  script.async = true;
  document.head.append(script);
}

// Events carry only an allowlisted name and the query-free page context.
export function track(event: EventName) {
  if (
    location.pathname.startsWith('/client/') ||
    !permitted ||
    !loaded ||
    !measurementId ||
    !events.includes(event)
  )
    return;
  window.gtag?.('event', event, { ...measurementContext(), send_to: measurementId });
}

export function initAnalytics() {
  if (location.pathname.startsWith('/client/')) return;
  if (permitted) setAnalyticsConsent(true);
  document.addEventListener('click', (event) => {
    const link =
      event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (!link) return;
    if (link.protocol === 'tel:') track('phone_click');
    else if (link.protocol === 'mailto:') track('email_click');
    else if (link.hostname === 'wa.me') track('whatsapp_click');
    if (link.hasAttribute('data-template-preview')) track('template_preview');
  });
}

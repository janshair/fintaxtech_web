import { readPreference, writePreference } from '../lib/storage';
import { initAnalytics, setAnalyticsConsent, track } from '../lib/analytics';
initAnalytics();
function syncThemeMetadata() {
  const color = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = color;
    meta.removeAttribute('media');
  });
}
syncThemeMetadata();
document.querySelector('#theme-toggle')?.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  syncThemeMetadata();
  writePreference('theme', theme);
  track('theme_changed');
});
matchMedia('(prefers-color-scheme:dark)').addEventListener('change', (event) => {
  if (!readPreference('theme')) {
    document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
    syncThemeMetadata();
  }
});
const menu = document.querySelector<HTMLButtonElement>('#menu-toggle');
const nav = document.querySelector<HTMLElement>('#main-navigation');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav?.setAttribute('data-open', String(open));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    nav?.setAttribute('data-open', 'false');
    menu.focus();
  }
});
const banner = document.querySelector<HTMLElement>('#consent-banner');
const dialog = document.querySelector<HTMLDialogElement>('#consent-dialog');
const choice = document.querySelector<HTMLInputElement>('#analytics-choice');
if (banner && !readPreference('consent')) banner.hidden = false;
function save(value: string) {
  writePreference('consent', value);
  setAnalyticsConsent(value === 'accepted');
  if (banner) banner.hidden = true;
  dialog?.close();
}
document
  .querySelectorAll<HTMLButtonElement>('[data-consent]')
  .forEach((b) => b.addEventListener('click', () => save(b.dataset.consent!)));
document.querySelectorAll('[data-consent-manage]').forEach((b) =>
  b.addEventListener('click', () => {
    if (choice) choice.checked = readPreference('consent') === 'accepted';
    dialog?.showModal();
  }),
);
document
  .querySelector('#consent-save')
  ?.addEventListener('click', () => save(choice?.checked ? 'accepted' : 'rejected'));
document.querySelector('#consent-close')?.addEventListener('click', () => dialog?.close());
document
  .querySelectorAll('[data-external-project]')
  .forEach((a) => a.addEventListener('click', () => track('external_project_viewed')));

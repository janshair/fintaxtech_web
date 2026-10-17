import { referenceCodes, visitEndpoint } from '../lib/barber-visits';

// No cookie, browser storage, GA integration or third-party script. One attempt per document.
const config = document.querySelector('#barber-visit-config');
if (config) {
  try {
    const value = JSON.parse(config.textContent || '{}');
    const endpoint = visitEndpoint(value.endpoint);
    const codes = referenceCodes(value.codes);
    const refs = new URL(location.href).searchParams.getAll('ref');
    const privacy = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (
      endpoint &&
      refs.length === 1 &&
      codes.includes(refs[0]) &&
      navigator.doNotTrack !== '1' &&
      !privacy.globalPrivacyControl
    ) {
      let attempted = false;
      const count = () => {
        if (attempted || document.visibilityState !== 'visible') return;
        attempted = true;
        document.removeEventListener('visibilitychange', count);
        void fetch(endpoint, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref: refs[0] }),
          keepalive: true,
        }).catch(() => {
          /* Counting must never interrupt the preview or retry. */
        });
      };
      document.addEventListener('visibilitychange', count);
      count();
    }
  } catch {
    /* Invalid or absent configuration disables counting. */
  }
}

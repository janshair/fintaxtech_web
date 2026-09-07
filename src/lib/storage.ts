// Only non-personal preferences and a one-use campaign flag cross page boundaries.
export function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(`ftt:${key}`);
  } catch {
    return null;
  }
}
export function writePreference(key: string, value: string): void {
  try {
    localStorage.setItem(`ftt:${key}`, value);
  } catch {
    /* In-memory UI still works. */
  }
}
export function setPromoIntent(): boolean {
  try {
    sessionStorage.setItem('ftt:promo-intent', 'yes');
    return true;
  } catch {
    return false;
  }
}
export function consumePromoIntent(): boolean {
  try {
    const value = sessionStorage.getItem('ftt:promo-intent') === 'yes';
    sessionStorage.removeItem('ftt:promo-intent');
    return value;
  } catch {
    return false;
  }
}

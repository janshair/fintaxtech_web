import { mobileEstimateCopy as c } from '../../content/mobile-estimate';
import type { MobileEstimate, QuotationState } from './types';
export const approvalCapabilities = Object.freeze({
  approve: false,
  issue: false,
  adjust: false,
  resolve: false,
});
// No customer-provided role, token, flag or review_context can unlock a transition.
// Replace only behind authenticated server-side actions and an immutable audit store.
export function requestFixedPriceTransition(
  _estimate: MobileEstimate,
  _target: QuotationState,
  _untrustedAuthority?: unknown,
): never {
  throw new Error(c.approvalUnavailable);
}

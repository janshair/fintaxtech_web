import type { VatConfig } from './schema';
import type { TaxResult } from './types';
import { mobileEstimateCopy as c } from '../../content/mobile-estimate';
export function calculateTax(vat: VatConfig, oneTime: number, monthly: number): TaxResult {
  const unverified: TaxResult = {
    ...vat.unverified_output,
    verified: false,
    message: vat.unverified_output.customer_message,
  };
  const verified =
    vat.registration_verified &&
    !!vat.registration_verified_at &&
    !!vat.registration_verification_reference;
  if (!verified || vat.registration_status === 'unverified') return unverified;
  if (vat.registration_status === 'not_registered')
    return {
      status: 'not_registered',
      verified: true,
      message: c.vatUnregistered,
      one_time_vat_pence: 0,
      monthly_vat_pence: 0,
      one_time_including_vat_pence: oneTime,
      monthly_including_vat_pence: monthly,
    };
  if (!vat.registration_number) return unverified;
  if (['not_applicable', 'exempt', 'outside_scope'].includes(vat.transaction_treatment))
    return {
      status: 'not_taxable',
      verified: true,
      message: c.vatNontaxable,
      one_time_vat_pence: 0,
      monthly_vat_pence: 0,
      one_time_including_vat_pence: oneTime,
      monthly_including_vat_pence: monthly,
    };
  if (
    vat.transaction_treatment !== 'taxable' ||
    vat.rate_basis_points === null ||
    !vat.rate_verified_at ||
    !vat.default_auto_add
  )
    return unverified;
  const round = (value: number) =>
    Number((BigInt(value) * BigInt(vat.rate_basis_points!) + 5000n) / 10000n);
  const one = round(oneTime),
    recurring = round(monthly);
  return {
    status: 'calculated',
    verified: true,
    message: c.vatApplied(vat.rate_basis_points / 100),
    one_time_vat_pence: one,
    monthly_vat_pence: recurring,
    one_time_including_vat_pence: oneTime + one,
    monthly_including_vat_pence: monthly + recurring,
  };
}

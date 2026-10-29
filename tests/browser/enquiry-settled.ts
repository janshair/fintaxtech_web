import { expect, type Page } from '@playwright/test';

// Stage 2 has no motion attributes, so this is also safe for shared journey helpers.
export async function enquirySettled(page: Page) {
  await expect(page.locator('#questionnaire')).not.toHaveAttribute('data-enquiry-phase', /.+/);
  await expect(page.locator('#questionnaire')).not.toHaveAttribute('inert');
}

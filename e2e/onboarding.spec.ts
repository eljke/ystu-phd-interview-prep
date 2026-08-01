import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test('two participants can open the full catalogue', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'Все темы' }).click();
  await expect(page.getByText('43 из 43')).toBeVisible();
  await expect(page.getByText('1.1').first()).toBeVisible();
  await expect(page.getByText('3.17').first()).toBeVisible();
});

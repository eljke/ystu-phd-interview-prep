import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test('navigation uses hash routes suitable for static hosting', async ({ page }) => {
  await completeOnboarding(page);
  await expect(page.getByRole('link', { name: 'Все темы' })).toHaveAttribute('href', /#\/topics$/);
  await page.getByRole('link', { name: 'Все темы' }).click();
  await expect(page).toHaveURL(/#\/topics$/);
});

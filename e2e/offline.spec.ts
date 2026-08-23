import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test('the catalogue remains available after the application shell is cached', async ({ context, page, isMobile }) => {
  test.skip(Boolean(isMobile), 'Offline reload is covered in the desktop project.');
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'База знаний' }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('43 из 43')).toBeVisible();
});

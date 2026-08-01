import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test('topic reveals layered material', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'Все темы' }).click();
  await page.getByLabel('Открыть тему 1.1', { exact: true }).click();
  await page.getByRole('button', { name: /Показать ответ/ }).click();
  await expect(page.getByText(/Модель — это целевое/)).toBeVisible();
});

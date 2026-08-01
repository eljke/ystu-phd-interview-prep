import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test('a mini-test records and explains the result', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'Все темы' }).click();
  await page.getByLabel('Открыть тему 1.1', { exact: true }).click();
  await page.getByRole('link', { name: /Пройти мини-тест/ }).click();
  await page.getByText('Она описывает существенные связи формализованно').click();
  await page.getByRole('button', { name: 'Проверить ответы' }).click();
  await expect(page.getByText('1 из 1')).toBeVisible();
  await expect(page.getByText('Верно')).toBeVisible();
});

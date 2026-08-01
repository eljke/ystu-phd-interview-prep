import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test('one programme topic is practiced through several question formats', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'Все темы' }).click();
  await page.getByLabel('Открыть тему 1.1', { exact: true }).click();
  await page.getByRole('link', { name: /Закрепить разными вопросами/ }).click();

  await expect(page.getByRole('heading', { name: 'Тренировка без зубрёжки' })).toBeVisible();
  await expect(page.getByText('Соотнесите понятие и его простой смысл.')).toBeVisible();
  await expect(page.getByText(/Какие тезисы действительно относятся к теме 1.1/)).toBeVisible();
  await expect(page.getByText(/Объясните простыми словами/)).toBeVisible();
});

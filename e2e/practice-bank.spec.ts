import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test('one programme topic is practiced through several question formats', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'База знаний' }).click();
  await page.getByLabel('Открыть полный разбор темы 1.1', { exact: true }).click();
  await page.getByRole('link', { name: /Закрепить разными вопросами/ }).click();

  await expect(page.getByRole('heading', { name: 'Тренировка без зубрёжки' })).toBeVisible();
  await expect(page.locator('.quiz-question')).toHaveCount(4);
  await expect(
    page.getByText(/Тема 1\.1 · Определение понятия «модель»/).first(),
  ).toBeVisible();
  await expect(page.getByText('Соберите тему 1.1: что здесь что означает?')).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: /Расскажите своими словами: Определение понятия «модель»/,
    }),
  ).toBeVisible();
});

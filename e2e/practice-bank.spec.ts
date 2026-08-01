import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test('one programme topic is practiced through several question formats', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'Все темы' }).click();
  await page.getByLabel('Открыть тему 1.1', { exact: true }).click();
  await page.getByRole('link', { name: /Закрепить разными вопросами/ }).click();

  await expect(page.getByRole('heading', { name: 'Тренировка без зубрёжки' })).toBeVisible();
  await expect(page.locator('.quiz-question')).toHaveCount(5);
  await expect(page.getByText('Соберите тему 1.1: что здесь что означает?')).toBeVisible();
  await expect(
    page.getByRole('group', {
      name: 'Отметьте верные утверждения по теме 1.1.',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Зачем вообще строить модель, если можно изучать реальный объект?',
    }),
  ).toBeVisible();
});

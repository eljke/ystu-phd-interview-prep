import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers/onboarding';

test('topic opens in theory-first mode and keeps self-check available', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'База знаний' }).click();
  await page.getByLabel('Открыть полный разбор темы 1.1', { exact: true }).click();

  const mode = page.getByRole('group', { name: 'Режим работы с темой' });
  await expect(mode.getByRole('button', { name: /Изучить теорию/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('heading', { name: 'Что нужно понять в первую очередь' })).toBeVisible();
  await expect(page.getByText(/Модель — это целевое/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'На чём держится тема' })).toBeVisible();

  await mode.getByRole('button', { name: /Проверить себя/ }).click();
  await expect(page.getByRole('heading', { name: 'Сначала попробуйте ответить сами' })).toBeVisible();
  await page.getByRole('button', { name: /Показать ответ/ }).click();
  await expect(page.getByText(/Модель — это целевое/)).toBeVisible();
});

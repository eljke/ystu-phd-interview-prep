import type { Page } from '@playwright/test';

export async function completeOnboarding(page: Page) {
  await page.goto('/');
  await page.getByLabel('Первый участник').fill('Анна');
  await page.getByLabel('Второй участник').fill('Борис');
  await page.getByRole('button', { name: 'Начать подготовку' }).click();
  await page.getByRole('navigation', { name: 'Основная навигация' }).waitFor();
}

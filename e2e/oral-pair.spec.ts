import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test('partners can assess an answer and rotate roles', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'Парная сессия' }).click();
  await expect(page.getByText('Анна').first()).toBeVisible();
  await page.getByRole('button', { name: 'Ответ закончен — открыть проверку' }).click();
  const yesButtons = page.getByRole('button', { name: 'Да' });
  const count = await yesButtons.count();
  for (let index = 0; index < count; index += 1) await yesButtons.nth(index).click();
  await page.getByRole('button', { name: 'Сохранить и поменять роли' }).click();
  await expect(page.locator('.roles article').first()).toContainText('Борис');
});

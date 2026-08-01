import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test('partners can assess an answer and rotate roles', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'Парная сессия', exact: true }).click();
  const responder = page.locator('.roles article').first().locator('strong');
  await expect(responder).toHaveText(/Анна|Борис/);
  const initialResponder = await responder.innerText();
  await page.getByRole('button', { name: 'Ответ закончен — открыть проверку' }).click();
  const yesButtons = page.getByRole('button', { name: 'Да' });
  const count = await yesButtons.count();
  for (let index = 0; index < count; index += 1) await yesButtons.nth(index).click();
  await page.getByRole('button', { name: 'Сохранить и поменять роли' }).click();
  await expect(responder).not.toHaveText(initialResponder);
});

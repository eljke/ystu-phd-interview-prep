import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { completeOnboarding } from './helpers';

test('backup can be exported and validated before import', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('link', { name: 'Резервная копия' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Скачать JSON/ }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const snapshot = JSON.parse(await readFile(path!, 'utf8')) as { profiles: unknown[]; checksum: string };
  expect(snapshot.profiles).toHaveLength(2);
  expect(snapshot.checksum).toMatch(/^[a-f0-9]{64}$/);
  await page.locator('input[type=file]').setInputFiles(path!);
  await expect(page.getByRole('heading', { name: 'Файл готов к импорту' })).toBeVisible();
});

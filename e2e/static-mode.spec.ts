import { expect, test } from '@playwright/test';

test('runs the static demo without an Agent server', async ({ page }) => {
  const backendRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes(':8099')) {
      backendRequests.push(request.url());
    }
  });
  await page.goto('http://127.0.0.1:8111/?demo=1&autoplay=0');
  await expect(page.locator('[data-role="agent-mode"]'))
    .toHaveText('剧本模式');
  await expect(page.locator('[data-role="scene-status"]'))
    .toHaveText('场景已就绪', { timeout: 60_000 });
  await page.getByRole('button', { name: '定位二沉池' }).click();
  await expect(page.locator('[data-role="selection-tag"]'))
    .toHaveText('SC-101', { timeout: 10_000 });
  expect(backendRequests).toEqual([]);
});

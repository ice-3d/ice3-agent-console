import { expect, test } from '@playwright/test';

test('keeps the conversation and quick actions usable on a narrow screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8110/?demo=1&autoplay=0');
  await expect(page.locator('[data-role="scene-status"]'))
    .toHaveText('场景已就绪', { timeout: 60_000 });
  const panel = page.locator('.conversation-panel');
  const quick = page.getByRole('navigation', { name: '快捷指令' });
  await expect(panel).toBeVisible();
  await expect(quick).toBeVisible();
  const panelBox = await panel.boundingBox();
  const quickBox = await quick.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(quickBox).not.toBeNull();
  expect(quickBox!.y + quickBox!.height).toBeLessThanOrEqual(panelBox!.y);
});

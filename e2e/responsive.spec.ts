import { expect, test } from '@playwright/test';

test('keeps scripts above the composer inside the conversation panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8110/?demo=1&autoplay=0');
  await expect(page.locator('[data-role="scene-status"]'))
    .toHaveText('场景已就绪', { timeout: 60_000 });
  const panel = page.locator('.conversation-panel');
  const quick = page.getByRole('navigation', { name: '快捷指令' });
  const composer = page.locator('[data-role="composer"]');
  await expect(panel).toBeVisible();
  await expect(quick).toBeVisible();
  await expect(composer).toBeVisible();
  const panelBox = await panel.boundingBox();
  const quickBox = await quick.boundingBox();
  const composerBox = await composer.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(quickBox).not.toBeNull();
  expect(composerBox).not.toBeNull();
  expect(quickBox!.x).toBeGreaterThanOrEqual(panelBox!.x);
  expect(quickBox!.x + quickBox!.width)
    .toBeLessThanOrEqual(panelBox!.x + panelBox!.width);
  expect(quickBox!.y).toBeGreaterThanOrEqual(panelBox!.y);
  expect(quickBox!.y + quickBox!.height)
    .toBeLessThanOrEqual(composerBox!.y);
});

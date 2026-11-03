import { expect, test } from '@playwright/test';

async function openOverview(page: import('@playwright/test').Page) {
  await page.goto('http://127.0.0.1:8110/?demo=1&autoplay=0');
  await expect(page.locator('[data-role="scene-status"]'))
    .toHaveText('场景已就绪', { timeout: 60_000 });
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  }));
}

async function cameraSnapshot(page: import('@playwright/test').Page) {
  return page.evaluate(() => window.__ICE3_AGENT_CONSOLE__!.snapshot());
}

function distance(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
): number {
  return Math.hypot(
    left[0] - right[0],
    left[1] - right[1],
    left[2] - right[2],
  );
}

test('the first zoom keeps the overview camera target', async ({ page }) => {
  await openOverview(page);
  const before = await cameraSnapshot(page);

  await page.mouse.move(320, 420);
  await page.mouse.wheel(0, -30);
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  }));

  const after = await cameraSnapshot(page);
  expect(distance(after.cameraTarget, before.cameraTarget)).toBeLessThan(1);
  expect(distance(after.cameraPosition, after.cameraTarget))
    .toBeGreaterThan(100);
});

test('the first rotation keeps the overview camera target', async ({ page }) => {
  await openOverview(page);
  const before = await cameraSnapshot(page);

  await page.mouse.move(320, 420);
  await page.mouse.down();
  await page.mouse.move(350, 420, { steps: 4 });
  await page.mouse.up();
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  }));

  const after = await cameraSnapshot(page);
  expect(distance(after.cameraTarget, before.cameraTarget)).toBeLessThan(1);
  expect(distance(after.cameraPosition, after.cameraTarget))
    .toBeGreaterThan(100);
});

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

test('keeps all ICE3 project links visible below the composer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8110/?demo=1&autoplay=0');
  await expect(page.locator('[data-role="scene-status"]'))
    .toHaveText('场景已就绪', { timeout: 60_000 });

  const panel = page.locator('.conversation-panel');
  const composer = page.locator('[data-role="composer"]');
  const projects = page.locator('[data-role="project-links"]');
  await expect(projects).toBeVisible();
  await expect(projects.locator('a')).toHaveCount(7);

  const panelBox = await panel.boundingBox();
  const composerBox = await composer.boundingBox();
  const projectsBox = await projects.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(composerBox).not.toBeNull();
  expect(projectsBox).not.toBeNull();
  expect(projectsBox!.y).toBeGreaterThanOrEqual(
    composerBox!.y + composerBox!.height,
  );
  expect(projectsBox!.y + projectsBox!.height).toBeLessThanOrEqual(
    panelBox!.y + panelBox!.height,
  );
});

test('keeps the composer input and send button compact and aligned', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8110/?demo=1&autoplay=0');
  await expect(page.locator('[data-role="scene-status"]'))
    .toHaveText('场景已就绪', { timeout: 60_000 });

  const input = page.locator('[data-role="composer-input"]');
  const send = page.locator('[data-role="composer-submit"]');
  const label = page.locator('label[for="agent-command"]');
  const inputBox = await input.boundingBox();
  const sendBox = await send.boundingBox();
  const labelBox = await label.boundingBox();

  expect(inputBox).not.toBeNull();
  expect(sendBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect(inputBox!.height).toBeGreaterThanOrEqual(44);
  expect(sendBox!.height).toBeGreaterThanOrEqual(44);
  expect(Math.abs(inputBox!.height - sendBox!.height)).toBeLessThanOrEqual(1);
  expect(inputBox!.width).toBeGreaterThan(sendBox!.width * 2.5);
  expect(labelBox!.width).toBeLessThanOrEqual(2);
  expect(labelBox!.height).toBeLessThanOrEqual(2);
});

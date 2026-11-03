// 闪烁定位：驱动相机旋转/缩放并连拍帧，输出帧间差异热区。
// 用法: node scripts/flicker-hunt.mjs [outDir] [mode]
//   mode: rotate（默认）连续小幅拖拽旋转 | zoom 滚轮缩放
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const consoleRoot = resolve(dirname(fileURLToPath(import.meta.url)), '.');
const outDir = process.argv[2] ?? resolve(consoleRoot, 'output/flicker');
const mode = process.argv[3] ?? 'rotate';
const FRAMES = 24;

const { chromium } = await import(
  new URL('../node_modules/playwright/index.mjs', import.meta.url).href
);
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
  });
  await page.goto('http://127.0.0.1:8110/?demo=1&autoplay=0', {
    waitUntil: 'load',
    timeout: 60_000,
  });
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(8000);

  await mkdir(outDir, { recursive: true });
  const canvas = await page.locator('canvas').first().boundingBox();
  const cx = canvas.x + canvas.width / 2;
  const cy = canvas.y + canvas.height / 2;

  // 帧捕获：截图存 buffer，同时驱动相机连续运动（每个循环一动一拍）。
  const frames = [];
  for (let index = 0; index < FRAMES; index += 1) {
    if (mode === 'still') {
      // 静止基线：无输入，帧间差异即真闪烁。
    } else if (mode === 'slow') {
      // 匀速连续拖拽：按住不放每帧小步移动，相机单向平滑运动。
      if (index === 0) {
        await page.mouse.move(cx, cy);
        await page.mouse.down();
      }
      await page.mouse.move(cx + 5 * (index + 1), cy + index, { steps: 1 });
      if (index === FRAMES - 1) await page.mouse.up();
    } else if (mode === 'zoom') {
      await page.mouse.wheel(0, index % 2 === 0 ? -120 : 120);
    } else {
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 30, cy + 6, { steps: 3 });
      await page.mouse.up();
    }
    await page.waitForTimeout(160);
    frames.push(await page.screenshot({ type: 'png' }));
  }

  for (let index = 0; index < frames.length; index += 1) {
    await writeFile(resolve(outDir, `frame-${String(index).padStart(2, '0')}.png`), frames[index]);
  }
  console.log(`${FRAMES} frames captured to ${outDir} (mode=${mode})`);
} finally {
  await browser.close().catch(() => {});
}

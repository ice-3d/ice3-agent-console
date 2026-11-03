// 对运行中的 ice3-agent-console 做视觉验证：加载场景、等 ready、截屏。
import { mkdir } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const consoleRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const url = process.argv[2] ?? 'http://127.0.0.1:8110/?demo=1&autoplay=0';
const out = process.argv[3] ?? resolve(consoleRoot, 'output/console-shot.png');
const settleMs = Number(process.argv[4] ?? 6000);

const { chromium } = await import(
  new URL('../node_modules/playwright/index.mjs', import.meta.url).href
);
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text().slice(0, 200));
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      errors.push(`[http ${response.status()}] ${response.url().slice(0, 160)}`);
    }
  });
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  // 等舞台 canvas 出现并静置；巡游关闭时相机停在总览。
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(settleMs);
  await mkdir(dirname(out), { recursive: true });
  await page.screenshot({ path: out });
  console.log(out);
  if (errors.length > 0) {
    for (const error of errors.slice(0, 8)) process.stderr.write(`[console] ${error}\n`);
  }
} finally {
  await browser.close().catch(() => {});
}

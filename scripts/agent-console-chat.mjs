// 对运行中的 ice3-agent-console 做对话 Agent 工具调用验证：发送指令、等聚焦、截屏。
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const consoleRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const instruction = process.argv[2] ?? '定位紫外消毒渠';
const out = process.argv[3] ?? resolve(consoleRoot, 'output/console-agent-focus.png');

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
  await page.goto('http://127.0.0.1:8110/?demo=0&autoplay=0', {
    waitUntil: 'load',
    timeout: 60_000,
  });
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(5000);

  const input = page.getByPlaceholder('例如：定位二沉池 A');
  await input.fill(instruction);
  await page.getByRole('button', { name: '发送' }).click();
  // 等对话回复完成（流式文本 + 聚焦动画）。
  await page.waitForTimeout(16_000);
  const dialogue = await page.evaluate(() => {
    const messages = Array.from(
      document.querySelectorAll('.conversation-scroll *'),
    );
    return messages
      .map((node) => (node.textContent ?? '').trim())
      .filter((text) => text.length > 6)
      .slice(-8);
  });

  await mkdir(dirname(out), { recursive: true });
  await page.screenshot({ path: out });
  console.log(out);
  console.log('--- dialogue tail ---');
  for (const text of dialogue) console.log('>', text.slice(0, 220));
  if (errors.length > 0) {
    for (const error of errors.slice(0, 6)) process.stderr.write(`[console] ${error}\n`);
  }
} finally {
  await browser.close().catch(() => {});
}

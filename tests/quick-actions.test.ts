import { expect } from '#test-expect';
import { JSDOM } from 'jsdom';
import { test } from 'node:test';
import { createQuickActions } from '../src/view/quick-actions.js';

test('renders all grouped built-in scenarios above the composer', () => {
  const dom = new JSDOM('<div id="composer"></div>');
  const host = dom.window.document.querySelector('#composer') as HTMLElement;
  const selected: string[] = [];
  const navigation = createQuickActions(host, (prompt) => {
    selected.push(prompt);
  });

  expect(navigation.getAttribute('aria-label')).toBe('快捷指令');
  expect([...navigation.querySelectorAll('.quick-action-group__label')]
    .map((element) => element.textContent)).toEqual([
    '工艺巡览',
    '系统专题',
    '快速操作',
  ]);
  expect(navigation.querySelectorAll('button')).toHaveLength(11);

  [...navigation.querySelectorAll<HTMLButtonElement>('button')]
    .find((button) => button.textContent === '曝气系统')!
    .click();
  expect(selected).toEqual(['查看曝气系统']);
});

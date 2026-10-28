import { expect } from '#test-expect';
import { JSDOM } from 'jsdom';
import { test } from 'node:test';
import { EquipmentCard } from '../src/view/equipment-card.js';

test('shows equipment identity and hides cleanly', () => {
  const dom = new JSDOM('<main></main>');
  const host = dom.window.document.querySelector('main')!;
  const card = new EquipmentCard(host as unknown as HTMLElement);
  card.show({
    selectionId: 'ice3-virtual-wwtp/equipment/SC-101',
    name: '二沉池 A',
    tag: 'SC-101',
    stage: '二沉与污泥回流',
    area: '二沉与回流区',
    connectionCount: 4,
  });
  expect(card.element.hidden).toBe(false);
  expect(card.element.textContent).toContain('二沉池 A');
  expect(card.element.textContent).toContain('SC-101');
  expect(card.element.textContent).toContain('4 条连接');
  card.show(null);
  expect(card.element.hidden).toBe(true);
});

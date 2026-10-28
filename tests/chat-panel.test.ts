import { expect } from '#test-expect';
import { JSDOM } from 'jsdom';
import { test } from 'node:test';
import { initialState } from '../src/protocol/reducer.js';
import { ChatPanel } from '../src/view/chat-panel.js';

test('renders streamed assistant text and user messages', () => {
  const dom = new JSDOM('<main></main>');
  const panel = new ChatPanel(
    dom.window.document.querySelector('main') as unknown as HTMLElement,
  );
  panel.appendUserMessage('定位二沉池');
  const state = {
    ...initialState('thread-1'),
    status: 'running' as const,
    items: [{
      kind: 'text' as const,
      id: 'assistant-1',
      role: 'assistant',
      text: '正在定位 **二沉池 A**。',
      done: false,
    }],
  };
  panel.render(state);
  panel.setBusy(true);

  expect(panel.element.textContent).toContain('定位二沉池');
  expect(panel.element.textContent).toContain('二沉池 A');
  expect(panel.element.querySelector('strong')?.textContent).toBe('二沉池 A');
  expect(panel.submit.disabled).toBe(true);
  expect(panel.stateLabel.textContent).toContain('思考中');
});

test('submits a typed message and clears the input', () => {
  const dom = new JSDOM('<main></main>');
  const panel = new ChatPanel(
    dom.window.document.querySelector('main') as unknown as HTMLElement,
  );
  const messages: string[] = [];
  panel.onSubmit((text) => messages.push(text));
  panel.input.value = '查看全厂';
  panel.form.dispatchEvent(new dom.window.Event('submit', {
    bubbles: true,
    cancelable: true,
  }));
  expect(messages).toEqual(['查看全厂']);
  expect(panel.input.value).toBe('');
});

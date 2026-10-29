import { expect } from '#test-expect';
import { test } from 'node:test';
import type { ICE3 } from 'ice3';
import { initializeSceneEngine } from '../src/scene/browser.ts';

test('initializes the Console with automatic renderer selection', async () => {
  const stage = {} as HTMLElement;
  let receivedStage: HTMLElement | undefined;
  const fakeEngine = {
    async initAsync(value: HTMLElement) {
      receivedStage = value;
      await Promise.resolve();
      return fakeEngine;
    },
  } as unknown as ICE3;
  let received: Readonly<{ renderer: 'auto' }> | undefined;

  const result = await initializeSceneEngine(stage, (options) => {
    received = options;
    return fakeEngine;
  });

  expect(received).toEqual({ renderer: 'auto' });
  expect(receivedStage).toBe(stage);
  expect(result).toBe(fakeEngine);
});

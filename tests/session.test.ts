import { EventType } from '@ag-ui/core';
import { expect } from '#test-expect';
import { test } from 'node:test';
import {
  createSession,
  type SessionView,
} from '../src/app/session.js';
import type { RunTransport } from '../src/protocol/run-input.js';
import type {
  EquipmentRecord,
  SceneController,
} from '../src/scene/types.js';

class FakeScene implements SceneController {
  readonly commands: unknown[] = [];
  readonly recordsValue: readonly EquipmentRecord[] = [{
    selectionId: 'ice3-virtual-wwtp/equipment/SC-101',
    name: '二沉池 A',
    metadata: { equipmentTag: 'SC-101' },
    bounds: { min: [-7, 0, -7], max: [7, 5, 7] },
  }];

  records(): readonly EquipmentRecord[] {
    return this.recordsValue;
  }

  setSelection(): void {}

  async focus(): Promise<void> {}

  async setView(): Promise<void> {}

  snapshot() {
    return {
      selectedIds: [],
      view: 'overview' as const,
      cameraPosition: [0, 10, 20] as const,
      cameraTarget: [0, 0, 0] as const,
    };
  }

  async execute(command: unknown) {
    this.commands.push(command);
    return {
      ok: true,
      selectionIds: ['ice3-virtual-wwtp/equipment/SC-101'],
      message: '已定位二沉池 A',
    };
  }

  onSelection(): () => void {
    return () => {};
  }

  onUserCameraIntent(): () => void {
    return () => {};
  }

  async whenReady(): Promise<void> {}

  dispose(): void {}
}

class FakeView implements SessionView {
  readonly messages: string[] = [];

  appendUserMessage(text: string): void {
    this.messages.push(text);
  }

  render(): void {}

  renderEquipment(): void {}

  setBusy(): void {}

  setError(): void {}
}

function scriptedTransport(): RunTransport {
  return async (_request, handlers) => {
    handlers.onEvent({
      type: EventType.RUN_STARTED,
      threadId: 'thread-1',
      runId: 'run-1',
    });
    handlers.onEvent({
      type: EventType.TOOL_CALL_START,
      toolCallId: 'tool-1',
      toolCallName: 'focus_equipment',
    });
    handlers.onEvent({
      type: EventType.TOOL_CALL_ARGS,
      toolCallId: 'tool-1',
      delta: '{"selectionId":"ice3-virtual-wwtp/equipment/SC-101"}',
    });
    handlers.onEvent({
      type: EventType.TOOL_CALL_END,
      toolCallId: 'tool-1',
    });
    handlers.onEvent({
      type: EventType.RUN_FINISHED,
      threadId: 'thread-1',
      runId: 'run-1',
    });
    handlers.onDone?.();
  };
}

test('routes a complete scene tool call to the controller', async () => {
  const scene = new FakeScene();
  const session = createSession({
    transport: scriptedTransport(),
    scene,
    view: new FakeView(),
    threadId: 'thread-1',
  });

  await session.send('定位二沉池');

  expect(scene.commands).toEqual([{
    type: 'focus',
    selectionIds: ['ice3-virtual-wwtp/equipment/SC-101'],
  }]);
  expect(session.state.status).toBe('idle');
});

test('manual scene intent cancels pending autoplay', async () => {
  let calls = 0;
  const transport: RunTransport = async (_request, handlers) => {
    calls += 1;
    handlers.onDone?.();
  };
  const session = createSession({
    transport,
    scene: new FakeScene(),
    view: new FakeView(),
    threadId: 'thread-1',
    autoplay: { enabled: true, delayMs: 40 },
  });
  session.start();
  session.notifyUserSceneIntent();
  await new Promise((resolve) => setTimeout(resolve, 70));
  expect(calls).toBe(0);
});

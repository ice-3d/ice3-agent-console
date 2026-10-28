import { EventType } from '@ag-ui/core';
import { expect } from '#test-expect';
import { test } from 'node:test';
import { createModelAgent } from '../server/agents/model.js';

test('emits a provider failure instead of scripted fallback', async () => {
  const agent = createModelAgent({
    complete: async () => {
      throw new Error('provider unavailable');
    },
  });
  const events = [];
  for await (const event of agent.run({
    threadId: 'thread-1',
    runId: 'run-1',
    state: {},
    messages: [{ id: 'u1', role: 'user', content: '定位二沉池' }],
    context: [],
    tools: [],
    forwardedProps: {},
  })) {
    events.push(event);
  }
  expect(events.at(-1)).toMatchObject({
    type: EventType.RUN_ERROR,
    message: 'provider unavailable',
  });
  expect(events.some((event) => event.type === EventType.TOOL_CALL_START))
    .toBe(false);
});

test('maps approved model tool calls to the shared event stream', async () => {
  const agent = createModelAgent({
    complete: async () => ({
      text: '正在定位二沉池。',
      toolCalls: [{
        id: 'provider-call-1',
        name: 'focus_equipment',
        arguments: '{"selectionId":"ice3-virtual-wwtp/equipment/SC-101"}',
      }],
    }),
  });
  const events = [];
  for await (const event of agent.run({
    threadId: 'thread-1',
    runId: 'run-1',
    state: {},
    messages: [{ id: 'u1', role: 'user', content: '定位二沉池' }],
    context: [],
    tools: [],
    forwardedProps: {},
  })) {
    events.push(event);
  }
  expect(events.some((event) => (
    event.type === EventType.TOOL_CALL_START
    && event.toolCallName === 'focus_equipment'
  ))).toBe(true);
  expect(events.at(-1)?.type).toBe(EventType.RUN_FINISHED);
});

test('rejects unapproved model tools without emitting them', async () => {
  const agent = createModelAgent({
    complete: async () => ({
      toolCalls: [{
        id: 'provider-call-1',
        name: 'delete_scene',
        arguments: '{}',
      }],
    }),
  });
  const events = [];
  for await (const event of agent.run({
    threadId: 'thread-1',
    runId: 'run-1',
    state: {},
    messages: [{ id: 'u1', role: 'user', content: 'test' }],
    context: [],
    tools: [],
    forwardedProps: {},
  })) {
    events.push(event);
  }
  expect(events.some((event) => event.type === EventType.TOOL_CALL_START))
    .toBe(false);
  expect(events.at(-1)).toMatchObject({
    type: EventType.RUN_ERROR,
    message: expect.stringContaining('不支持的场景工具'),
  });
});

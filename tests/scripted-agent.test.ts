import type { RunAgentInput } from '@ag-ui/core';
import { EventType } from '@ag-ui/core';
import { expect } from '#test-expect';
import { test } from 'node:test';
import { createScriptedAgent } from '../server/agents/scripted.js';

const input = (text: string): RunAgentInput => ({
  threadId: 'thread-1',
  runId: 'run-1',
  state: {},
  messages: [{ id: 'user-1', role: 'user', content: text }],
  context: [],
  tools: [],
  forwardedProps: {},
});

test('returns a deterministic overview tool sequence', async () => {
  const events = [];
  for await (const event of createScriptedAgent({ delayMs: 0 }).run(
    input('带我看一下整个污水处理厂'),
  )) {
    events.push(event);
  }
  expect(events[0]?.type).toBe(EventType.RUN_STARTED);
  expect(events.some((event) => (
    event.type === EventType.TOOL_CALL_START
    && event.toolCallName === 'set_camera_view'
  ))).toBe(true);
  expect(events.at(-1)?.type).toBe(EventType.RUN_FINISHED);
});

test('uses current equipment context for a follow-up explanation', async () => {
  const request = input('讲讲这个设备');
  request.context = [{
    description: 'selected equipment',
    value: 'ice3-virtual-wwtp/equipment/AE-101',
  }];
  const names: string[] = [];
  for await (const event of createScriptedAgent({ delayMs: 0 }).run(request)) {
    if (event.type === EventType.TOOL_CALL_START) {
      names.push(String(event.toolCallName));
    }
  }
  expect(names).toContain('focus_equipment');
  expect(names).toContain('highlight_equipment');
});

test('locates known equipment groups and clears focus', async () => {
  const toolNames = async (text: string): Promise<string[]> => {
    const names: string[] = [];
    for await (const event of createScriptedAgent({ delayMs: 0 }).run(input(text))) {
      if (event.type === EventType.TOOL_CALL_START) {
        names.push(String(event.toolCallName));
      }
    }
    return names;
  };
  expect(await toolNames('二沉池在哪里')).toContain('focus_equipment');
  expect(await toolNames('介绍一下好氧池')).toContain('focus_equipment');
  expect(await toolNames('回到全厂')).toContain('clear_scene_focus');
});

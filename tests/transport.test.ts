import { expect } from '#test-expect';
import { test } from 'node:test';
import { runAgentLocally } from '../src/protocol/local-agent.js';
import {
  parseSseEvents,
  runAgentServer,
} from '../src/protocol/client.js';

test('local scripted transport emits the same lifecycle as server transport', async () => {
  const types: string[] = [];
  await runAgentLocally(
    {
      threadId: 'thread-1',
      runId: 'run-1',
      messages: [{ id: 'u1', role: 'user', content: '全厂总览' }],
      context: [],
    },
    { onEvent: (event) => types.push((event as { type: string }).type) },
  );
  expect(types[0]).toBe('RUN_STARTED');
  expect(types.at(-1)).toBe('RUN_FINISHED');
});

test('parses split SSE data frames', () => {
  expect(parseSseEvents(
    'data: {"type":"RUN_STARTED"}\n\n'
      + 'data: {"type":"TEXT_MESSAGE_CONTENT",\n'
      + 'data: "delta":"ok"}\n\n',
  )).toEqual([
    { type: 'RUN_STARTED' },
    { type: 'TEXT_MESSAGE_CONTENT', delta: 'ok' },
  ]);
});

test('server transport reports an unavailable endpoint', async () => {
  const errors: string[] = [];
  await runAgentServer(
    {
      threadId: 'thread-1',
      runId: 'run-1',
      messages: [{ id: 'u1', role: 'user', content: '全厂总览' }],
      context: [],
    },
    {
      onEvent: () => {},
      onError: (error) => errors.push(error.message),
    },
    undefined,
    'http://127.0.0.1:1/agui',
  );
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('Agent 服务不可用');
});

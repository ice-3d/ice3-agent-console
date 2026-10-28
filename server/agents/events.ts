import { EventType } from '@ag-ui/core';
import type { SceneToolName } from '../../shared/contract.js';

export interface AgentEvent {
  readonly type: EventType;
  readonly toolCallName?: string;
  readonly toolCallId?: string;
  readonly messageId?: string;
  readonly delta?: string;
  readonly threadId?: string;
  readonly runId?: string;
  readonly [key: string]: unknown;
}

export interface TextStream {
  readonly text: string;
  readonly holdMs?: number;
  readonly tool?: {
    readonly name: SceneToolName;
    readonly args: Readonly<Record<string, unknown>>;
  };
}

export async function* emitAgentPlan(options: {
  readonly threadId: string;
  readonly runId: string;
  readonly plan: readonly TextStream[];
  readonly delayMs: number;
  readonly signal?: AbortSignal;
}): AsyncIterable<AgentEvent> {
  const {
    threadId,
    runId,
    plan,
    delayMs,
    signal,
  } = options;
  let ordinal = 0;
  const id = (prefix: string): string => (
    `${prefix}_${runId}_${(ordinal++).toString(36)}`
  );
  const pause = async (): Promise<void> => {
    if (delayMs <= 0) return;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  };
  const ensureActive = (): void => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  };

  yield {
    type: EventType.RUN_STARTED,
    threadId,
    runId,
  };

  for (const beat of plan) {
    ensureActive();
    const messageId = id('message');
    yield {
      type: EventType.TEXT_MESSAGE_START,
      messageId,
      role: 'assistant',
    };
    await pause();
    for (const delta of beat.text.match(/.{1,8}/gu) ?? []) {
      ensureActive();
      yield {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId,
        delta,
      };
      await pause();
    }
    yield {
      type: EventType.TEXT_MESSAGE_END,
      messageId,
    };

    if (!beat.tool) continue;
    const toolCallId = id('tool');
    yield {
      type: EventType.TOOL_CALL_START,
      toolCallId,
      toolCallName: beat.tool.name,
    };
    await pause();
    yield {
      type: EventType.TOOL_CALL_ARGS,
      toolCallId,
      delta: JSON.stringify(beat.tool.args),
    };
    await pause();
    yield {
      type: EventType.TOOL_CALL_END,
      toolCallId,
    };
    if (beat.holdMs && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, beat.holdMs));
    }
  }

  ensureActive();
  yield {
    type: EventType.RUN_FINISHED,
    threadId,
    runId,
  };
}

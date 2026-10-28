import { createScriptedAgent } from '../../server/agents/scripted.js';
import type {
  RunHandlers,
  RunRequest,
  RunTransport,
} from './run-input.js';
import { toRunAgentInput } from './run-input.js';

export const runAgentLocally: RunTransport = async (
  request: RunRequest,
  handlers: RunHandlers,
  signal?: AbortSignal,
) => {
  const agent = createScriptedAgent({ delayMs: 16 });
  try {
    for await (const event of agent.run(toRunAgentInput(request), signal)) {
      if (signal?.aborted) return;
      handlers.onEvent(event);
    }
    handlers.onDone?.();
  } catch (error) {
    if (signal?.aborted) return;
    const normalized = error instanceof Error
      ? error
      : new Error(String(error));
    handlers.onError?.(normalized);
    throw normalized;
  }
};

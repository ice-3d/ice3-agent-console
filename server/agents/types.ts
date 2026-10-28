import type { RunAgentInput } from '@ag-ui/core';
import type { AgentEvent } from './events.js';

export interface AgentRun {
  run(
    input: RunAgentInput,
    signal?: AbortSignal,
  ): AsyncIterable<AgentEvent>;
}

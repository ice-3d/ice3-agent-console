import type { RunAgentInput } from '@ag-ui/core';

export interface RunMessage {
  readonly id: string;
  readonly role: string;
  readonly content: string;
}

export interface RunContextEntry {
  readonly description: string;
  readonly value: string;
}

export interface ResumeEntry {
  readonly interruptId: string;
  readonly status: 'resolved' | 'cancelled';
  readonly payload?: unknown;
}

export interface RunRequest {
  readonly threadId: string;
  readonly runId: string;
  readonly messages: readonly RunMessage[];
  readonly state?: unknown;
  readonly context?: readonly RunContextEntry[];
  readonly resume?: readonly ResumeEntry[];
}

export interface RunHandlers {
  readonly onEvent: (event: unknown) => void;
  readonly onError?: (error: Error) => void;
  readonly onDone?: () => void;
}

export type RunTransport = (
  request: RunRequest,
  handlers: RunHandlers,
  signal?: AbortSignal,
) => Promise<void>;

export function toRunAgentInput(request: RunRequest): RunAgentInput {
  return {
    threadId: request.threadId,
    runId: request.runId,
    state: request.state ?? {},
    messages: request.messages,
    context: request.context ?? [],
    tools: [],
    forwardedProps: {},
    ...(request.resume && request.resume.length > 0
      ? { resume: request.resume }
      : {}),
  } as unknown as RunAgentInput;
}

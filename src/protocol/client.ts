import type {
  RunHandlers,
  RunRequest,
  RunTransport,
} from './run-input.js';
import { toRunAgentInput } from './run-input.js';

function defaultAgentEndpoint(): string {
  if (typeof window === 'undefined') return 'http://127.0.0.1:8099/agui';
  const url = new URL(window.location.href);
  url.port = '8099';
  url.pathname = '/agui';
  url.search = '';
  url.hash = '';
  return url.toString();
}

function decodeSseData(block: string): unknown {
  const payload = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');
  return JSON.parse(payload);
}

export function parseSseEvents(source: string): readonly unknown[] {
  return source
    .split(/\r?\n\r?\n/u)
    .filter((block) => block.trim() && !block.startsWith(':'))
    .map(decodeSseData);
}

export async function runAgentServer(
  request: RunRequest,
  handlers: RunHandlers,
  signal?: AbortSignal,
  endpoint = defaultAgentEndpoint(),
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(toRunAgentInput(request)),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) return;
    const failure = new Error(
      `Agent 服务不可用：${(error as Error).message}`,
    );
    handlers.onError?.(failure);
    return;
  }
  if (!response.ok || !response.body) {
    const failure = new Error(
      `Agent 服务不可用：HTTP ${response.status}`,
    );
    handlers.onError?.(failure);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      let boundary = pending.search(/\r?\n\r?\n/u);
      while (boundary >= 0) {
        const block = pending.slice(0, boundary);
        pending = pending.slice(boundary + (pending[boundary] === '\r' ? 4 : 2));
        if (block.trim() && !block.startsWith(':')) {
          handlers.onEvent(decodeSseData(block));
        }
        boundary = pending.search(/\r?\n\r?\n/u);
      }
      if (done) break;
    }
    handlers.onDone?.();
  } catch (error) {
    if (signal?.aborted) return;
    const failure = error instanceof Error
      ? error
      : new Error(String(error));
    handlers.onError?.(failure);
  } finally {
    reader.releaseLock();
  }
}

export const runAgentServerTransport: RunTransport = (
  request,
  handlers,
  signal,
) => runAgentServer(request, handlers, signal);

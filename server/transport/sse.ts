export const SSE_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'close',
  'X-Accel-Buffering': 'no',
});

export function encodeSse(event: unknown): string {
  const payload = JSON.stringify(event);
  return `${payload.split('\n').map((line) => `data: ${line}`).join('\n')}\n\n`;
}

export function encodeKeepAlive(): string {
  return ': keepalive\n\n';
}

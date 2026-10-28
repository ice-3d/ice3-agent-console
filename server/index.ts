import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { RunAgentInputSchema } from '@ag-ui/core/schemas';
import type { ICEServerConfig } from './config.js';
import { loadServerConfig } from './config.js';
import { createScriptedAgent } from './agents/scripted.js';
import type { AgentRun } from './agents/types.js';
import { encodeKeepAlive, encodeSse, SSE_HEADERS } from './transport/sse.js';

const AGUI_PATH = '/agui';
const HEALTH_PATH = '/health';
const MAX_BODY_BYTES = 2 * 1024 * 1024;

const CORS_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
});

export interface RunningAgentServer {
  readonly url: string;
  close(): Promise<void>;
}

function json(
  response: http.ServerResponse,
  status: number,
  value: unknown,
): void {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    Connection: 'close',
  });
  response.end(body);
}

function readBody(request: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let bytes = 0;
    request.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(new Error('请求体超过 2 MiB'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

async function runAgent(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  config: ICEServerConfig,
  agent: AgentRun,
): Promise<void> {
  if (config.mode === 'invalid') {
    json(response, 503, { error: config.error });
    return;
  }
  let input;
  try {
    const parsed = RunAgentInputSchema.safeParse(
      JSON.parse(await readBody(request) || '{}'),
    );
    if (!parsed.success) {
      json(response, 422, {
        error: 'RunAgentInput 校验失败',
        issues: parsed.error.issues,
      });
      return;
    }
    input = parsed.data;
  } catch (error) {
    json(response, 400, {
      error: `请求体解析失败：${(error as Error).message}`,
    });
    return;
  }

  response.writeHead(200, { ...CORS_HEADERS, ...SSE_HEADERS });
  response.flushHeaders();
  const abort = new AbortController();
  response.on('close', () => abort.abort());
  const keepAlive = setInterval(() => response.write(encodeKeepAlive()), 15_000);
  try {
    for await (const event of agent.run(input, abort.signal)) {
      if (abort.signal.aborted) break;
      response.write(encodeSse(event));
    }
  } catch (error) {
    if (!abort.signal.aborted) {
      response.write(encodeSse({
        type: 'RUN_ERROR',
        message: (error as Error).message || 'Agent 执行失败',
      }));
    }
  } finally {
    clearInterval(keepAlive);
    response.end();
  }
}

export async function createAgentServer(
  config: ICEServerConfig,
): Promise<RunningAgentServer> {
  const agent = createScriptedAgent({ delayMs: config.paceMs });
  const server = http.createServer((request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, CORS_HEADERS);
      response.end();
      return;
    }
    if (request.method === 'POST' && request.url === AGUI_PATH) {
      void runAgent(request, response, config, agent);
      return;
    }
    if (request.method === 'GET' && request.url === HEALTH_PATH) {
      json(response, config.mode === 'invalid' ? 503 : 200, config.health);
      return;
    }
    json(response, 404, { error: '路由不存在' });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Agent 服务地址无效');
  }
  return {
    url: `http://${address.address}:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeAllConnections?.();
    }),
  };
}

const directEntry = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;
if (directEntry) {
  const config = loadServerConfig(process.env);
  const running = await createAgentServer(config);
  console.log(`ICE3 Agent endpoint: ${running.url}${AGUI_PATH}`);
  console.log(`ICE3 Agent mode: ${config.mode}`);
  if (config.error) console.error(config.error);
}

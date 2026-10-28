import type { ICEAgentEnvironment } from './env.js';

export interface ICEModelConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly name: string;
}

export interface ICEServerHealth {
  readonly ok: boolean;
  readonly agent: 'scripted' | 'model' | 'invalid';
  readonly transport: 'server';
  readonly model?: string;
  readonly endpoint?: string;
}

export interface ICEServerConfig {
  readonly port: number;
  readonly mode: 'scripted' | 'model' | 'invalid';
  readonly paceMs: number;
  readonly model?: ICEModelConfig;
  readonly error?: string;
  readonly health: ICEServerHealth;
}

function endpointHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return 'invalid-endpoint';
  }
}

export function loadServerConfig(env: ICEAgentEnvironment): ICEServerConfig {
  const port = Number(env.ICE_AGENT_PORT ?? 8099);
  const paceMs = Number(env.ICE_AGENT_PACE ?? 18);
  const baseUrl = env.ICE_AGENT_MODEL_BASE_URL?.trim();
  const apiKey = env.ICE_AGENT_MODEL_API_KEY?.trim();
  const name = env.ICE_AGENT_MODEL_NAME?.trim();
  const provided = [baseUrl, apiKey, name].filter(Boolean).length;

  if (provided === 0) {
    return {
      port,
      paceMs,
      mode: 'scripted',
      health: { ok: true, agent: 'scripted', transport: 'server' },
    };
  }
  if (!baseUrl || !apiKey || !name) {
    const missing = [
      !baseUrl ? 'ICE_AGENT_MODEL_BASE_URL' : '',
      !apiKey ? 'ICE_AGENT_MODEL_API_KEY' : '',
      !name ? 'ICE_AGENT_MODEL_NAME' : '',
    ].filter(Boolean);
    const error = `模型配置不完整：缺少 ${missing.join(', ')}`;
    return {
      port,
      paceMs,
      mode: 'invalid',
      error,
      health: { ok: false, agent: 'invalid', transport: 'server' },
    };
  }
  return {
    port,
    paceMs,
    mode: 'model',
    model: { baseUrl, apiKey, name },
    health: {
      ok: true,
      agent: 'model',
      transport: 'server',
      model: name,
      endpoint: endpointHost(baseUrl),
    },
  };
}

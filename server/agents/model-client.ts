import type { ICEModelConfig } from '../config.js';
import { SCENE_TOOL_DEFINITIONS } from './tool-schema.js';

export interface ModelMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export interface ModelToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: string;
}

export interface ModelResponse {
  readonly text?: string;
  readonly toolCalls?: readonly ModelToolCall[];
}

export interface ModelClient {
  complete(
    messages: readonly ModelMessage[],
    signal?: AbortSignal,
  ): Promise<ModelResponse>;
}

interface ProviderResponse {
  readonly choices?: readonly {
    readonly message?: {
      readonly content?: string | null;
      readonly tool_calls?: readonly {
        readonly id?: string;
        readonly function?: {
          readonly name?: string;
          readonly arguments?: string;
        };
      }[];
    };
  }[];
}

export function createModelClient(
  config: ICEModelConfig,
  fetcher: typeof fetch = globalThis.fetch,
): ModelClient {
  const endpoint = `${config.baseUrl.replace(/\/+$/u, '')}/chat/completions`;
  return {
    async complete(messages, signal) {
      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.name,
            messages,
            tools: SCENE_TOOL_DEFINITIONS,
            tool_choice: 'auto',
          }),
          signal,
        });
      } catch (error) {
        throw new Error(`模型服务连接失败：${(error as Error).message}`);
      }
      if (!response.ok) {
        throw new Error(`模型服务返回 HTTP ${response.status}`);
      }
      const payload = await response.json() as ProviderResponse;
      const message = payload.choices?.[0]?.message;
      return {
        ...(message?.content ? { text: message.content } : {}),
        ...(message?.tool_calls?.length
          ? {
              toolCalls: message.tool_calls.flatMap((call, index) => {
                const name = call.function?.name;
                const args = call.function?.arguments;
                if (!name || !args) return [];
                return [{
                  id: call.id ?? `provider-${index}`,
                  name,
                  arguments: args,
                }];
              }),
            }
          : {}),
      };
    },
  };
}

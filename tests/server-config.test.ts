import { expect } from '#test-expect';
import { test } from 'node:test';
import { loadServerConfig } from '../server/config.js';

test('uses scripted mode when model settings are absent', () => {
  expect(loadServerConfig({})).toMatchObject({
    port: 8099,
    mode: 'scripted',
    paceMs: 18,
  });
});

test('accepts complete model settings without returning the key as health data', () => {
  const config = loadServerConfig({
    ICE_AGENT_MODEL_BASE_URL: 'https://model.example/v1',
    ICE_AGENT_MODEL_API_KEY: 'secret-value',
    ICE_AGENT_MODEL_NAME: 'industrial-agent',
  });
  expect(config).toMatchObject({
    mode: 'model',
    model: {
      baseUrl: 'https://model.example/v1',
      apiKey: 'secret-value',
      name: 'industrial-agent',
    },
  });
  expect(JSON.stringify(config.health)).not.toContain('secret-value');
});

test('reports partial model configuration as invalid', () => {
  expect(loadServerConfig({
    ICE_AGENT_MODEL_NAME: 'industrial-agent',
  })).toMatchObject({
    mode: 'invalid',
    error: expect.stringContaining('ICE_AGENT_MODEL_BASE_URL'),
  });
});

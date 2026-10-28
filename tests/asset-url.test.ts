import { expect } from '#test-expect';
import { test } from 'node:test';
import { resolveWastewaterAssetUrl } from '../src/scene/asset-url.js';

test('resolves the synthetic asset relative to the deployed page', () => {
  expect(resolveWastewaterAssetUrl(
    'https://example.com/apps/agent-console/',
  )).toBe(
    'https://example.com/apps/agent-console/assets/wastewater-plant/tiled/tileset.json',
  );
});

test('preserves a query-free path from a nested page URL', () => {
  expect(resolveWastewaterAssetUrl(
    'https://example.com/apps/agent-console/index.html?demo=1',
  )).toBe(
    'https://example.com/apps/agent-console/assets/wastewater-plant/tiled/tileset.json',
  );
});

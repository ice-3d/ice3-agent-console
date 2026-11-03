import { expect } from '#test-expect';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('contains stable identities and finite bounds for every device', async () => {
  const manifest = JSON.parse(await readFile(
    'public/assets/wastewater-plant/equipment.json',
    'utf8',
  )) as {
    assetId: string;
    materialSlots: Array<{ id: string }>;
    bindings: Array<{
      selectionId: string;
      tag: string;
      slot: string;
      bounds: { min: number[]; max: number[] };
    }>;
  };
  const slotIds = new Set(manifest.materialSlots.map((slot) => slot.id));
  expect(manifest.assetId).toBe('ice3-virtual-wwtp');
  expect(manifest.bindings.length).toBeGreaterThanOrEqual(200);
  expect(new Set(manifest.bindings.map((item) => item.selectionId)).size)
    .toBe(manifest.bindings.length);
  for (const item of manifest.bindings) {
    expect(item.selectionId).toContain(`/equipment/${item.tag}`);
    expect(slotIds.has(item.slot)).toBe(true);
    expect([...item.bounds.min, ...item.bounds.max].every(Number.isFinite))
      .toBe(true);
  }
});

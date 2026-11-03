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
  const tiled = JSON.parse(await readFile(
    'public/assets/wastewater-plant/tiled/bindings.json',
    'utf8',
  )) as {
    bindings: Array<{
      selectionId: string;
      equipmentTag?: string;
      bounds: { min: number[]; max: number[] };
    }>;
  };
  const tiledByTag = new Map(
    tiled.bindings
      .filter((item) => item.equipmentTag)
      .map((item) => [item.equipmentTag!, item]),
  );
  const slotIds = new Set(manifest.materialSlots.map((slot) => slot.id));
  expect(manifest.assetId).toBe('ice3-virtual-wwtp');
  expect(new Set(manifest.bindings.map((item) => item.tag)))
    .toEqual(new Set(tiledByTag.keys()));
  expect(manifest.bindings.length).toBe(tiledByTag.size);
  expect(new Set(manifest.bindings.map((item) => item.selectionId)).size)
    .toBe(manifest.bindings.length);
  for (const item of manifest.bindings) {
    const tiledBinding = tiledByTag.get(item.tag);
    expect(tiledBinding).toBeDefined();
    expect(item.selectionId).toBe(tiledBinding!.selectionId);
    expect(item.selectionId).toContain(`/equipment/${item.tag}`);
    expect(slotIds.has(item.slot)).toBe(true);
    expect([...item.bounds.min, ...item.bounds.max].every(Number.isFinite))
      .toBe(true);
    expect(item.bounds.min).toEqual(tiledBinding!.bounds.min);
    expect(item.bounds.max).toEqual(tiledBinding!.bounds.max);
  }
});

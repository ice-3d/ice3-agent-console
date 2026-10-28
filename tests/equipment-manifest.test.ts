import { expect } from '#test-expect';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('contains stable identities and finite bounds for every device', async () => {
  const manifest = JSON.parse(await readFile(
    'public/assets/wastewater-plant/equipment.json',
    'utf8',
  )) as {
    equipment: Array<{
      selectionId: string;
      tag: string;
      bounds: { min: number[]; max: number[] };
    }>;
  };
  expect(manifest.equipment).toHaveLength(65);
  expect(new Set(manifest.equipment.map((item) => item.selectionId)).size)
    .toBe(65);
  for (const item of manifest.equipment) {
    expect(item.selectionId).toContain(`/equipment/${item.tag}`);
    expect([...item.bounds.min, ...item.bounds.max].every(Number.isFinite))
      .toBe(true);
  }
});

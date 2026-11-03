import { expect } from '#test-expect';
import { spawnSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL(
  '../scripts/generate-equipment-manifest.mjs',
  import.meta.url,
));

test('derives the equipment manifest from the exported Tileset bindings', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ice3-manifest-generate-'));
  const bindings = join(
    root,
    'public',
    'assets',
    'wastewater-plant',
    'tiled',
    'bindings.json',
  );
  const manifest = join(
    root,
    'public',
    'assets',
    'wastewater-plant',
    'equipment.json',
  );
  const contents = `${JSON.stringify({
    assetId: 'ice3-virtual-wwtp',
    bindings: [{
      selectionId: 'ice3-virtual-wwtp/equipment/PS-101-P',
      displayName: 'PS-101 提升泵组/lps-cable-drops',
      equipmentTag: 'PS-101-P',
      area: 'Intake',
      nodeSelectionIds: ['node-000122/lps-cable-drops'],
      bounds: {
        min: [54, 0, 6],
        max: [70, 2.69, 14.13],
      },
    }],
  }, null, 2)}\n`;
  try {
    await mkdir(join(root, 'public', 'assets', 'wastewater-plant', 'tiled'), {
      recursive: true,
    });
    await writeFile(bindings, contents);

    const result = spawnSync(process.execPath, [script], {
      cwd: root,
      env: {
        ...process.env,
      },
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    const generated = JSON.parse(await readFile(manifest, 'utf8'));
    expect(generated.assetId).toBe('ice3-virtual-wwtp');
    expect(generated.bindings).toEqual([{
      selectionId: 'ice3-virtual-wwtp/equipment/PS-101-P',
      tag: 'PS-101-P',
      name: '提升泵组',
      stage: 'intake',
      area: 'Intake',
      connections: [],
      bounds: {
        min: [54, 0, 6],
        max: [70, 2.69, 14.13],
      },
      slot: 'pump-unit',
    }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

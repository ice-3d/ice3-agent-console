import { expect } from '#test-expect';
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { copyDemoAssets } from '../scripts/copy-demo-assets.mjs';

test('publishes runtime assets as one complete directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ice3-agent-assets-'));
  const source = join(root, 'source');
  const manifest = join(root, 'equipment.json');
  const destination = join(root, 'dist', 'wastewater-plant');
  try {
    await mkdir(join(source, 'parts'), { recursive: true });
    await writeFile(join(source, 'tileset.json'), '{"asset":"new"}');
    await writeFile(join(source, 'parts', 'part-000.glb'), 'part');
    await writeFile(manifest, '{"equipment":[]}');
    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, 'stale.txt'), 'stale');

    await copyDemoAssets({ source, manifest, destination });

    expect(await readFile(join(destination, 'tiled', 'tileset.json'), 'utf8'))
      .toBe('{"asset":"new"}');
    expect(await readFile(join(destination, 'equipment.json'), 'utf8'))
      .toBe('{"equipment":[]}');
    await expect(readFile(join(destination, 'stale.txt'))).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

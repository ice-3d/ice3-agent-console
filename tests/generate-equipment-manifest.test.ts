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

test('reuses a checked-in manifest when the source GLB is unavailable', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ice3-manifest-reuse-'));
  const manifest = join(
    root,
    'public',
    'assets',
    'wastewater-plant',
    'equipment.json',
  );
  const source = join(root, 'missing-source.glb');
  const contents = `${JSON.stringify({
    assetId: 'ice3-virtual-wwtp',
    equipment: [],
  }, null, 2)}\n`;
  try {
    await mkdir(join(root, 'public', 'assets', 'wastewater-plant'), {
      recursive: true,
    });
    await writeFile(manifest, contents);

    const result = spawnSync(process.execPath, [script], {
      cwd: root,
      env: {
        ...process.env,
        ICE3_EQUIPMENT_MANIFEST_REUSE: '1',
        ICE3_WWTP_SOURCE: source,
      },
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(await readFile(manifest, 'utf8')).toBe(contents);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

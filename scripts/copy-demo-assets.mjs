import {
  cp,
  mkdir,
  rename,
  rm,
} from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function copyDemoAssets(options = {}) {
  const source = resolve(
    options.source
      ?? '../ice3-engine/examples/m1/assets/wastewater-plant/tiled',
  );
  const manifest = resolve(
    options.manifest
      ?? 'public/assets/wastewater-plant/equipment.json',
  );
  const destination = resolve(
    options.destination
      ?? 'dist/assets/wastewater-plant',
  );
  const parent = dirname(destination);
  const name = basename(destination);
  const staging = resolve(parent, `.${name}.staging-${process.pid}`);
  const backup = resolve(parent, `.${name}.backup-${process.pid}`);

  await rm(staging, { recursive: true, force: true });
  await rm(backup, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  let previousMoved = false;
  try {
    await cp(source, resolve(staging, 'tiled'), { recursive: true });
    await cp(manifest, resolve(staging, 'equipment.json'));
    try {
      await rename(destination, backup);
      previousMoved = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await mkdir(parent, { recursive: true });
    await rename(staging, destination);
    if (previousMoved) await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (previousMoved) {
      await rm(destination, { recursive: true, force: true });
      await rename(backup, destination);
    }
    throw error;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

const directEntry = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;
if (directEntry) {
  await copyDemoAssets();
}

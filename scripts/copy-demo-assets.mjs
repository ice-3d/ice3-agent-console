import {
  cp,
  mkdir,
  rename,
  rm,
} from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const source = resolve(
  '../ice3-engine/examples/m1/assets/wastewater-plant/tiled',
);
const destination = resolve(
  'dist/assets/wastewater-plant/tiled',
);
const staging = resolve(
  `dist/assets/.wastewater-plant-staging-${process.pid}`,
);

await rm(staging, { recursive: true, force: true });
await mkdir(dirname(staging), { recursive: true });
try {
  await cp(source, staging, { recursive: true });
  await rm(destination, { recursive: true, force: true });
  await mkdir(dirname(destination), { recursive: true });
  await rename(staging, destination);
  await cp(
    resolve('public/assets/wastewater-plant/equipment.json'),
    resolve('dist/assets/wastewater-plant/equipment.json'),
  );
} catch (error) {
  await rm(staging, { recursive: true, force: true });
  throw error;
}

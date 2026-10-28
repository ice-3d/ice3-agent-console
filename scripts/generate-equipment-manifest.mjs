import { NodeIO } from '@gltf-transform/core';
import {
  mkdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const source = resolve(
  process.env.ICE3_WWTP_SOURCE
    ?? '../ice3-engine/examples/m1/assets/wastewater-plant/source/wastewater-plant.glb',
);
const output = resolve('public/assets/wastewater-plant/equipment.json');
const temporary = `${output}.tmp`;
const document = await new NodeIO().read(source);
const equipment = document.getRoot().listNodes().flatMap((node) => {
  const profile = node.getExtras().ice3;
  if (!profile?.equipmentTag) return [];
  const mesh = node.getMesh();
  if (!mesh) return [];
  const matrix = node.getWorldMatrix();
  const points = mesh.listPrimitives().flatMap((primitive) => {
    const accessor = primitive.getAttribute('POSITION');
    if (!accessor) return [];
    const minimum = accessor.getMin([]);
    const maximum = accessor.getMax([]);
    return [0, 1, 2, 3, 4, 5, 6, 7].map((corner) => {
      const x = corner & 1 ? maximum[0] : minimum[0];
      const y = corner & 2 ? maximum[1] : minimum[1];
      const z = corner & 4 ? maximum[2] : minimum[2];
      return [
        matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
        matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
        matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
      ];
    });
  });
  const min = [0, 1, 2].map((axis) => (
    Math.min(...points.map((point) => point[axis]))
  ));
  const max = [0, 1, 2].map((axis) => (
    Math.max(...points.map((point) => point[axis]))
  ));
  return [{
    selectionId: profile.selectionId,
    tag: profile.equipmentTag,
    name: profile.displayName ?? profile.equipmentTag,
    stage: profile.processStage ?? '',
    area: profile.area ?? '',
    connections: profile.connections ?? [],
    bounds: { min, max },
  }];
}).sort((left, right) => left.selectionId.localeCompare(right.selectionId, 'en'));

await mkdir(dirname(output), { recursive: true });
try {
  await writeFile(
    temporary,
    `${JSON.stringify({
      assetId: 'ice3-virtual-wwtp',
      equipment,
    }, null, 2)}\n`,
  );
  await rename(temporary, output);
} catch (error) {
  await rm(temporary, { force: true });
  throw error;
}

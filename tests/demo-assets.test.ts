import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { expect } from '#test-expect';
import { checkDemoAssets, DEMO_ASSET_ID } from '../scripts/sync-demo-assets.mjs';

/**
 * 这条测试守的是"资产与代码同步"这件事本身。
 *
 * 真实事故：仓库里提交的是贴图那一轮之前的导出，part GLB 连 images 都没有，
 * 材质只剩因子。构建和页面都正常，只是画面很平，没人会把它当失败——直到
 * 有人去翻 GLB 才发现。所以把它做成断言：资产必须带贴图、法线和 ORM。
 */
test('the committed demo asset is current and self-consistent', async () => {
  const { errors, stats } = await checkDemoAssets();

  expect(errors).toEqual([]);
  expect(stats.tiles).toBeGreaterThan(0);
  expect(stats.images).toBeGreaterThan(0);
  expect(stats.ormMaterials).toBeGreaterThan(0);
  expect(stats.normalMaterials).toBeGreaterThan(0);
});

test('the demo asset keeps its stable identity', async () => {
  expect(DEMO_ASSET_ID).toBe('ice3-virtual-wwtp');
});

/**
 * 反向用例：旧导出必须被拦下。
 *
 * 这里手工造一份"贴图那轮之前"的资产：GLB 里没有 images、材质只有因子。
 * 它是这次事故的最小复现，确保校验不是永远返回通过。
 */
test('flags an asset export that predates the texture pass', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ice3-demo-assets-'));
  try {
    const tiled = join(root, 'tiled');
    await mkdir(join(tiled, 'parts'), { recursive: true });
    await mkdir(join(tiled, 'coarse'), { recursive: true });

    const json = {
      asset: { version: '2.0' },
      materials: [
        { name: 'Reinforced concrete', pbrMetallicRoughness: { baseColorFactor: [0.5, 0.5, 0.5, 1] } },
      ],
    };
    await writeFile(join(tiled, 'parts', 'part-000.glb'), fakeGlb(json));
    await writeFile(
      join(tiled, 'tileset.json'),
      JSON.stringify({ asset: { extras: { ice3: { assetId: DEMO_ASSET_ID } } } }),
    );
    await writeFile(
      join(tiled, 'bindings.json'),
      JSON.stringify({ assetId: DEMO_ASSET_ID, bindings: [{}] }),
    );
    await writeFile(
      join(root, 'equipment.json'),
      JSON.stringify({ assetId: DEMO_ASSET_ID, bindings: [{}] }),
    );

    const { errors } = await checkDemoAssets({ assetRoot: root });
    expect(errors.some((message: string) => message.includes('ORM map'))).toBe(true);
    expect(errors.some((message: string) => message.includes('normal map'))).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

/** 最小 GLB：只有 JSON chunk，够校验逻辑读材质。 */
function fakeGlb(json: unknown): Buffer {
  const payload = Buffer.from(JSON.stringify(json), 'utf8');
  const padding = (4 - (payload.length % 4)) % 4;
  const chunk = Buffer.concat([payload, Buffer.alloc(padding, 0x20)]);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + chunk.length, 8);
  header.writeUInt32LE(chunk.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  return Buffer.concat([header, chunk]);
}

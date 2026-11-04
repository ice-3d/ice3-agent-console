#!/usr/bin/env node
//! 同步演示资产：从 Studio 工程重新导出 Tileset，写回 public/。
//!
//! 为什么在这个仓库：资产陈旧只伤这个应用，而 `equipment.json` 本来就是
//! 本仓库的 `generate-equipment-manifest.mjs` 从 `tiled/bindings.json` 生成的。
//! Studio 那边只负责导出，不该知道某个演示应用的目录长什么样。
//!
//! 用法：
//!   node scripts/sync-demo-assets.mjs            # 重新导出并写回
//!   node scripts/sync-demo-assets.mjs --check    # 只校验已提交的资产（CI / 单测用）
//!
//! Studio CLI 的定位顺序：`STUDIO_CLI_BIN` → 同级仓库的 release → debug 产物。

import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rename, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const assetRoot = join(repoRoot, 'public/assets/wastewater-plant');
const tiledRoot = join(assetRoot, 'tiled');

/** 演示 Asset 的固定身份。改了它，控制台的设备清单和剧本都会对不上。 */
export const DEMO_ASSET_ID = 'ice3-virtual-wwtp';

/** Studio 工程目录，可用 `--project` 覆盖。 */
export const DEFAULT_STUDIO_PROJECT = resolve(repoRoot, '../ice3-studio/projects/wastewater-plant');

function resolveStudioCli(explicit) {
  if (explicit) return explicit;
  if (process.env.STUDIO_CLI_BIN) return process.env.STUDIO_CLI_BIN;
  const sibling = resolve(repoRoot, '../ice3-studio/target');
  const exe = process.platform === 'win32' ? 'studio-cli.exe' : 'studio-cli';
  const candidates = [join(sibling, 'release', exe), join(sibling, 'debug', exe)]
    .filter((path) => existsSync(path));
  if (candidates.length === 0) return join(sibling, 'debug', exe);
  // 取"最近构建的那一个"：release 目录里常常躺着几个月前的老二进制，
  // 它的 schema 可能不认识新字段，导出一开就报 unknown field。
  return candidates
    .map((path) => ({ path, time: statSync(path).mtimeMs }))
    .sort((left, right) => right.time - left.time)[0].path;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

/**
 * 校验已提交的资产是否自洽，返回 `{ errors, stats }`。
 *
 * 三条规则对应三种真实事故：
 * 1. 资产身份漂移（导出时忘了 `--asset-id`）→ 设备清单与剧本全部失配；
 * 2. 贴图引用指向不存在的文件 → 运行时 404，画面退化成纯色；
 * 3. 整份资产没有 ORM/贴图（导出早于贴图那几轮）→ 材质只剩因子，
 *    画面"能跑但很平"，这类回归最容易被忽略，所以要显式查。
 */
export async function checkDemoAssets(options = {}) {
  const root = options.assetRoot ?? assetRoot;
  const tiled = join(root, 'tiled');
  const errors = [];
  const stats = { materials: 0, images: 0, ormMaterials: 0, normalMaterials: 0, tiles: 0 };

  const tileset = await readJson(join(tiled, 'tileset.json'));
  const bindings = await readJson(join(tiled, 'bindings.json'));
  const manifest = await readJson(join(root, 'equipment.json'));

  const tilesetAssetId = tileset?.asset?.extras?.ice3?.assetId;
  if (tilesetAssetId !== DEMO_ASSET_ID) {
    errors.push(`tileset assetId is ${tilesetAssetId ?? 'missing'}, expected ${DEMO_ASSET_ID}`);
  }
  if (bindings.assetId !== tilesetAssetId) {
    errors.push(`bindings assetId ${bindings.assetId} does not match tileset ${tilesetAssetId}`);
  }
  if (manifest.assetId !== tilesetAssetId) {
    errors.push(
      `equipment.json assetId ${manifest.assetId} is stale; run the equipment manifest generator`,
    );
  }
  if (manifest.bindings?.length !== bindings.bindings?.length) {
    errors.push(
      `equipment.json has ${manifest.bindings?.length} bindings, bindings.json has ${bindings.bindings?.length}`,
    );
  }

  for (const directory of ['parts', 'coarse']) {
    const dir = join(tiled, directory);
    let entries;
    try {
      entries = (await readdir(dir)).filter((name) => name.endsWith('.glb'));
    } catch {
      errors.push(`missing tile directory: ${directory}`);
      continue;
    }
    for (const name of entries) {
      stats.tiles += 1;
      const file = join(dir, name);
      const { json } = await readGlb(file);
      const images = json.images ?? [];
      stats.images += images.length;

      for (const material of json.materials ?? []) {
        stats.materials += 1;
        const pbr = material?.pbrMetallicRoughness ?? {};
        const slots = [
          ['baseColorTexture', pbr.baseColorTexture],
          ['metallicRoughnessTexture', pbr.metallicRoughnessTexture],
          ['occlusionTexture', material.occlusionTexture],
          ['normalTexture', material.normalTexture],
        ];
        for (const [slot, reference] of slots) {
          if (!reference) continue;
          const texture = json.textures?.[reference.index];
          const uri = texture ? images[texture.source]?.uri : undefined;
          if (!uri) {
            errors.push(`${directory}/${name}: ${slot} has no resolved image`);
            continue;
          }
          if (uri.includes('://') || uri.startsWith('/')) {
            errors.push(`${directory}/${name}: ${slot} uri must be relative, got ${uri}`);
            continue;
          }
          const present = await fileExists(join(dir, uri));
          if (!present) {
            errors.push(`${directory}/${name}: ${slot} points at missing file ${uri}`);
          }
        }
        if (pbr.metallicRoughnessTexture && material.occlusionTexture) {
          stats.ormMaterials += 1;
        }
        if (material.normalTexture) stats.normalMaterials += 1;
      }
    }
  }

  if (stats.ormMaterials === 0) {
    errors.push('no material carries an ORM map: the exported asset predates the packed maps');
  }
  if (stats.normalMaterials === 0) {
    errors.push('no material carries a normal map: the exported asset is older than the normal-map pass');
  }

  return { errors, stats };
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function readGlb(path) {
  return readFile(path).then((buffer) => {
    if (buffer.readUInt32LE(0) !== 0x46546c67) throw new Error(`${path} is not a GLB`);
    const jsonLength = buffer.readUInt32LE(12);
    return { json: JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8').trim()) };
  });
}

async function syncAssets({ studioCli, project, assetId }) {
  const staging = join(repoRoot, `.asset-staging-${process.pid}`);
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });

  const result = spawnSync(
    studioCli,
    ['export', 'tileset', '--project', project, '--output', staging, '--asset-id', assetId, '--force'],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    await rm(staging, { recursive: true, force: true });
    const output = `${result.stderr || ''}${result.stdout || ''}`;
    const hint = /unknown field|expected one of/i.test(output)
      ? '\n提示：CLI 可能是旧的（schema 落后于 studio-core）。先 cargo build -p studio-cli。'
      : '';
    throw new Error(`studio-cli export failed (${result.status})\n${output}${hint}`);
  }

  // 先摘掉旧的、再用 rename 换上新目录：中途失败时不会留下"一半新一半旧"的资产。
  const backup = join(repoRoot, '.asset-previous');
  await rm(backup, { recursive: true, force: true });
  await rename(tiledRoot, backup);
  await mkdir(tiledRoot, { recursive: true });
  for (const name of ['parts', 'coarse', 'tileset.json', 'export.json', 'bindings.json']) {
    await cp(join(staging, name), join(tiledRoot, name), { recursive: true });
  }
  await rm(staging, { recursive: true, force: true });
  await rm(backup, { recursive: true, force: true });

  const manifest = spawnSync('node', ['scripts/generate-equipment-manifest.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (manifest.status !== 0) {
    throw new Error(`equipment manifest generation failed\n${manifest.stderr || manifest.stdout}`);
  }
  return manifest.stdout.trim();
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const projectArg = args.indexOf('--project');
  const project = projectArg >= 0 ? resolve(args[projectArg + 1]) : DEFAULT_STUDIO_PROJECT;

  if (checkOnly) {
    const { errors, stats } = await checkDemoAssets();
    if (errors.length > 0) {
      console.error(`ICE3_DEMO_ASSETS_INVALID: ${errors.length} problem(s)`);
      for (const error of errors) console.error(`  - ${error}`);
      console.error('修复：node scripts/sync-demo-assets.mjs（需要 Studio CLI）');
      process.exitCode = 1;
      return;
    }
    console.log(
      `ICE3_DEMO_ASSETS_OK: ${stats.tiles} tiles, ${stats.images} images, `
      + `${stats.ormMaterials} ORM / ${stats.normalMaterials} normal materials`,
    );
    return;
  }

  const studioCli = resolveStudioCli();
  const printed = await syncAssets({ studioCli, project, assetId: DEMO_ASSET_ID });
  const { errors, stats } = await checkDemoAssets();
  if (errors.length > 0) {
    for (const error of errors) console.error(`  - ${error}`);
    console.error('ICE3_DEMO_ASSETS_INVALID: 导出完成但校验未通过');
    process.exitCode = 1;
    return;
  }
  console.log(printed);
  console.log(
    `ICE3_DEMO_ASSETS_SYNCED: ${stats.tiles} tiles, ${stats.images} images, `
    + `${stats.ormMaterials} ORM / ${stats.normalMaterials} normal materials`,
  );
  console.log('别忘了把 public/assets 的改动一起提交，否则线上仍是旧资产。');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

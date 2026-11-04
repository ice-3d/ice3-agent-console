/**
 * `sync-demo-assets.mjs` 的类型补充。
 *
 * 脚本本身用 ESM 直接跑（`node scripts/sync-demo-assets.mjs`），但单测要 import 它，
 * 而 TypeScript 读不了 `.mjs` 的实现去推断类型——没有这份声明，`npm run typecheck`
 * 会以 TS7016 失败。
 */
export declare const DEMO_ASSET_ID: string;
export declare const DEFAULT_STUDIO_PROJECT: string;

export type DemoAssetCheck = {
  readonly errors: readonly string[];
  readonly stats: {
    readonly materials: number;
    readonly images: number;
    readonly ormMaterials: number;
    readonly normalMaterials: number;
    readonly tiles: number;
  };
};

export declare function checkDemoAssets(options?: {
  readonly assetRoot?: string;
}): Promise<DemoAssetCheck>;

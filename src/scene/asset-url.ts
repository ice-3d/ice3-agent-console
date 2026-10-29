import { DEMO_ASSET } from '../../shared/demo-asset.js';

export function resolveDemoAssetUrl(
  baseUri: string,
  relativePath: string,
): string {
  return new URL(
    `${DEMO_ASSET.rootPath}/${relativePath}`,
    baseUri,
  ).toString();
}

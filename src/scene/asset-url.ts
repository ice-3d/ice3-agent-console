export function resolveWastewaterAssetUrl(baseUri: string): string {
  return new URL(
    'assets/wastewater-plant/tiled/tileset.json',
    baseUri,
  ).toString();
}

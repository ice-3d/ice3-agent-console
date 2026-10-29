export const DEMO_ASSET = Object.freeze({
  id: 'ice3-virtual-wwtp',
  label: '虚拟市政污水处理厂',
  rootPath: 'assets/wastewater-plant',
  manifestPath: 'equipment.json',
  tilesetPath: 'tiled/tileset.json',
});

export const DEMO_ASSET_ID = DEMO_ASSET.id;

export function demoEquipmentSelectionId(tag: string): string {
  return `${DEMO_ASSET_ID}/equipment/${tag}`;
}

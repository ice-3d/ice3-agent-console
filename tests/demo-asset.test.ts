import { expect } from '#test-expect';
import { test } from 'node:test';
import {
  DEMO_ASSET,
  DEMO_ASSET_ID,
  demoEquipmentSelectionId,
} from '../shared/demo-asset.js';

test('defines the synthetic wastewater demo identity once', () => {
  expect(DEMO_ASSET).toEqual({
    id: 'ice3-virtual-wwtp',
    label: '虚拟市政污水处理厂',
    rootPath: 'assets/wastewater-plant',
    manifestPath: 'equipment.json',
    tilesetPath: 'tiled/tileset.json',
  });
  expect(DEMO_ASSET_ID).toBe('ice3-virtual-wwtp');
  expect(demoEquipmentSelectionId('AE-101'))
    .toBe('ice3-virtual-wwtp/equipment/AE-101');
});

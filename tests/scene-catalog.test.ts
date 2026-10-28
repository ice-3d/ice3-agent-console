import { expect } from '#test-expect';
import { test } from 'node:test';
import { createEquipmentCatalog } from '../src/scene/catalog.js';

const catalog = createEquipmentCatalog([
  {
    selectionId: 'ice3-virtual-wwtp/equipment/AE-101',
    name: '好氧池 A',
    metadata: {
      equipmentTag: 'AE-101',
      processStage: 'biological',
      area: 'BiologicalTrainA',
    },
  },
  {
    selectionId: 'ice3-virtual-wwtp/equipment/SC-101',
    name: '二沉池 A',
    metadata: {
      equipmentTag: 'SC-101',
      processStage: 'secondary',
      area: 'SecondaryTreatmentArea',
    },
  },
]);

test('finds equipment by tag, Chinese name, stage, and area', () => {
  expect(catalog.find({ query: 'AE-101' })[0]?.name).toBe('好氧池 A');
  expect(catalog.find({ query: '二沉池' })[0]?.selectionId)
    .toContain('SC-101');
  expect(catalog.find({ stage: 'biological' })[0]?.tag).toBe('AE-101');
  expect(catalog.find({ area: 'SecondaryTreatmentArea' })[0]?.tag)
    .toBe('SC-101');
});

test('ranks exact tags ahead of partial text matches', () => {
  expect(catalog.find({ query: 'SC-101' })[0]?.tag).toBe('SC-101');
  expect(catalog.find({ query: '不存在' })).toEqual([]);
});

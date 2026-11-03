import {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const input = resolve('public/assets/wastewater-plant/tiled/bindings.json');
const output = resolve('public/assets/wastewater-plant/equipment.json');

const DISPLAY_EXPOSURE = 1.42;
const MATERIAL_SLOTS = Object.freeze([
  { id: 'tank-biological', color: '#8ea6b2', role: 'tank' },
  { id: 'tank-clarifier', color: '#9aa8b3', role: 'tank' },
  { id: 'tank-sludge', color: '#7c8a80', role: 'tank' },
  { id: 'pump-unit', color: '#6f7d86', role: 'equipment' },
  { id: 'blower-unit', color: '#76838c', role: 'equipment' },
  { id: 'valve-unit', color: '#8a8f93', role: 'equipment' },
  { id: 'process-unit', color: '#7f96a0', role: 'equipment' },
  { id: 'chemical-dosing', color: '#a89878', role: 'equipment' },
  { id: 'intake-unit', color: '#87949b', role: 'equipment' },
  { id: 'equipment-steel', color: '#8b949b', role: 'equipment' },
]);

function stageForTag(tag) {
  if (/^(GR|PS|GC|DD-001|GATE|GTE|CTRL)-/u.test(tag)) return 'intake';
  if (/^(PC|AE)-/u.test(tag)) return 'biological';
  if (/^(SC|RWS|FB|DD|SCW)-/u.test(tag)) return 'secondary';
  if (/^(CHEM|FL|UV|OUT)-/u.test(tag)) return 'advanced';
  if (/^(DG|TH|DW|CV|GH|GF|GCL|HEX)-/u.test(tag)) return 'sludge';
  if (/^BLW-/u.test(tag)) return 'aeration';
  if (/^EMG-/u.test(tag)) return 'incident';
  return 'process';
}

function slotForTag(tag, stage) {
  if (/^(AE|PC|SC|FB)-/u.test(tag)) {
    return stage === 'secondary' ? 'tank-clarifier' : 'tank-biological';
  }
  if (/^(DG|TH|EMG)-/u.test(tag)) return 'tank-sludge';
  if (/^(PS|P-|RWS)-/u.test(tag)) return 'pump-unit';
  if (/^BLW-/u.test(tag)) return 'blower-unit';
  if (/^CHEM-/u.test(tag)) return 'chemical-dosing';
  if (/^(GR|GC|DD|GATE|GTE)-/u.test(tag)) return 'intake-unit';
  if (/^(CV|DW|FL|UV|OUT|CTRL|GH|GF|GCL|HEX)-/u.test(tag)) {
    return 'process-unit';
  }
  return 'equipment-steel';
}

function displayNameForBinding(binding) {
  const firstPart = binding.displayName.split('/')[0].trim();
  const withoutTag = firstPart.replace(/^\S+\s+/u, '');
  return withoutTag || binding.equipmentTag;
}

function validateBounds(binding) {
  const { min, max } = binding.bounds ?? {};
  if (
    !Array.isArray(min)
    || !Array.isArray(max)
    || min.length !== 3
    || max.length !== 3
    || ![...min, ...max].every(Number.isFinite)
    || [0, 1, 2].some((axis) => min[axis] > max[axis])
  ) {
    throw new Error(
      `ICE3_EQUIPMENT_MANIFEST_INVALID: ${binding.selectionId} bounds are invalid`,
    );
  }
}

function convertBindings(manifest) {
  if (
    !manifest
    || typeof manifest !== 'object'
    || typeof manifest.assetId !== 'string'
    || !Array.isArray(manifest.bindings)
  ) {
    throw new Error(
      'ICE3_EQUIPMENT_MANIFEST_INVALID: Tileset bindings are invalid',
    );
  }
  const tagged = manifest.bindings.filter((binding) => (
    typeof binding.equipmentTag === 'string'
    && binding.equipmentTag.trim().length > 0
  ));
  const tags = new Set();
  const bindings = tagged.map((binding) => {
    const tag = binding.equipmentTag.trim();
    const expectedSelectionId = `${manifest.assetId}/equipment/${tag}`;
    if (
      tags.has(tag)
      || binding.selectionId !== expectedSelectionId
    ) {
      throw new Error(
        `ICE3_EQUIPMENT_MANIFEST_INVALID: duplicate or mismatched binding ${tag}`,
      );
    }
    tags.add(tag);
    validateBounds(binding);
    const stage = stageForTag(tag);
    return {
      selectionId: binding.selectionId,
      tag,
      name: displayNameForBinding({ ...binding, equipmentTag: tag }),
      stage,
      area: typeof binding.area === 'string' ? binding.area : stage,
      connections: [],
      bounds: {
        min: [...binding.bounds.min],
        max: [...binding.bounds.max],
      },
      slot: slotForTag(tag, stage),
    };
  }).sort((left, right) => left.selectionId.localeCompare(
    right.selectionId,
    'en',
  ));
  return {
    assetId: manifest.assetId,
    displayExposure: DISPLAY_EXPOSURE,
    materialSlots: MATERIAL_SLOTS,
    bindings,
  };
}

async function main() {
  const manifest = JSON.parse(await readFile(input, 'utf8'));
  const equipment = convertBindings(manifest);
  const temporary = `${output}.tmp`;
  await mkdir(dirname(output), { recursive: true });
  try {
    await writeFile(temporary, `${JSON.stringify(equipment, null, 2)}\n`);
    await rename(temporary, output);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  console.info(
    `ICE3_EQUIPMENT_MANIFEST_GENERATED: ${equipment.bindings.length} bindings`,
  );
}

await main();

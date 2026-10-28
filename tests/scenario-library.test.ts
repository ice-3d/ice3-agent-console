import { expect } from '#test-expect';
import { test } from 'node:test';
import { SCENE_TOOLS } from '../shared/contract.js';
import {
  QUICK_ACTION_GROUPS,
  SCRIPTED_SCENARIOS,
  matchScenario,
} from '../shared/scenarios.js';

test('publishes the confirmed quick-action groups and script order', () => {
  expect(QUICK_ACTION_GROUPS.map((group) => group.label)).toEqual([
    '工艺巡览',
    '系统专题',
    '快速操作',
  ]);
  expect(QUICK_ACTION_GROUPS.flatMap((group) => (
    group.actions.map((action) => action.label)
  ))).toEqual([
    '进水预处理',
    'AAO 生化段',
    '二沉池',
    '深度处理',
    '污泥处理',
    '曝气系统',
    '加药系统',
    '出水在线监测',
    '事故池与应急回流',
    '查看全厂',
    '清除聚焦',
  ]);
});

test('every static scenario uses approved tools and focuses equipment', () => {
  expect(SCRIPTED_SCENARIOS).toHaveLength(9);
  for (const scenario of SCRIPTED_SCENARIOS) {
    expect(scenario.steps.length).toBeGreaterThan(0);
    expect(scenario.steps.some((step) => (
      step.tool.name === 'focus_equipment'
    ))).toBe(true);
    for (const step of scenario.steps) {
      expect(SCENE_TOOLS).toContain(step.tool.name);
      expect(step.text.length).toBeGreaterThan(0);
    }
  }
});

test('matches the intended scenario without crossing topics', () => {
  expect(matchScenario('带我看看曝气系统')?.id).toBe('aeration');
  expect(matchScenario('查看加药系统')?.id).toBe('dosing');
  expect(matchScenario('分析出水在线监测')?.id).toBe('effluent');
  expect(matchScenario('说明事故池和应急回流')?.id).toBe('incident');
  expect(matchScenario('带我看污泥处理')?.id).toBe('sludge');
  expect(matchScenario('这个设备怎么运行')).toBeUndefined();
});

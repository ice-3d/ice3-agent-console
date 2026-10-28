import type { RunAgentInput } from '@ag-ui/core';
import type { TextStream } from './events.js';
import { emitAgentPlan } from './events.js';
import type { AgentRun } from './types.js';

const AE_101 = 'ice3-virtual-wwtp/equipment/AE-101';
const AT_101 = 'ice3-virtual-wwtp/equipment/AT-101';
const CO_101 = 'ice3-virtual-wwtp/equipment/CO-101';
const FL_101 = 'ice3-virtual-wwtp/equipment/FL-101';
const P_101 = 'ice3-virtual-wwtp/equipment/P-101';
const SC_101 = 'ice3-virtual-wwtp/equipment/SC-101';
const ST_101 = 'ice3-virtual-wwtp/equipment/ST-101';

function includesAny(text: string, words: readonly string[]): boolean {
  return words.some((word) => text.includes(word));
}

function selectedEquipment(input: RunAgentInput): string | undefined {
  const value = input.context?.find((entry) => (
    entry.description === 'selected equipment'
  ))?.value;
  return typeof value === 'string' ? value : undefined;
}

function presentationMode(input: RunAgentInput): string | undefined {
  const value = input.context?.find((entry) => (
    entry.description === 'presentation mode'
  ))?.value;
  return typeof value === 'string' ? value : undefined;
}

function messageText(input: RunAgentInput): string {
  const content = input.messages.at(-1)?.content;
  return typeof content === 'string' ? content : JSON.stringify(content ?? '');
}

const OPENING_TOUR: readonly TextStream[] = [
  {
    text: '先从全厂视角建立空间方位：左侧是预处理和生化区，右侧是深度处理与出水区，下方是污泥处理区。',
    tool: { name: 'set_camera_view', args: { view: 'overview' } },
    holdMs: 1_800,
  },
  {
    text: '镜头推进到进水端。进水依次经过粗格栅、提升泵和细格栅，先完成水量提升与大颗粒拦截。',
    tool: {
      name: 'focus_equipment',
      args: { selectionId: P_101 },
    },
    holdMs: 1_800,
  },
  {
    text: '随后进入厌氧池。这里主要进行释磷和有机物水解，为后续缺氧、好氧反应建立条件。',
    tool: {
      name: 'focus_equipment',
      args: { selectionId: AT_101 },
    },
    holdMs: 1_800,
  },
  {
    text: '好氧池通过曝气完成有机物降解和硝化反应，混合液再回流到缺氧段完成脱氮。',
    tool: {
      name: 'focus_equipment',
      args: { selectionId: AE_101 },
    },
    holdMs: 1_800,
  },
  {
    text: '二沉池负责泥水分离。上清液继续进入深度处理，沉淀污泥则分流至回流和剩余污泥系统。',
    tool: {
      name: 'focus_equipment',
      args: { selectionId: SC_101 },
    },
    holdMs: 1_800,
  },
  {
    text: '出水进入混凝沉淀池，通过投加药剂进一步去除悬浮物和磷，为后续过滤降低负荷。',
    tool: {
      name: 'focus_equipment',
      args: { selectionId: CO_101 },
    },
    holdMs: 1_800,
  },
  {
    text: '滤布滤池继续拦截细小悬浮物，反冲洗系统会定期恢复滤布通量。',
    tool: {
      name: 'focus_equipment',
      args: { selectionId: FL_101 },
    },
    holdMs: 1_800,
  },
  {
    text: '最后查看污泥区。浓缩、脱水和外运构成剩余污泥处理主线，上清液与滤液回流至前端。',
    tool: {
      name: 'focus_equipment',
      args: { selectionId: ST_101 },
    },
    holdMs: 1_800,
  },
  {
    text: '导览结束，镜头回到全厂。现在可以用鼠标旋转、缩放，或者选择任意设备继续查看。',
    tool: { name: 'clear_scene_focus', args: {} },
    holdMs: 600,
  },
];

export function scriptedPlan(input: RunAgentInput): readonly TextStream[] {
  const text = messageText(input);
  const selected = selectedEquipment(input);

  if (
    presentationMode(input) === 'guided-tour'
    && includesAny(text, ['整个污水', '污水处理厂'])
  ) {
    return OPENING_TOUR;
  }
  if (includesAny(text, ['清除', '复位', '回到全厂'])) {
    return [{
      text: '好的，已清除设备聚焦并返回全厂视角。',
      tool: { name: 'clear_scene_focus', args: {} },
    }];
  }
  if (includesAny(text, ['这个设备', '这台', '当前设备'])) {
    if (!selected) {
      return [{ text: '请先在三维场景中选择一台设备。' }];
    }
    return [
      {
        text: '正在定位当前设备。',
        tool: { name: 'focus_equipment', args: { selectionId: selected } },
      },
      {
        text: '已高亮设备，右侧信息卡中可以查看位号和流程关系。',
        tool: { name: 'highlight_equipment', args: { selectionIds: [selected] } },
      },
    ];
  }
  if (text.includes('二沉池')) {
    return [{
      text: '正在定位二沉池 A。',
      tool: { name: 'focus_equipment', args: { selectionId: SC_101 } },
    }];
  }
  if (text.includes('好氧池')) {
    return [{
      text: '正在拉近到好氧池 A。',
      tool: { name: 'focus_equipment', args: { selectionId: AE_101 } },
    }];
  }
  if (includesAny(text, ['全厂', '全景', '整个厂', '整个污水', '污水处理厂'])) {
    return [
      { text: '正在把视角切换为污水厂全景。' },
      {
        text: '可以继续选择池体或设备，或者询问当前设备的流程与连接。',
        tool: { name: 'set_camera_view', args: { view: 'overview' } },
      },
    ];
  }
  return [{
    text: '你可以让我查看全厂、定位二沉池或好氧池，也可以先选择一台设备再让我讲解。',
  }];
}

export function createScriptedAgent(
  options: { readonly delayMs?: number } = {},
): AgentRun {
  const delayMs = options.delayMs ?? 18;
  return {
    run(input, signal) {
      return emitAgentPlan({
        threadId: input.threadId,
        runId: input.runId,
        plan: scriptedPlan(input),
        delayMs,
        signal,
      });
    },
  };
}

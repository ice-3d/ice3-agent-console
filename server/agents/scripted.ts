import type { RunAgentInput } from '@ag-ui/core';
import type { TextStream } from './events.js';
import { emitAgentPlan } from './events.js';
import type { AgentRun } from './types.js';

const AE_101 = 'ice3-virtual-wwtp/equipment/AE-101';
const SC_101 = 'ice3-virtual-wwtp/equipment/SC-101';

function includesAny(text: string, words: readonly string[]): boolean {
  return words.some((word) => text.includes(word));
}

function selectedEquipment(input: RunAgentInput): string | undefined {
  const value = input.context?.find((entry) => (
    entry.description === 'selected equipment'
  ))?.value;
  return typeof value === 'string' ? value : undefined;
}

function messageText(input: RunAgentInput): string {
  const content = input.messages.at(-1)?.content;
  return typeof content === 'string' ? content : JSON.stringify(content ?? '');
}

export function scriptedPlan(input: RunAgentInput): readonly TextStream[] {
  const text = messageText(input);
  const selected = selectedEquipment(input);

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

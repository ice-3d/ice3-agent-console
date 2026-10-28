import type { SceneToolName } from './contract.js';

export interface ScenarioStep {
  readonly text: string;
  readonly tool: {
    readonly name: SceneToolName;
    readonly args: Readonly<Record<string, unknown>>;
  };
  readonly holdMs?: number;
}

export interface ScriptedScenario {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
  readonly keywords: readonly string[];
  readonly steps: readonly ScenarioStep[];
}

export interface QuickAction {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
}

export interface QuickActionGroup {
  readonly label: string;
  readonly actions: readonly QuickAction[];
}

const equipment = (tag: string): string => (
  `ice3-virtual-wwtp/equipment/${tag}`
);

const focus = (tag: string): ScenarioStep['tool'] => ({
  name: 'focus_equipment',
  args: { selectionId: equipment(tag) },
});

const steps = (
  entries: readonly {
    readonly text: string;
    readonly tag: string;
  }[],
): readonly ScenarioStep[] => entries.map((entry) => ({
  text: entry.text,
  tool: focus(entry.tag),
  holdMs: 1_500,
}));

const PROCESS_SCENARIOS: readonly ScriptedScenario[] = Object.freeze([
  {
    id: 'intake',
    label: '进水预处理',
    prompt: '带我看进水预处理',
    keywords: ['进水预处理', '预处理区', '格栅', '沉砂池', '砂水分离'],
    steps: steps([
      {
        text: '先看进水预处理。粗格栅拦截大颗粒杂物，保护后续提升泵和管线。',
        tag: 'GR-101',
      },
      {
        text: '进水泵把污水提升到后续处理构筑物，A、B 两台泵可以互为备用。',
        tag: 'P-101',
      },
      {
        text: '曝气沉砂池利用曝气和沉降去除砂粒，避免磨损后续设备。',
        tag: 'GC-101',
      },
      {
        text: '砂水分离器把沉砂与污水分离，预处理后的水进入初沉池。',
        tag: 'GW-101',
      },
    ]),
  },
  {
    id: 'biological',
    label: 'AAO 生化段',
    prompt: '带我看AAO生化段',
    keywords: ['AAO', '生化段', '生化池', '厌氧池', '缺氧池', '好氧池'],
    steps: steps([
      {
        text: '厌氧池首先释放磷并水解部分有机物，为后续生物反应准备条件。',
        tag: 'AT-101',
      },
      {
        text: '缺氧池利用内回流带来的硝态氮进行反硝化，完成脱氮。',
        tag: 'AX-101',
      },
      {
        text: '好氧池通过曝气完成有机物降解和硝化，是生化系统的核心反应区。',
        tag: 'AE-101',
      },
      {
        text: '回流污泥泵把二沉池污泥送回生化系统，维持反应池中的活性污泥浓度。',
        tag: 'P-RAS-101',
      },
    ]),
  },
  {
    id: 'secondary',
    label: '二沉池',
    prompt: '带我看二沉池',
    keywords: ['二沉池', '泥水分离', '回流污泥泵', '剩余污泥泵'],
    steps: steps([
      {
        text: '二沉池让活性污泥沉降，上清液进入深度处理，底部污泥持续回流或排出。',
        tag: 'SC-101',
      },
      {
        text: '中间提升泵负责克服后续深度处理构筑物的高程差。',
        tag: 'P-LIFT-111',
      },
      {
        text: '回流污泥泵维持生化池污泥浓度，是活性污泥系统稳定运行的关键。',
        tag: 'P-RAS-101',
      },
      {
        text: '剩余污泥泵排出系统增殖的污泥，控制泥龄并维持处理效果。',
        tag: 'P-WAS-301',
      },
    ]),
  },
  {
    id: 'advanced',
    label: '深度处理',
    prompt: '带我看深度处理',
    keywords: ['深度处理', '混凝沉淀', '滤布滤池', '臭氧', '活性炭', '消毒'],
    steps: steps([
      {
        text: '混凝沉淀池通过加药和沉淀进一步去除悬浮物与磷。',
        tag: 'CO-101',
      },
      {
        text: '滤布滤池拦截细小悬浮物，反冲洗系统定期恢复过滤能力。',
        tag: 'FL-101',
      },
      {
        text: '臭氧接触池用于氧化难降解有机物并辅助消毒。',
        tag: 'OZ-101',
      },
      {
        text: '紫外消毒渠道完成出水前最后一道微生物控制。',
        tag: 'UV-101',
      },
    ]),
  },
  {
    id: 'sludge',
    label: '污泥处理',
    prompt: '带我看污泥处理',
    keywords: [
      '污泥处理',
      '污泥浓缩',
      '污泥脱水',
      '污泥干化',
      '厌氧消化',
      '污泥料仓',
    ],
    steps: steps([
      {
        text: '厌氧消化池稳定剩余污泥并产生沼气，是污泥减量和资源化的关键环节。',
        tag: 'DIG-101',
      },
      {
        text: '污泥脱水机通过机械脱水降低含水率，减少后续运输体积。',
        tag: 'DWG-101',
      },
      {
        text: '污泥干化机进一步降低含水率，为储存和外运创造条件。',
        tag: 'DRY-101',
      },
      {
        text: '处理后的污泥进入料仓暂存，再由输送系统装车外运。',
        tag: 'SILO-101',
      },
    ]),
  },
]);

const SYSTEM_SCENARIOS: readonly ScriptedScenario[] = Object.freeze([
  {
    id: 'aeration',
    label: '曝气系统',
    prompt: '查看曝气系统',
    keywords: ['曝气系统', '鼓风机', '曝气支管', '供气系统'],
    steps: steps([
      {
        text: '鼓风机 A 提供好氧池所需空气，出口压力和流量决定供气能力。',
        tag: 'BLW-101',
      },
      {
        text: '空气进入好氧池曝气支管，为微生物提供溶解氧。',
        tag: 'AE-101',
      },
      {
        text: '内回流设备连接好氧区与缺氧区，把硝态氮带回反硝化区域。',
        tag: 'P-RAS-101',
      },
    ]),
  },
  {
    id: 'dosing',
    label: '加药系统',
    prompt: '查看加药系统',
    keywords: ['加药系统', 'PAC', 'PAM', '次氯酸钠', '碳源'],
    steps: steps([
      {
        text: 'PAC 加药装置用于混凝反应，帮助细小悬浮物形成可沉降絮体。',
        tag: 'PAC-101',
      },
      {
        text: 'PAM 加药装置改善污泥絮体结构，常用于污泥脱水调理。',
        tag: 'PAM-101',
      },
      {
        text: '次氯酸钠系统用于消毒和部分化学氧化，计量泵负责精确投加。',
        tag: 'NACLO-101',
      },
      {
        text: '碳源储罐为反硝化提供补充碳源，在进水碳氮比不足时使用。',
        tag: 'CARBON-101',
      },
    ]),
  },
  {
    id: 'effluent',
    label: '出水在线监测',
    prompt: '查看出水在线监测',
    keywords: ['出水在线监测', '水质监测', 'COD', '氨氮', '总磷', '总氮', '浊度', '排放口'],
    steps: steps([
      {
        text: '出水 COD 在线仪监测有机污染指标，帮助判断深度处理效果。',
        tag: 'AIT-COD-101',
      },
      {
        text: '出水氨氮在线仪监测硝化效果，是生化系统运行状态的重要反馈。',
        tag: 'AIT-NH3-101',
      },
      {
        text: '出水流量计累计排放水量，在线仪表数据需要与流量同步分析。',
        tag: 'FIT-101',
      },
      {
        text: '最终排放口汇集在线监测结果，是厂区对外排放的边界。',
        tag: 'OUT-101',
      },
    ]),
  },
  {
    id: 'incident',
    label: '事故池与应急回流',
    prompt: '查看事故池和应急回流',
    keywords: ['事故池', '应急回流', '事故水', '异常进水'],
    steps: steps([
      {
        text: '事故池用于暂时接纳异常进水，避免高负荷冲击生化系统。',
        tag: 'EQ-101',
      },
      {
        text: '事故水回流泵把储存在事故池中的水按可控流量送回处理主线。',
        tag: 'P-EQ-101',
      },
      {
        text: '回流期间持续关注出水浊度，确认异常水没有影响最终水质。',
        tag: 'AIT-TU-101',
      },
    ]),
  },
]);

export const SCRIPTED_SCENARIOS: readonly ScriptedScenario[] = Object.freeze([
  ...PROCESS_SCENARIOS,
  ...SYSTEM_SCENARIOS,
]);

const toAction = (scenario: ScriptedScenario): QuickAction => Object.freeze({
  id: scenario.id,
  label: scenario.label,
  prompt: scenario.prompt,
});

export const QUICK_ACTION_GROUPS: readonly QuickActionGroup[] = Object.freeze([
  Object.freeze({
    label: '工艺巡览',
    actions: Object.freeze(PROCESS_SCENARIOS.map(toAction)),
  }),
  Object.freeze({
    label: '系统专题',
    actions: Object.freeze(SYSTEM_SCENARIOS.map(toAction)),
  }),
  Object.freeze({
    label: '快速操作',
    actions: Object.freeze([
      Object.freeze({
        id: 'overview',
        label: '查看全厂',
        prompt: '带我看一下整个污水处理厂',
      }),
      Object.freeze({
        id: 'clear',
        label: '清除聚焦',
        prompt: '清除当前聚焦并回到全厂',
      }),
    ]),
  }),
]);

const normalize = (text: string): string => (
  text.toLocaleLowerCase('zh-CN').replaceAll(/\s+/gu, '')
);

export function matchScenario(text: string): ScriptedScenario | undefined {
  const normalized = normalize(text);
  return SCRIPTED_SCENARIOS.find((scenario) => (
    normalized.includes(normalize(scenario.prompt))
  )) ?? SCRIPTED_SCENARIOS.find((scenario) => (
    scenario.keywords.some((keyword) => (
      normalized.includes(normalize(keyword))
    ))
  ));
}

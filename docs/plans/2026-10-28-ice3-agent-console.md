# ICE3 Agent Console 实施计划

> Document ID: ICE3-AGENT-PLAN-001
>
> Status: Implemented
>
> Owner: ICE3 Agent Console maintainers
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 构建一个可运行的 3D 工业 Agent Console，将虚构污水处理厂、持续挂载的
Scene、浮动对话面板、确定性 Scene Tool、可选 Real-Model Server 和自包含 static demo
组合在一起。

**架构：** 应用是独立的 TypeScript package。Browser Scene adapter 只包装公开 `ice3`
API；protocol code 将 AG-UI event reducer 为 chat 和 tool state；Scene executor 执行
已校验 command；server 或 browser-local Agent transport 发送同一 event stream。

**技术栈：** Node.js 24.22.1 LTS、TypeScript 7、webpack 5、`@ag-ui/core` 1.0.3、
native Node test、Playwright 1.64 和同级 `ice3` package。

**规格：** [`ICE3-AGENT-SPEC-001`](../specs/2026-10-28-ice3-agent-console-design.md)

## 全局约束

- 不引入仓库命名和技术约束禁止的开发工具。
- Source、test、documentation、Diagnostic 或 commit message 中不得使用竞品、厂商或未批准商业产品名称。
- 3D Scene 保持 full-viewport，conversation panel 浮动在其上。
- 默认 demo 必须无需 model credential。
- 已配置 model 失败时必须发送 error，不得静默使用 scripted response。
- Agent code 不得导入 `ice3` Renderer internals 或操作 GPU resource。
- Browser code 只能使用 `ice3` 的公开 export。
- 永不引用或复制真实客户模型 Asset。
- Static output 只包含虚构 `tiled/` Asset tree，不包含 source 或 prepared GLB。
- Static output 中的 Asset URL 使用相对路径，并可在 repository subpath 下工作。
- Normal build 默认 server transport；demo build 默认 local transport。
- Normal build 默认关闭 autoplay；demo build 可以默认开启。
- 用户 pointer 或 keyboard camera input 取消 Agent-driven camera motion。
- 每项行为变化先写失败测试，最终以相关完整测试 suite 全绿结束。

## 审查重点

- Model configuration 无效或缺失：Server 必须明确识别失败，不得回退到 scripted output。
- Equipment ID stale 或未知：Scene executor 必须拒绝 command，不得清除或移动当前 Scene。
- 用户中断：Pointer 或 keyboard camera input 必须停止排队的 Agent camera motion，不得与用户操作冲突。
- Subpath 下的 static hosting：所有 Tileset、chunk、coarse Node、script 和 stylesheet 必须通过相对 URL 解析。
- Server mode 的 backend 不可用：页面必须显示可恢复 connection error，并保留已加载 Scene。

---

### Task 1：搭建应用与 mode switch

**文件：**

- 新建：`package.json`
- 新建：`tsconfig.json`
- 新建：`tsconfig.server.json`
- 新建：`webpack.config.cjs`
- 新建：`public/index.html`
- 新建：`public/styles.css`
- 新建：`src/entries/boot.ts`
- 新建：`src/app/mode.ts`
- 新建：`scripts/dev.mjs`
- 新建：`scripts/run-tests.mjs`
- 新建：`tests/mode.test.ts`
- 新建：`.gitignore`
- 新建：`AGENTS.md`
- 新建：`README.md`

**接口：**

- 消费：无前置 Task。
- 产出：`resolveDemoMode(search: string, demoDefault: boolean): boolean`
- 产出：`resolveAutoplay(search: string, autoplayDefault: boolean): boolean`
- 产出：`npm run dev`、`npm run build`、`npm run build:demo` 和 `npm test`。

- [ ] **步骤 1：编写失败的 mode test**

```ts
// tests/mode.test.ts
import { expect } from '#test-expect';
import { test } from 'node:test';
import {
  resolveAutoplay,
  resolveDemoMode,
} from '../src/app/mode.js';

test('selects the build default for missing and invalid values', () => {
  expect(resolveDemoMode('', false)).toBe(false);
  expect(resolveDemoMode('?demo=invalid', true)).toBe(true);
  expect(resolveAutoplay('', true)).toBe(true);
  expect(resolveAutoplay('?autoplay=invalid', false)).toBe(false);
});

test('accepts explicit boolean values', () => {
  expect(resolveDemoMode('?demo=1', false)).toBe(true);
  expect(resolveDemoMode('?demo=true', false)).toBe(true);
  expect(resolveDemoMode('?demo=0', true)).toBe(false);
  expect(resolveDemoMode('?demo=false', true)).toBe(false);
  expect(resolveAutoplay('?autoplay=1', false)).toBe(true);
  expect(resolveAutoplay('?autoplay=0', true)).toBe(false);
});
```

- [ ] **步骤 2：添加 package 和 configuration**

`package.json` 使用以下准确 dependency group：

```json
{
  "name": "ice3-agent-console",
  "private": true,
  "type": "module",
  "engines": {
    "node": "^24.0.0 || >=26.0.0",
    "npm": ">=11"
  },
  "scripts": {
    "predev": "npm --prefix ../ice3-engine run build",
    "dev": "node scripts/dev.mjs",
    "dev:web": "webpack serve --mode development",
    "dev:api": "tsx watch server/index.ts",
    "prebuild": "npm --prefix ../ice3-engine run build",
    "build": "webpack --mode production",
    "prebuild:demo": "npm --prefix ../ice3-engine run build",
    "build:demo": "webpack --mode production --env demo",
    "typecheck": "tsc -b --pretty false",
    "test": "node scripts/run-tests.mjs",
    "test:e2e": "playwright test",
    "verify": "npm run typecheck && npm test && npm run build"
  },
  "dependencies": {
    "@ag-ui/core": "1.0.3",
    "@ice3/assets": "file:../ice3-engine/packages/assets",
    "@ice3/core": "file:../ice3-engine/packages/core",
    "@ice3/renderer": "file:../ice3-engine/packages/renderer",
    "@ice3/runtime": "file:../ice3-engine/packages/runtime",
    "ice3": "file:../ice3-engine/packages/ice3",
    "markdown-it": "15.0.3"
  },
  "devDependencies": {
    "@playwright/test": "1.64.1",
    "@types/jsdom": "30.0.0",
    "@types/markdown-it": "14.2.0",
    "@types/node": "24.19.2",
    "esbuild": "0.25.10",
    "esbuild-loader": "4.5.0",
    "html-webpack-plugin": "5.6.8",
    "jsdom": "30.1.3",
    "tsx": "4.23.15",
    "typescript": "7.0.2",
    "webpack": "5.112.2",
    "webpack-cli": "7.2.3",
    "webpack-dev-server": "6.1.0"
  }
}
```

在 `imports` 中添加 `#test-expect`，指向 `./tests/assertions.ts`。该文件通过重新导出
同级项目使用的 Engine check helper 创建。

Webpack 必须：

- 将 `src/entries/boot.ts` bundle 为 `dist/boot.[contenthash].js`。
- 从 `public/index.html` 生成 `dist/index.html`。
- 使用 `output.publicPath: 'auto'`。
- 开发模式下在 `/assets` 提供同级虚构 Asset 目录。
- 将 `__ICE_DEMO__` 定义为 `Boolean(env.demo)`。

- [ ] **步骤 3：运行测试验证 RED**

Run: `npm test -- tests/mode.test.ts`

预期：因为 `src/app/mode.ts` 不存在而失败。

- [ ] **步骤 4：实现 mode function**

```ts
// src/app/mode.ts
export function resolveDemoMode(search: string, demoDefault: boolean): boolean {
  const value = new URLSearchParams(search).get('demo');
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return demoDefault;
}

export function resolveAutoplay(
  search: string,
  autoplayDefault: boolean,
): boolean {
  const value = new URLSearchParams(search).get('autoplay');
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return autoplayDefault;
}
```

`src/entries/boot.ts` 初始挂载可访问页面壳，包含 Scene stage、conversation panel、
connection state 和 loading state。

- [ ] **步骤 5：运行 mode test 和 build**

Run:

```bash
npm test -- tests/mode.test.ts
npm run typecheck
npm run build
```

预期：Mode test 通过，typecheck exit 0，并生成 `dist/index.html` 和一个带 hash 的
script。

- [ ] **步骤 6：提交**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.server.json webpack.config.cjs public src/entries/boot.ts src/app/mode.ts scripts tests/mode.test.ts tests/assertions.ts .gitignore AGENTS.md README.md
git commit -m "feat: bootstrap agent console"
```

---

### Task 2：定义共享 Protocol 和 Scene command contract

**文件：**

- Create: `shared/contract.ts`
- Create: `shared/scene.ts`
- Create: `src/protocol/types.ts`
- Test: `tests/contract.test.ts`

**接口：**

- 消费：不依赖之前 UI code 的 Runtime。
- 产出：Tool name `find_equipment`、`select_equipment`、`focus_equipment`、
  `highlight_equipment`、`set_camera_view` 和 `clear_scene_focus`。
- 产出：`SceneCommand`、`SceneCommandResult`、`SceneSnapshot` 和 `SceneToolName`。
- 产出：Event name `ice3/anchor`、`ice3/point-clear` 和 `ice3/autoplay-cancelled`。

- [ ] **步骤 1：编写 contract test**

```ts
// tests/contract.test.ts
import { expect } from '#test-expect';
import { test } from 'node:test';
import {
  SCENE_TOOLS,
  isSceneToolName,
} from '../shared/contract.js';

test('publishes an immutable scene-tool vocabulary', () => {
  expect(SCENE_TOOLS).toEqual([
    'find_equipment',
    'select_equipment',
    'focus_equipment',
    'highlight_equipment',
    'set_camera_view',
    'clear_scene_focus',
  ]);
  expect(Object.isFrozen(SCENE_TOOLS)).toBe(true);
  expect(isSceneToolName('focus_equipment')).toBe(true);
  expect(isSceneToolName('unsupported')).toBe(false);
});
```

- [ ] **步骤 2：运行 RED**

Run: `npm test -- tests/contract.test.ts`

Expected: FAIL because `shared/contract.ts` does not exist.

- [ ] **步骤 3：实现准确的共享类型**

```ts
// shared/scene.ts
export type CameraView = 'overview' | 'area' | 'equipment' | 'top';

export interface SceneCommand {
  readonly type:
    | 'find'
    | 'select'
    | 'focus'
    | 'highlight'
    | 'camera'
    | 'clear';
  readonly query?: string;
  readonly selectionIds?: readonly string[];
  readonly area?: string;
  readonly durationMs?: number;
  readonly view?: CameraView;
}

export interface SceneCommandResult {
  readonly ok: boolean;
  readonly selectionIds: readonly string[];
  readonly message: string;
  readonly matches?: readonly {
    readonly selectionId: string;
    readonly name: string;
    readonly tag?: string;
  }[];
}

export interface SceneSnapshot {
  readonly selectedIds: readonly string[];
  readonly view: CameraView;
  readonly cameraPosition: readonly [number, number, number];
  readonly cameraTarget: readonly [number, number, number];
}
```

Define `SCENE_TOOLS` as an `Object.freeze([...] as const)` and implement
`isSceneToolName(value: string): value is SceneToolName`.

- [ ] **步骤 4：运行 GREEN**

Run:

```bash
npm test -- tests/contract.test.ts
npm run typecheck
```

Expected: PASS with no type errors.

- [ ] **步骤 5：提交**

```bash
git add shared/contract.ts shared/scene.ts src/protocol/types.ts tests/contract.test.ts
git commit -m "feat: define scene agent protocol"
```

---

### Task 3：构建 AG-UI event reducer

**Files:**

- Create: `src/protocol/reducer.ts`
- Create: `src/protocol/run-input.ts`
- Test: `tests/reducer.test.ts`
- Test: `tests/run-input.test.ts`

**Interfaces:**

- Consumes: `SCENE_TOOLS` from `shared/contract.ts`.
- Produces: `ThreadState`, `initialState(threadId: string): ThreadState`,
  `reduceThread(state, action): {state, effects}`, and
  `toRunAgentInput(request): RunAgentInput`.
- Produces effect `{ type: 'execute-tool', toolCallId, name, args }`.

- [ ] **步骤 1：编写 reducer test**

```ts
// tests/reducer.test.ts
import { EventType } from '@ag-ui/core';
import { expect } from '#test-expect';
import { test } from 'node:test';
import { initialState, reduceThread } from '../src/protocol/reducer.js';

test('streams text and executes a complete scene tool call', () => {
  let result = reduceThread(initialState('thread-1'), {
    type: EventType.RUN_STARTED,
    threadId: 'thread-1',
    runId: 'run-1',
  });
  result = reduceThread(result.state, {
    type: EventType.TEXT_MESSAGE_START,
    messageId: 'message-1',
    role: 'assistant',
  });
  result = reduceThread(result.state, {
    type: EventType.TEXT_MESSAGE_CONTENT,
    messageId: 'message-1',
    delta: '正在定位',
  });
  result = reduceThread(result.state, {
    type: EventType.TOOL_CALL_START,
    toolCallId: 'call-1',
    toolCallName: 'focus_equipment',
  });
  result = reduceThread(result.state, {
    type: EventType.TOOL_CALL_ARGS,
    toolCallId: 'call-1',
    delta: '{"selectionId":"SC-101"}',
  });
  result = reduceThread(result.state, {
    type: EventType.TOOL_CALL_END,
    toolCallId: 'call-1',
  });

  expect(result.state.status).toBe('running');
  expect(result.state.items[0]).toMatchObject({
    kind: 'text',
    text: '正在定位',
  });
  expect(result.effects).toEqual([{
    type: 'execute-tool',
    toolCallId: 'call-1',
    name: 'focus_equipment',
    args: { selectionId: 'SC-101' },
  }]);
});

test('ignores unknown protocol events', () => {
  const state = initialState('thread-1');
  expect(reduceThread(state, { type: 'FUTURE_EVENT' })).toEqual({
    state,
    effects: [],
  });
});
```

- [ ] **步骤 2：运行 RED**

运行：`npm test -- tests/reducer.test.ts tests/run-input.test.ts`

预期：因为 reducer 和 input mapper 不存在而失败。

- [ ] **步骤 3：实现 reducer 行为**

处理：

- `RUN_STARTED`、`RUN_FINISHED` 和 `RUN_ERROR`。
- Text message 的 start、content 和 end。
- Tool call 的 start、args、end 和 result。
- `CUSTOM` event passthrough effects;
- local user messages and local tool results;
- unknown external events by returning the previous state unchanged.

Tool argument 只在 `TOOL_CALL_END` 时执行 JSON parse。Parse failure 会生成可见 tool
error item，并且不发送 Scene effect。

当数组为空时，`toRunAgentInput` 必须省略 `resume`，并设置 `tools: []`、
`context: request.context ?? []` 和 `state: request.state ?? {}`。

- [ ] **步骤 4：运行 GREEN 和完整 unit test**

运行：

```bash
npm test -- tests/reducer.test.ts tests/run-input.test.ts
npm test
```

预期：通过。

- [ ] **步骤 5：提交**

```bash
git add src/protocol/reducer.ts src/protocol/run-input.ts tests/reducer.test.ts tests/run-input.test.ts
git commit -m "feat: reduce agent scene events"
```

---

### Task 4：实现确定性 Agent 和 event encoder

**文件：**

- Create: `server/agents/types.ts`
- Create: `server/agents/events.ts`
- Create: `server/agents/scripted.ts`
- Test: `tests/scripted-agent.test.ts`

**接口：**

- 消费：`SceneToolName`、`toRunAgentInput` 和 `RunRequest`。
- 产出：`AgentRun.run(input: RunAgentInput, signal?: AbortSignal):
  AsyncIterable<AgentEvent>`.
- 产出：`createScriptedAgent(options?: { delayMs?: number }): AgentRun`。

- [ ] **步骤 1：将 scripted scenario 写成失败测试**

```ts
// tests/scripted-agent.test.ts
import type { RunAgentInput } from '@ag-ui/core';
import { EventType } from '@ag-ui/core';
import { expect } from '#test-expect';
import { test } from 'node:test';
import { createScriptedAgent } from '../server/agents/scripted.js';

const input = (text: string): RunAgentInput => ({
  threadId: 'thread-1',
  runId: 'run-1',
  state: {},
  messages: [{ id: 'user-1', role: 'user', content: text }],
  context: [],
  tools: [],
  forwardedProps: {},
});

test('returns a deterministic overview tool sequence', async () => {
  const events = [];
  for await (const event of createScriptedAgent({ delayMs: 0 }).run(
    input('带我看一下整个污水处理厂'),
  )) {
    events.push(event);
  }
  expect(events[0]?.type).toBe(EventType.RUN_STARTED);
  expect(events.some((event) => (
    event.type === EventType.TOOL_CALL_START
    && event.toolCallName === 'set_camera_view'
  ))).toBe(true);
  expect(events.at(-1)?.type).toBe(EventType.RUN_FINISHED);
});

test('uses current equipment context for a follow-up explanation', async () => {
  const request = input('讲讲这个设备');
  request.context = [{
    description: 'selected equipment',
    value: 'ice3-virtual-wwtp/equipment/AE-101',
  }];
  const names: string[] = [];
  for await (const event of createScriptedAgent({ delayMs: 0 }).run(request)) {
    if (event.type === EventType.TOOL_CALL_START) {
      names.push(event.toolCallName);
    }
  }
  expect(names).toContain('focus_equipment');
  expect(names).toContain('highlight_equipment');
});
```

- [ ] **步骤 2：运行 RED**

运行：`npm test -- tests/scripted-agent.test.ts`

预期：因为 Scripted Agent 不存在而失败。

- [ ] **步骤 3：实现 agenda planner 和 emitter**

Planner 使用明确的 phrase set：

- 全厂 Overview 匹配词：`全厂`、`全景`、`整个厂`。
- 二沉池匹配词：`二沉池`。
- 好氧池匹配词：`好氧池`。
- 清除意图匹配词：`清除`、`复位`、`回到全厂`。
- 当前 Selection 匹配词：`这个设备`、`这台`、`当前设备`。

Emitter 使用由 `runId + ordinal` 派生的稳定 ID 生成有效 AG-UI event、一个短 text
stream、完整 tool call 和 `RUN_FINISHED`。Client Scene executor 尚未运行的 command
不得发送 tool result。

- [ ] **步骤 4：运行 GREEN**

运行：`npm test -- tests/scripted-agent.test.ts`

预期：通过。

- [ ] **步骤 5：提交**

```bash
git add server/agents/types.ts server/agents/events.ts server/agents/scripted.ts tests/scripted-agent.test.ts
git commit -m "feat: add deterministic scene agent"
```

---

### Task 5：增加 Server transport

**Files:**

- Create: `server/config.ts`
- Create: `server/transport/sse.ts`
- Create: `server/index.ts`
- Test: `tests/server.test.ts`
- Test: `tests/server-config.test.ts`

**Interfaces:**

- Consumes: `createScriptedAgent`.
- Produces: `POST /agui` with SSE and `GET /health`.
- Produces: `encodeSse(event: unknown): string`.
- Produces: `loadServerConfig(env: NodeJS.ProcessEnv): ServerConfig`.

- [ ] **步骤 1：编写 transport test**

```ts
// tests/server.test.ts
import { expect } from '#test-expect';
import { test } from 'node:test';
import { encodeSse } from '../server/transport/sse.js';

test('encodes multiline events as valid SSE data frames', () => {
  expect(encodeSse({ type: 'TEXT', delta: 'line 1\nline 2' })).toBe(
    'data: {"type":"TEXT","delta":"line 1\\nline 2"}\n\n',
  );
});

test('rejects malformed run input before opening SSE', async () => {
  const response = await fetch('http://127.0.0.1:8099/agui', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"invalid":true}',
  });
  expect(response.status).toBe(422);
});
```

- [ ] **步骤 2：运行 RED**

运行：`npm test -- tests/server.test.ts tests/server-config.test.ts`

预期：因为 server 和 encoder 不存在而失败。

- [ ] **步骤 3：实现 native HTTP server**

使用 `node:http`、`RunAgentInputSchema.safeParse`、2 MiB body limit、面向本地应用的
CORS、每 15 秒 heartbeat comment，以及 client disconnect 时的 AbortController
cleanup。

Health response 包含：

```json
{
  "ok": true,
  "agent": "scripted",
  "transport": "server"
}
```

存在 model setting 时，health output 只包含 model name 和 endpoint host，永不返回
API key。

- [ ] **步骤 4：运行 GREEN**

在测试拥有的进程中启动 API 并运行：

```bash
npm test -- tests/server.test.ts tests/server-config.test.ts
```

预期：格式错误的 input 返回 422；有效 input 返回带 `RUN_STARTED` 和 `RUN_FINISHED`
的 `text/event-stream`。

- [ ] **步骤 5：提交**

```bash
git add server/config.ts server/transport/sse.ts server/index.ts tests/server.test.ts tests/server-config.test.ts
git commit -m "feat: serve agent events"
```

---

### Task 6：实现 3D Scene adapter

**文件：**

- 新建：`src/scene/types.ts`
- 新建：`src/scene/catalog.ts`
- 新建：`src/scene/camera-controller.ts`
- Create: `src/scene/controller.ts`
- Create: `src/scene/asset-url.ts`
- Test: `tests/scene-catalog.test.ts`
- Test: `tests/scene-commands.test.ts`
- Test: `tests/asset-url.test.ts`

**接口：**

- 消费：`SceneCommand`、`SceneCommandResult`、`SceneSnapshot` 和
  exports from `ice3`.
- 产出：`createSceneController(options): SceneController`。
- 产出：`SceneController.execute(command): Promise<SceneCommandResult>`、
  `snapshot()`, `onSelection(listener)`, `onUserCameraIntent(listener)`, and
  `dispose()`.

- [ ] **步骤 1：编写失败的 catalog 和 command test**

```ts
// tests/scene-catalog.test.ts
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
```

```ts
// tests/scene-commands.test.ts
import { expect } from '#test-expect';
import { test } from 'node:test';
import { SceneCommandExecutor } from '../src/scene/controller.js';

test('does not mutate the scene for an unknown equipment ID', async () => {
  const scene = new FakeScene();
  const executor = new SceneCommandExecutor(scene);
  const result = await executor.execute({
    type: 'focus',
    selectionIds: ['missing'],
  });
  expect(result.ok).toBe(false);
  expect(scene.selection).toEqual([]);
  expect(scene.cameraMoves).toBe(0);
});
```

- [ ] **步骤 2：运行 RED**

运行：`npm test -- tests/scene-catalog.test.ts tests/scene-commands.test.ts tests/asset-url.test.ts`

预期：因为 Scene module 不存在而失败。

- [ ] **步骤 3：实现 public-API adapter**

使用 `ICETilesetLoader` 加载虚构 Asset，并且只使用公开 method：

- `queryScene`、`findBySelectionId`、`setSelection` 和 `project`。
- `ICEPerspectiveCamera` method。
- Stage 自有的 orbit controller，用于用户 input。
- 从已加载 handle 获取 Scene Bounds。

Camera movement 有两种模式：

- 初始 framing 和测试使用 immediate pose。
- Agent command 使用 eased focus。

Controller 为 Agent camera motion 持有一个 `AbortController`。Pointer 或
navigation-key intent 在 orbit handling 前调用 `cancelAgentMotion()`。

Asset URL 通过 `new URL('assets/wastewater-plant/tiled/tileset.json',
document.baseURI)` 解析，使 static build 不假设站点根路径。

- [ ] **步骤 4：运行 GREEN**

运行：

```bash
npm test -- tests/scene-catalog.test.ts tests/scene-commands.test.ts tests/asset-url.test.ts
npm run typecheck
```

预期：通过。

- [ ] **步骤 5：提交**

```bash
git add src/scene tests/scene-catalog.test.ts tests/scene-commands.test.ts tests/asset-url.test.ts
git commit -m "feat: add semantic scene controller"
```

---

### Task 7：构建 Stage 和 Conversation 界面

**文件：**

- 新建：`src/view/stage.ts`
- 新建：`src/view/chat-panel.ts`
- 新建：`src/view/equipment-card.ts`
- Create: `src/view/quick-actions.ts`
- Create: `src/view/status.ts`
- Create: `src/view/markdown.ts`
- Modify: `public/index.html`
- Modify: `public/styles.css`
- Test: `tests/chat-panel.test.ts`
- Test: `tests/equipment-card.test.ts`

**接口：**

- 消费：`ThreadState` 和 `SceneSnapshot`。
- 产出：`ChatPanel.appendUserMessage(text)`、
  `ChatPanel.render(state)`, `ChatPanel.setBusy(boolean)`, and
  `EquipmentCard.show(equipment | null)`.

- [ ] **步骤 1：编写可访问 view test**

```ts
// tests/equipment-card.test.ts
import { expect } from '#test-expect';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { EquipmentCard } from '../src/view/equipment-card.js';

test('shows equipment identity and hides cleanly', () => {
  const dom = new JSDOM('<main></main>');
  const card = new EquipmentCard(dom.window.document.querySelector('main')!);
  card.show({
    selectionId: 'ice3-virtual-wwtp/equipment/SC-101',
    name: '二沉池 A',
    tag: 'SC-101',
    stage: '二沉与污泥回流',
    area: '二沉与回流区',
    connectionCount: 4,
  });
  expect(card.element.hidden).toBe(false);
  expect(card.element.textContent).toContain('二沉池 A');
  expect(card.element.textContent).toContain('SC-101');
  card.show(null);
  expect(card.element.hidden).toBe(true);
});
```

- [ ] **步骤 2：运行 RED**

运行：`npm test -- tests/chat-panel.test.ts tests/equipment-card.test.ts`

预期：因为 view component 不存在而失败。

- [ ] **步骤 3：实现界面**

布局结构为：

```html
<main id="stage" aria-busy="true"></main>
<aside class="conversation-panel" aria-label="设备助手">
  <header>...</header>
  <section class="conversation-scroll"></section>
  <form class="composer">...</form>
</aside>
<section class="equipment-card" hidden>...</section>
<nav class="quick-actions" aria-label="快捷指令">...</nav>
<output class="agent-status"></output>
```

Conversation panel 折叠后成为侧边 tab，展开宽度为 `min(420px, 38vw)`。Stage 在其下方
保持 full-viewport。宽度低于 `720px` 时，panel 可以覆盖全宽，但初始为折叠状态。

使用语义化 button、label、live region 和 keyboard focus。使用配置为禁用 raw HTML 的
`markdown-it` 渲染 assistant text。

- [ ] **步骤 4：运行 GREEN**

Run:

```bash
npm test -- tests/chat-panel.test.ts tests/equipment-card.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **步骤 5：提交**

```bash
git add src/view public/index.html public/styles.css tests/chat-panel.test.ts tests/equipment-card.test.ts
git commit -m "feat: add industrial agent interface"
```

---

### Task 8：组装应用并将 Tool 接入 Scene

**文件：**

- 新建：`src/app/session.ts`
- 新建：`src/app/main.ts`
- 修改：`src/entries/boot.ts`
- Create: `src/protocol/client.ts`
- Create: `src/protocol/local-agent.ts`
- Create: `scripts/demo-agent-marker.mjs`
- Test: `tests/session.test.ts`
- Test: `tests/transport.test.ts`

**接口：**

- 消费：`SceneController`、`ChatPanel`、`reduceThread`、server Agent 和
  browser-local Scripted Agent.
- 产出：`createSession(options): AgentConsoleSession`，包括
  `start()`, `send(text)`, `notifyUserSceneIntent()`, and `dispose()`.
- 产出：`runAgentServer(request, handlers, signal, endpoint?)` 和
  `runAgentLocally(request, handlers, signal)`.

- [ ] **步骤 1：编写失败的 Integration test**

```ts
// tests/session.test.ts
import { expect } from '#test-expect';
import { test } from 'node:test';
import { createSession } from '../src/app/session.js';

test('routes a complete scene tool call to the controller', async () => {
  const scene = new FakeSceneController();
  const session = createSession({
    transport: scriptedTransport('定位二沉池'),
    scene,
    view: new FakeView(),
    threadId: 'thread-1',
  });

  await session.send('定位二沉池');

  expect(scene.commands).toEqual([
    {
      type: 'focus',
      selectionIds: ['ice3-virtual-wwtp/equipment/SC-101'],
    },
  ]);
  expect(session.state.status).toBe('idle');
});

test('manual scene intent cancels pending autoplay', async () => {
  const transport = countingTransport();
  const session = createSession({
    transport,
    scene: new FakeSceneController(),
    view: new FakeView(),
    threadId: 'thread-1',
    autoplay: { enabled: true, delayMs: 500 },
  });
  session.start();
  session.notifyUserSceneIntent();
  await new Promise((resolve) => setTimeout(resolve, 550));
  expect(transport.calls).toBe(0);
});
```

```ts
// tests/transport.test.ts
import { expect } from '#test-expect';
import { test } from 'node:test';
import { runAgentLocally } from '../src/protocol/local-agent.js';

test('local scripted transport emits the same lifecycle as server transport', async () => {
  const types: string[] = [];
  await runAgentLocally(
    {
      threadId: 'thread-1',
      runId: 'run-1',
      messages: [{ id: 'u1', role: 'user', content: '全厂总览' }],
      context: [],
    },
    { onEvent: (event) => types.push(event.type) },
  );
  expect(types[0]).toBe('RUN_STARTED');
  expect(types.at(-1)).toBe('RUN_FINISHED');
});

test('server transport reports an unavailable endpoint', async () => {
  const errors: string[] = [];
  await runAgentServer(
    {
      threadId: 'thread-1',
      runId: 'run-1',
      messages: [{ id: 'u1', role: 'user', content: '全厂总览' }],
      context: [],
    },
    {
      onEvent: () => {},
      onError: (error) => errors.push(error.message),
    },
    undefined,
    'http://127.0.0.1:1/agui',
  );
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('Agent 服务不可用');
});
```

- [ ] **步骤 2：运行 RED**

运行：`npm test -- tests/session.test.ts tests/transport.test.ts`

预期：因为 session 和 transport 不存在而失败。

- [ ] **步骤 3：实现 session orchestration**

`session.send(text)` 执行以下步骤：

1. 在本地追加 user item。
2. 创建 Scene snapshot。
3. 使用 Selection、camera 和最近 Scene action 构建有界 context。
4. 根据 `resolveDemoMode` 选择 server 或 local transport。
5. Reducer 每个 event，并按顺序执行发出的 Scene Tool。
6. 追加包含 `ok`、`selectionIds` 和 `message` 的 local tool result。
7. 更新 Scene card 和 status。
8. 新 run 开始后忽略 stale event。

Quick action 使用预定义 text 调用 `send()`。点击 equipment 更新 selected equipment
context，永不提交 message。

手动 pointer 或 keyboard Scene intent 会上报 session、取消 autoplay，并让已经完成的
Agent command 留在 history 中。

`runAgentServer` 接受测试用可选 endpoint。Network failure 和非成功 response 调用
`onError`，永不调用 local scripted transport。

- [ ] **步骤 4：运行 GREEN**

运行：

```bash
npm test -- tests/session.test.ts tests/transport.test.ts
npm test
npm run typecheck
```

预期：通过。

- [ ] **步骤 5：提交**

```bash
git add src/app/session.ts src/app/main.ts src/entries/boot.ts src/protocol/client.ts src/protocol/local-agent.ts scripts/demo-agent-marker.mjs tests/session.test.ts tests/transport.test.ts
git commit -m "feat: connect agent events to 3d scene"
```

---

### Task 9：增加 Real-Model Server adapter

**文件：**

- Create: `server/agents/model.ts`
- Create: `server/agents/model-client.ts`
- Create: `server/agents/tool-schema.ts`
- Modify: `server/config.ts`
- Modify: `server/index.ts`
- Test: `tests/model-agent.test.ts`
- Test: `tests/model-client.test.ts`

- [ ] **步骤 1：编写失败的 adapter test**

```ts
// tests/model-agent.test.ts
import { expect } from '#test-expect';
import { test } from 'node:test';
import { createModelAgent } from '../server/agents/model.js';

test('emits a provider failure instead of scripted fallback', async () => {
  const agent = createModelAgent({
    complete: async () => {
      throw new Error('provider unavailable');
    },
  });
  const events = [];
  for await (const event of agent.run({
    threadId: 'thread-1',
    runId: 'run-1',
    state: {},
    messages: [{ id: 'u1', role: 'user', content: '定位二沉池' }],
    context: [],
    tools: [],
    forwardedProps: {},
  })) {
    events.push(event);
  }
  expect(events.at(-1)).toMatchObject({
    type: 'RUN_ERROR',
    message: 'provider unavailable',
  });
  expect(events.some((event) => event.type === 'TOOL_CALL_START')).toBe(false);
});
```

- [ ] **步骤 2：运行 RED**

运行：`npm test -- tests/model-agent.test.ts tests/model-client.test.ts`

预期：因为 model module 不存在而失败。

- [ ] **步骤 3：实现 provider-neutral model boundary**

Environment variable：

```text
ICE_AGENT_MODEL_BASE_URL
ICE_AGENT_MODEL_API_KEY
ICE_AGENT_MODEL_NAME
```

Request format 遵循受支持的 chat-completions-compatible service。Adapter 将 model
text 和 tool call 映射到 Scripted Agent 使用的同一 event emitter。只接受
`SCENE_TOOLS` 中的六个 tool；发送 tool call 前拒绝未知 name 和格式错误的 argument。

API key 只用于 server request header。测试使用 fake `fetch` implementation，并断言
key 永不出现在 event data、health response 或 error 中。

- [ ] **步骤 4：运行 GREEN**

运行：

```bash
npm test -- tests/model-agent.test.ts tests/model-client.test.ts
npm run typecheck
```

预期：通过。

- [ ] **步骤 5：提交**

```bash
git add server/agents/model.ts server/agents/model-client.ts server/agents/tool-schema.ts server/config.ts server/index.ts tests/model-agent.test.ts tests/model-client.test.ts
git commit -m "feat: add real model agent adapter"
```

---

### Task 10：构建自包含 Demo 并执行端到端验证

**文件：**

- 新建：`scripts/copy-demo-assets.mjs`
- 新建：`playwright.config.ts`
- 新建：`e2e/server-mode.spec.ts`
- Create: `e2e/static-mode.spec.ts`
- Create: `e2e/responsive.spec.ts`
- Modify: `package.json`
- Modify: `webpack.config.cjs`
- Modify: `README.md`

**接口：**

- 消费：所有前置 Task。
- 产出：`npm run build:demo` 和可从 subpath 运行的 `dist/` tree。
- 产出：位于 `dist/assets/wastewater-plant/tiled/` 的 static output。

- [ ] **步骤 1：编写失败的 browser test**

```ts
// e2e/static-mode.spec.ts
import { expect, test } from '@playwright/test';

test('runs the static demo without an Agent server', async ({ page }) => {
  const backendRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes(':8099')) {
      backendRequests.push(request.url());
    }
  });
  await page.goto('/?demo=1&autoplay=0');
  await expect(page.locator('[data-role="agent-mode"]'))
    .toHaveText('剧本模式');
  await expect(page.locator('[data-role="scene-status"]'))
    .toHaveText('场景已就绪');
  await page.getByRole('button', { name: '定位二沉池' }).click();
  await expect(page.locator('[data-role="selection-tag"]'))
    .toHaveText('SC-101');
  expect(backendRequests).toEqual([]);
});
```

```ts
// e2e/server-mode.spec.ts
import { expect, test } from '@playwright/test';

test('loads the wastewater plant and completes a scene command', async ({
  page,
}) => {
  await page.goto('/?demo=0&autoplay=0');
  await expect(page.locator('[data-role="scene-status"]'))
    .toHaveText('场景已就绪');
  await page.getByRole('button', { name: '查看好氧池' }).click();
  await expect(page.locator('[data-role="selection-tag"]'))
    .toHaveText('AE-101');
});
```

- [ ] **步骤 2：实现 Asset 复制和 deployment configuration**

`copy-demo-assets.mjs` 只复制：

```text
../ice3-engine/examples/m1/assets/wastewater-plant/tiled
```

到：

```text
dist/assets/wastewater-plant/tiled
```

它先移除既有 destination，将内容复制到同级 temporary directory，再 rename 到目标。
永不复制 `source/` 或 `prepared/`。

`build:demo` 变为：

```json
"build:demo": "webpack --mode production --env demo && node scripts/copy-demo-assets.mjs"
```

Webpack 通过 `devServer.static` 提供同级 Asset root。生成的 HTML 使用相对 script 和
stylesheet URL。

- [ ] **步骤 3：增加 Playwright web server**

使用：

- Web 应用：`npm run dev:web -- --port 8110`。
- Agent API：`ICE_AGENT_PACE=0 npm run dev:api`。
- Static demo test：执行 `build:demo` 后运行 `npx http-server dist -p 8111 -c-1`。

运行 Chromium 和 WebKit project。Static test 必须观察不到任何 Agent API request。

- [ ] **步骤 4：编写 README**

编写以下 command 的文档：

```bash
npm install
npm run dev
npm run build
npm run build:demo
npx http-server dist -p 8111 -c-1
npm run verify
npm run test:e2e
```

记录 URL switch、server environment variable、Asset 复制、static Asset exclusion，
以及 Scene command 与 Engine API 的区别。

- [ ] **步骤 5：运行完整验证**

运行：

```bash
npm run verify
npm run build:demo
npm run test:e2e
```

预期：

- typecheck exit 0。
- 所有 unit 和 integration test 通过。
- production 和 demo build 成功。
- Chromium 和 WebKit test 通过。
- Static request 永不访问 Agent API。
- `dist/assets/` 下不存在 source 或 prepared GLB。

- [ ] **步骤 6：提交**

```bash
git add scripts/copy-demo-assets.mjs playwright.config.ts e2e package.json package-lock.json webpack.config.cjs README.md
git commit -m "feat: add static agent console demo"
```

---

## 最终验证

- [ ] 运行 `npm run verify`。
- [ ] 运行 `npm run build:demo`。
- [ ] 运行 `npm run test:e2e`。
- [ ] 确认 `dist/assets/wastewater-plant/tiled/tileset.json` 存在。
- [ ] 确认 `dist/assets/wastewater-plant/source` 不存在。
- [ ] 确认 `dist/assets/wastewater-plant/prepared` 不存在。
- [ ] 确认任何 `dist/` 文件都不包含已配置 API key。
- [ ] 启动普通应用并手动验证 3D orbit、zoom、Selection、无碰撞 panel layout、scripted overview、device focus 和 clear。
- [ ] 从嵌套路径启动 demo build，并手动重复相同 flow。
- [ ] 运行 `git status --short`，确认 worktree 干净。

## 关联文档

- `ICE3-AGENT-IDX-001` — [文档索引](../README.md)
- `ICE3-AGENT-SPEC-001` — [Console 设计](../specs/2026-10-28-ice3-agent-console-design.md)

# ICE3 Agent Console Implementation Plan

> Document ID: ICE3-AGENT-PLAN-001
>
> Status: Implemented
>
> Owner: ICE3 Agent Console maintainers
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable 3D industrial Agent Console that combines the synthetic wastewater plant with a persistent scene, a floating conversation panel, deterministic scene tools, an optional real-model server, and a self-contained static demo.

**Architecture:** The application is an independent TypeScript package. A browser scene adapter wraps only public `ice3` APIs; protocol code reduces AG-UI events into chat and tool state; a scene executor applies validated commands; and server or browser-local Agent transports emit the same event stream.

**Tech Stack:** Node.js 24, TypeScript 7, webpack 5, `@ag-ui/core` 1.0.3, native Node test, Playwright 1.64, and the sibling `ice3` packages.

**Spec:** [`ICE3-AGENT-SPEC-001`](../specs/2026-10-28-ice3-agent-console-design.md)

## Global Constraints

- Do not introduce development tooling prohibited by the repository naming and
  technology constraints.
- Do not use competitor, vendor, or unapproved commercial product names in source, tests, documentation, diagnostics, or commit messages.
- Keep the 3D scene full-viewport and the conversation panel floating above it.
- The default demo must work without model credentials.
- A configured model failure must emit an error and must not silently use the scripted response.
- Agent code must not import `ice3` renderer internals or manipulate GPU resources.
- Browser code must use only public exports from `ice3`.
- Real customer model assets must never be referenced or copied.
- Static output contains only the synthetic `tiled/` asset tree, never source or prepared GLBs.
- Asset URLs in static output are relative and work from a repository subpath.
- Normal build defaults to server transport; demo build defaults to local transport.
- Normal build defaults to autoplay off; demo build may default to autoplay on.
- User pointer or keyboard camera input cancels Agent-driven camera motion.
- Every behavioral change starts with a failing test and ends with the relevant complete test suite green.

## Review Focus

- Invalid or absent model configuration: the server must identify the failure clearly and must not fall back to scripted output.
- Stale or unknown equipment IDs: the scene executor must reject the command without clearing or moving the current scene.
- User interruption: pointer or keyboard camera input must stop queued Agent camera motion instead of fighting the user.
- Static hosting under a subpath: every Tileset, chunk, coarse node, script, and stylesheet must resolve through relative URLs.
- Backend unavailable in server mode: the page must show a recoverable connection error and retain the loaded scene.

---

### Task 1: Bootstrap the application and mode switch

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.server.json`
- Create: `webpack.config.cjs`
- Create: `public/index.html`
- Create: `public/styles.css`
- Create: `src/entries/boot.ts`
- Create: `src/app/mode.ts`
- Create: `scripts/dev.mjs`
- Create: `scripts/run-tests.mjs`
- Create: `tests/mode.test.ts`
- Create: `.gitignore`
- Create: `AGENTS.md`
- Create: `README.md`

**Interfaces:**

- Consumes: no earlier task.
- Produces: `resolveDemoMode(search: string, demoDefault: boolean): boolean`
- Produces: `resolveAutoplay(search: string, autoplayDefault: boolean): boolean`
- Produces: `npm run dev`, `npm run build`, `npm run build:demo`, and `npm test`.

- [ ] **Step 1: Write the failing mode tests**

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

- [ ] **Step 2: Add the package and configuration**

`package.json` uses these exact dependency groups:

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

Add `#test-expect` in `imports` pointing to `./tests/assertions.ts`. Create that
file by re-exporting the engine check helpers used by the sibling projects.

Webpack must:

- bundle `src/entries/boot.ts` to `dist/boot.[contenthash].js`;
- generate `dist/index.html` from `public/index.html`;
- use `output.publicPath: 'auto'`;
- serve the sibling synthetic asset directory in development at `/assets`;
- define `__ICE_DEMO__` as `Boolean(env.demo)`.

- [ ] **Step 3: Run the tests to verify RED**

Run: `npm test -- tests/mode.test.ts`

Expected: FAIL because `src/app/mode.ts` does not exist.

- [ ] **Step 4: Implement the mode functions**

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

`src/entries/boot.ts` initially mounts an accessible page shell containing the
scene stage, conversation panel, connection state, and loading state.

- [ ] **Step 5: Run the mode tests and build**

Run:

```bash
npm test -- tests/mode.test.ts
npm run typecheck
npm run build
```

Expected: mode tests PASS, typecheck exits 0, and `dist/index.html` plus one
hashed script exist.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.server.json webpack.config.cjs public src/entries/boot.ts src/app/mode.ts scripts tests/mode.test.ts tests/assertions.ts .gitignore AGENTS.md README.md
git commit -m "feat: bootstrap agent console"
```

---

### Task 2: Define the shared protocol and scene command contract

**Files:**

- Create: `shared/contract.ts`
- Create: `shared/scene.ts`
- Create: `src/protocol/types.ts`
- Test: `tests/contract.test.ts`

**Interfaces:**

- Consumes: no runtime dependency on earlier UI code.
- Produces: tool names `find_equipment`, `select_equipment`, `focus_equipment`,
  `highlight_equipment`, `set_camera_view`, and `clear_scene_focus`.
- Produces: `SceneCommand`, `SceneCommandResult`, `SceneSnapshot`, and
  `SceneToolName`.
- Produces: event names `ice3/anchor`, `ice3/point-clear`, and
  `ice3/autoplay-cancelled`.

- [ ] **Step 1: Write contract tests**

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

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/contract.test.ts`

Expected: FAIL because `shared/contract.ts` does not exist.

- [ ] **Step 3: Implement exact shared types**

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

- [ ] **Step 4: Run GREEN**

Run:

```bash
npm test -- tests/contract.test.ts
npm run typecheck
```

Expected: PASS with no type errors.

- [ ] **Step 5: Commit**

```bash
git add shared/contract.ts shared/scene.ts src/protocol/types.ts tests/contract.test.ts
git commit -m "feat: define scene agent protocol"
```

---

### Task 3: Build the AG-UI event reducer

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

- [ ] **Step 1: Write reducer tests**

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

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/reducer.test.ts tests/run-input.test.ts`

Expected: FAIL because the reducer and input mapper do not exist.

- [ ] **Step 3: Implement reducer behavior**

Handle:

- `RUN_STARTED`, `RUN_FINISHED`, and `RUN_ERROR`;
- text-message start/content/end;
- tool-call start/args/end/result;
- `CUSTOM` event passthrough effects;
- local user messages and local tool results;
- unknown external events by returning the previous state unchanged.

Tool arguments are JSON-parsed only at `TOOL_CALL_END`. Parse failure becomes a
visible tool error item and emits no scene effect.

`toRunAgentInput` must omit `resume` when its array is empty and set `tools: []`,
`context: request.context ?? []`, and `state: request.state ?? {}`.

- [ ] **Step 4: Run GREEN and full unit tests**

Run:

```bash
npm test -- tests/reducer.test.ts tests/run-input.test.ts
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/protocol/reducer.ts src/protocol/run-input.ts tests/reducer.test.ts tests/run-input.test.ts
git commit -m "feat: reduce agent scene events"
```

---

### Task 4: Implement the deterministic Agent and event encoder

**Files:**

- Create: `server/agents/types.ts`
- Create: `server/agents/events.ts`
- Create: `server/agents/scripted.ts`
- Test: `tests/scripted-agent.test.ts`

**Interfaces:**

- Consumes: `SceneToolName`, `toRunAgentInput`, and `RunRequest`.
- Produces: `AgentRun.run(input: RunAgentInput, signal?: AbortSignal):
  AsyncIterable<AgentEvent>`.
- Produces: `createScriptedAgent(options?: { delayMs?: number }): AgentRun`.

- [ ] **Step 1: Write scripted scenarios as failing tests**

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

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/scripted-agent.test.ts`

Expected: FAIL because the scripted Agent does not exist.

- [ ] **Step 3: Implement the agenda planner and emitter**

The planner uses explicit phrase sets:

- overview: `全厂`, `全景`, `整个厂`;
- secondary clarifier: `二沉池`;
- aerobic tank: `好氧池`;
- clear: `清除`, `复位`, `回到全厂`;
- current selection: `这个设备`, `这台`, `当前设备`.

The emitter generates valid AG-UI events with stable IDs derived from
`runId + ordinal`, one short text stream, complete tool calls, and
`RUN_FINISHED`. Do not emit tool results for commands that the client scene
executor has not run yet.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- tests/scripted-agent.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/agents/types.ts server/agents/events.ts server/agents/scripted.ts tests/scripted-agent.test.ts
git commit -m "feat: add deterministic scene agent"
```

---

### Task 5: Add the server transport

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

- [ ] **Step 1: Write transport tests**

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

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/server.test.ts tests/server-config.test.ts`

Expected: FAIL because the server and encoder do not exist.

- [ ] **Step 3: Implement the native HTTP server**

Use `node:http`, `RunAgentInputSchema.safeParse`, a 2 MiB body limit, CORS for
the local application, heartbeat comments every 15 seconds, and AbortController
cleanup when the client disconnects.

The health response contains:

```json
{
  "ok": true,
  "agent": "scripted",
  "transport": "server"
}
```

When model settings exist, include only the model name and endpoint host in
health output. Never return an API key.

- [ ] **Step 4: Run GREEN**

Start the API in the test-owned process and run:

```bash
npm test -- tests/server.test.ts tests/server-config.test.ts
```

Expected: malformed input returns 422; valid input returns `text/event-stream`
with `RUN_STARTED` and `RUN_FINISHED`.

- [ ] **Step 5: Commit**

```bash
git add server/config.ts server/transport/sse.ts server/index.ts tests/server.test.ts tests/server-config.test.ts
git commit -m "feat: serve agent events"
```

---

### Task 6: Implement the 3D scene adapter

**Files:**

- Create: `src/scene/types.ts`
- Create: `src/scene/catalog.ts`
- Create: `src/scene/camera-controller.ts`
- Create: `src/scene/controller.ts`
- Create: `src/scene/asset-url.ts`
- Test: `tests/scene-catalog.test.ts`
- Test: `tests/scene-commands.test.ts`
- Test: `tests/asset-url.test.ts`

**Interfaces:**

- Consumes: `SceneCommand`, `SceneCommandResult`, `SceneSnapshot`, and public
  exports from `ice3`.
- Produces: `createSceneController(options): SceneController`.
- Produces: `SceneController.execute(command): Promise<SceneCommandResult>`,
  `snapshot()`, `onSelection(listener)`, `onUserCameraIntent(listener)`, and
  `dispose()`.

- [ ] **Step 1: Write failing catalog and command tests**

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

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/scene-catalog.test.ts tests/scene-commands.test.ts tests/asset-url.test.ts`

Expected: FAIL because the scene modules do not exist.

- [ ] **Step 3: Implement the public-API adapter**

Load the synthetic asset with `ICETilesetLoader` and use only public methods:

- `queryScene`, `findBySelectionId`, `setSelection`, and `project`;
- `ICEPerspectiveCamera` methods;
- a stage-owned orbit controller for user input;
- scene bounds from the loaded handle.

Camera movement has two modes:

- immediate pose for initial framing and tests;
- eased focus for Agent commands.

The controller owns an `AbortController` for Agent camera motion. Pointer or
navigation-key intent calls `cancelAgentMotion()` before orbit handling.

Asset URL resolution uses `new URL('assets/wastewater-plant/tiled/tileset.json',
document.baseURI)` so static builds do not assume the site root.

- [ ] **Step 4: Run GREEN**

Run:

```bash
npm test -- tests/scene-catalog.test.ts tests/scene-commands.test.ts tests/asset-url.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scene tests/scene-catalog.test.ts tests/scene-commands.test.ts tests/asset-url.test.ts
git commit -m "feat: add semantic scene controller"
```

---

### Task 7: Build the stage and conversation interface

**Files:**

- Create: `src/view/stage.ts`
- Create: `src/view/chat-panel.ts`
- Create: `src/view/equipment-card.ts`
- Create: `src/view/quick-actions.ts`
- Create: `src/view/status.ts`
- Create: `src/view/markdown.ts`
- Modify: `public/index.html`
- Modify: `public/styles.css`
- Test: `tests/chat-panel.test.ts`
- Test: `tests/equipment-card.test.ts`

**Interfaces:**

- Consumes: `ThreadState` and `SceneSnapshot`.
- Produces: `ChatPanel.appendUserMessage(text)`,
  `ChatPanel.render(state)`, `ChatPanel.setBusy(boolean)`, and
  `EquipmentCard.show(equipment | null)`.

- [ ] **Step 1: Write accessible view tests**

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

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/chat-panel.test.ts tests/equipment-card.test.ts`

Expected: FAIL because the view components do not exist.

- [ ] **Step 3: Implement the interface**

The layout structure is:

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

The conversation panel collapses to a side tab. Its open width is
`min(420px, 38vw)`. The stage remains full-viewport beneath it. At widths below
`720px`, the panel can cover the full width but starts collapsed.

Use semantic buttons, labels, live regions, and keyboard focus. Render assistant
text with `markdown-it` configured with raw HTML disabled.

- [ ] **Step 4: Run GREEN**

Run:

```bash
npm test -- tests/chat-panel.test.ts tests/equipment-card.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/view public/index.html public/styles.css tests/chat-panel.test.ts tests/equipment-card.test.ts
git commit -m "feat: add industrial agent interface"
```

---

### Task 8: Assemble the application and connect tools to the scene

**Files:**

- Create: `src/app/session.ts`
- Create: `src/app/main.ts`
- Modify: `src/entries/boot.ts`
- Create: `src/protocol/client.ts`
- Create: `src/protocol/local-agent.ts`
- Create: `scripts/demo-agent-marker.mjs`
- Test: `tests/session.test.ts`
- Test: `tests/transport.test.ts`

**Interfaces:**

- Consumes: `SceneController`, `ChatPanel`, `reduceThread`, server Agent, and
  browser-local Scripted Agent.
- Produces: `createSession(options): AgentConsoleSession`, including
  `start()`, `send(text)`, `notifyUserSceneIntent()`, and `dispose()`.
- Produces: `runAgentServer(request, handlers, signal, endpoint?)` and
  `runAgentLocally(request, handlers, signal)`.

- [ ] **Step 1: Write failing integration tests**

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

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/session.test.ts tests/transport.test.ts`

Expected: FAIL because session and transports do not exist.

- [ ] **Step 3: Implement session orchestration**

`session.send(text)` performs:

1. append the user item locally;
2. snapshot the scene;
3. build bounded context with selection, camera, and latest scene action;
4. select server or local transport from `resolveDemoMode`;
5. reduce every event and execute emitted scene tools in order;
6. append a local tool result with `ok`, `selectionIds`, and `message`;
7. update the scene card and status;
8. ignore stale events after a newer run begins.

Quick actions call `send()` with their predefined text. Clicking equipment
updates the selected equipment context and never submits a message.

Manual pointer or keyboard scene intent reports to the session, cancels
autoplay, and leaves an already completed Agent command in history.

`runAgentServer` accepts an optional endpoint for tests. Network failures and
non-success responses call `onError`; they never invoke the local scripted
transport.

- [ ] **Step 4: Run GREEN**

Run:

```bash
npm test -- tests/session.test.ts tests/transport.test.ts
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/session.ts src/app/main.ts src/entries/boot.ts src/protocol/client.ts src/protocol/local-agent.ts scripts/demo-agent-marker.mjs tests/session.test.ts tests/transport.test.ts
git commit -m "feat: connect agent events to 3d scene"
```

---

### Task 9: Add the real-model server adapter

**Files:**

- Create: `server/agents/model.ts`
- Create: `server/agents/model-client.ts`
- Create: `server/agents/tool-schema.ts`
- Modify: `server/config.ts`
- Modify: `server/index.ts`
- Test: `tests/model-agent.test.ts`
- Test: `tests/model-client.test.ts`

- [ ] **Step 1: Write failing adapter tests**

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

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/model-agent.test.ts tests/model-client.test.ts`

Expected: FAIL because model modules do not exist.

- [ ] **Step 3: Implement the provider-neutral model boundary**

Environment variables:

```text
ICE_AGENT_MODEL_BASE_URL
ICE_AGENT_MODEL_API_KEY
ICE_AGENT_MODEL_NAME
```

The request format follows a supported chat-completions-compatible service.
The adapter maps model text and tool calls into the same event emitter used by
the scripted Agent. Accept only the six tools in `SCENE_TOOLS`; reject unknown
names and malformed arguments before emitting a tool call.

The API key is used only in the server request header. Tests use a fake
`fetch` implementation and assert that the key never appears in event data,
health responses, or errors.

- [ ] **Step 4: Run GREEN**

Run:

```bash
npm test -- tests/model-agent.test.ts tests/model-client.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/agents/model.ts server/agents/model-client.ts server/agents/tool-schema.ts server/config.ts server/index.ts tests/model-agent.test.ts tests/model-client.test.ts
git commit -m "feat: add real model agent adapter"
```

---

### Task 10: Build the self-contained demo and verify end to end

**Files:**

- Create: `scripts/copy-demo-assets.mjs`
- Create: `playwright.config.ts`
- Create: `e2e/server-mode.spec.ts`
- Create: `e2e/static-mode.spec.ts`
- Create: `e2e/responsive.spec.ts`
- Modify: `package.json`
- Modify: `webpack.config.cjs`
- Modify: `README.md`

**Interfaces:**

- Consumes: all previous tasks.
- Produces: `npm run build:demo` and a `dist/` tree runnable from a subpath.
- Produces: static output at `dist/assets/wastewater-plant/tiled/`.

- [ ] **Step 1: Write failing browser tests**

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

- [ ] **Step 2: Implement asset copying and deployment configuration**

`copy-demo-assets.mjs` copies only:

```text
../ice3-engine/examples/m1/assets/wastewater-plant/tiled
```

to:

```text
dist/assets/wastewater-plant/tiled
```

It removes an existing destination first, copies into a temporary sibling
directory, then renames into place. It never copies `source/` or `prepared/`.

`build:demo` becomes:

```json
"build:demo": "webpack --mode production --env demo && node scripts/copy-demo-assets.mjs"
```

Webpack serves the sibling asset root through `devServer.static`. The generated
HTML uses relative script and stylesheet URLs.

- [ ] **Step 3: Add Playwright web servers**

Use:

- web application: `npm run dev:web -- --port 8110`
- Agent API: `ICE_AGENT_PACE=0 npm run dev:api`
- static demo test: `npx http-server dist -p 8111 -c-1` after `build:demo`

Run Chromium and WebKit projects. The static test must observe zero requests to
the Agent API.

- [ ] **Step 4: Write the README**

Document:

```bash
npm install
npm run dev
npm run build
npm run build:demo
npx http-server dist -p 8111 -c-1
npm run verify
npm run test:e2e
```

Document URL switches, server environment variables, asset copying, static
asset exclusions, and the distinction between scene commands and engine APIs.

- [ ] **Step 5: Run the complete verification**

Run:

```bash
npm run verify
npm run build:demo
npm run test:e2e
```

Expected:

- typecheck exits 0;
- all unit and integration tests pass;
- production and demo builds succeed;
- Chromium and WebKit tests pass;
- static requests never target the Agent API;
- no source or prepared GLB exists under `dist/assets/`.

- [ ] **Step 6: Commit**

```bash
git add scripts/copy-demo-assets.mjs playwright.config.ts e2e package.json package-lock.json webpack.config.cjs README.md
git commit -m "feat: add static agent console demo"
```

---

## Final Verification

- [ ] Run `npm run verify`.
- [ ] Run `npm run build:demo`.
- [ ] Run `npm run test:e2e`.
- [ ] Confirm `dist/assets/wastewater-plant/tiled/tileset.json` exists.
- [ ] Confirm `dist/assets/wastewater-plant/source` does not exist.
- [ ] Confirm `dist/assets/wastewater-plant/prepared` does not exist.
- [ ] Confirm no configured API key appears in any `dist/` file.
- [ ] Start the normal application and manually verify 3D orbit, zoom, selection,
  collision-free panel layout, scripted overview, device focus, and clear.
- [ ] Start the demo build from a nested path and manually repeat the same flows.
- [ ] Run `git status --short` and confirm the worktree is clean.

## Related Documents

- `ICE3-AGENT-IDX-001` — [Documentation index](../README.md)
- `ICE3-AGENT-SPEC-001` — [Console design](../specs/2026-10-28-ice3-agent-console-design.md)

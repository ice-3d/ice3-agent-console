# ICE3 Agent Console 污水处理厂专属演示改造实施计划

> Document ID: ICE3-AGENT-PLAN-002
>
> Status: Implemented
>
> Owner: ICE3 Agent Console maintainers

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**目标：** 让所有内置 Agent 演示只使用虚构市政污水处理厂，同时明确记录其它合规 3D
模型的接入方法。

**架构：** 在 `shared/` 中建立唯一的虚构演示资产 identity，供浏览器本地剧本和服务端
脚本 Agent 共用。应用默认资产、剧本、设备清单和测试继续固定指向
`ice3-virtual-wwtp`；其它模型作为独立部署配置处理，不成为内置演示切换项。

**技术栈：** Node.js 24.22.1 LTS、TypeScript 7、native Node test、webpack 5 和
Playwright。

**规格：** [仓库规则](../../AGENTS.md)、[应用设计](../specs/2026-10-28-ice3-agent-console-design.md)。

## 全局约束

- 内置 autoplay、快捷操作、脚本 Agent、服务端脚本和 E2E 只使用虚构污水处理厂。
- 不得加入真实客户模型、派生模型、截图或提取纹理。
- 其它模型必须由 Toolchain 预先处理，不在浏览器运行时转换。
- 设备 Selection ID 必须与 GLB 和 equipment manifest 一致。
- Node.js 版本固定为 `24.22.1`，Git author 和 committer 为 `damoqiongqiu`。
- 文档中不得出现竞品、厂商或未批准商业产品名称。

## 审查重点

- 剧本误指向非污水处理厂 identity：本地和服务端 Agent 必须使用同一
  `ice3-virtual-wwtp` 前缀。
- 设备清单与剧本漂移：每个内置 `focus_equipment` 目标必须存在于默认 manifest。
- 其它模型说明遗漏设备业务元数据：文档必须同时覆盖 Tileset 与 `equipment.json`。
- 自定义模型混入默认静态构建：默认 `build:demo` 仍只发布虚构污水处理厂。
- Runtime 执行模型转换：文档必须把 source conversion 和 partition 放在 Toolchain。

---

### Task 1：固定演示资产 identity

**Files:**

- Create: `shared/demo-asset.ts`
- Create: `tests/demo-asset.test.ts`
- Modify: `shared/scenarios.ts`
- Modify: `server/agents/scripted.ts`
- Test: `tests/scenario-library.test.ts`
- Test: `tests/scripted-agent.test.ts`

**Interfaces:**

- Produces: `DEMO_ASSET_ID: string`
- Produces: `demoEquipmentSelectionId(tag: string): string`

- [x] **步骤 1：编写失败测试**

```ts
import { expect } from '#test-expect';
import { test } from 'node:test';
import {
  DEMO_ASSET_ID,
  demoEquipmentSelectionId,
} from '../shared/demo-asset.js';

test('defines the synthetic wastewater demo identity once', () => {
  expect(DEMO_ASSET_ID).toBe('ice3-virtual-wwtp');
  expect(demoEquipmentSelectionId('AE-101'))
    .toBe('ice3-virtual-wwtp/equipment/AE-101');
});
```

- [x] **步骤 2：确认测试因缺少 module 而失败**

运行：`npm test -- tests/demo-asset.test.ts`

- [x] **步骤 3：实现最小共享 identity**

`shared/demo-asset.ts` 导出 `DEMO_ASSET_ID = 'ice3-virtual-wwtp'`，并由
`demoEquipmentSelectionId(tag)` 统一拼接 `/equipment/<tag>`。

- [x] **步骤 4：迁移脚本 Agent**

`shared/scenarios.ts` 的 equipment helper 和 `server/agents/scripted.ts` 的七个
Selection 常量都改用 `demoEquipmentSelectionId()`。

- [x] **步骤 5：增加默认 manifest 覆盖测试**

遍历全部 `SCRIPTED_SCENARIOS` 的 `focus_equipment` 参数，断言 `selectionId` 以
`${DEMO_ASSET_ID}/equipment/` 开头，并存在于默认 `equipment.json`。

- [x] **步骤 6：运行相关测试**

运行：`npm test -- tests/demo-asset.test.ts tests/scenario-library.test.ts tests/scripted-agent.test.ts`

预期：PASS。

### Task 2：记录其它模型接入方法

**Files:**

- Create: `docs/guides/other-models.md`
- Modify: `README.md`
- Modify: `docs/README.md`
- Modify: `docs/guides/local-development.md`
- Modify: `docs/guides/static-deployment.md`
- Modify: `docs/specs/2026-10-28-ice3-agent-console-design.md`

**Interfaces:**

- Consumes: Toolchain `partition` 输出目录和 equipment manifest。
- Produces: 从 source model 到 Agent Console Scene 的可执行接入说明。

- [x] **步骤 1：编写接入指南**

说明输入要求、Toolchain 预处理、目录布局、equipment manifest schema、Selection ID
一致性、Scene 配置、业务剧本适配、开发验证和静态部署。默认示例必须保持
`ice3-virtual-wwtp`。

- [x] **步骤 2：补充入口和关联链接**

README、文档索引、本地开发和静态部署都必须链接新指南，并明确“Real-Model”指 AI
接口，不是 3D 模型。

- [x] **步骤 3：运行文档门禁**

运行：`npm run docs:check`

预期：全部文档有效，引用无断链。

### Task 3：完整验证与合并

**Files:**

- Modify: `docs/plans/2026-10-29-wastewater-only-agent-demo.md`

**Interfaces:**

- Consumes: Task 1 和 Task 2 的完整交付。
- Produces: `main` 上干净的虚构污水处理厂演示。

- [x] **步骤 1：运行仓库验证**

```bash
nvm use
npm run verify
npm run build:demo
npm run test:e2e
```

- [x] **步骤 2：检查静态产物**

确认 `dist/assets/wastewater-plant/tiled/tileset.json` 存在；确认没有 source GLB、
prepared monolithic GLB、客户资源或凭据进入 `dist/` 和 Git index。

- [x] **步骤 3：更新计划状态**

验证通过后把本计划 Status 改为 `Implemented`。

- [x] **步骤 4：提交并合并**

提交到 `docs/wastewater-only-demo`，通过后再合并到 `main`，并确认 author 和
committer 均为 `damoqiongqiu <damoqiongqiu@126.com>`。

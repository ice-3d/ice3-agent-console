# ICE3 Agent Console 设计

> Document ID: ICE3-AGENT-SPEC-001
>
> Status: Implemented
>
> Owner: ICE3 Agent Console maintainers
## 目标

ICE3 Agent Console 是一个独立的工业应用，将全视口 3D Scene 与对话式 Agent 结合。
3D Scene 始终是主要界面。对话面板用于控制和解释 Scene，而不是用一串消息卡片替代
Scene。

首个版本是围绕虚构市政污水处理厂的完整垂直切片：

- 加载污水处理厂 workspace 及其 LOD Asset。
- 旋转、缩放、平移、选择、聚焦和高亮 equipment。
- 回答一组规模有限且确定性的运行问题。
- 在统一 event interface 后提供 Real-Model adapter。
- 同时生成服务端构建和自包含 static demo build。

Engine、Toolchain 和 industrial semantic 保持独立。Agent Console 只消费其公开
interface，不把 Agent 行为迁入 Engine 或领域模型。

## 范围

### 首个版本

- 全屏 3D 污水处理厂舞台。
- 可折叠浮动对话面板。
- Equipment information overlay。
- 紧凑 quick-command dock。
- 默认启用 scripted Agent。
- 通过服务端配置启用 Real-Model Agent adapter。
- 使用 AG-UI event 和 Server-Sent Events 的 server transport。
- Static demo build 使用 browser-local transport。
- camera 和 equipment tool 通过公开 Scene API 实现。
- Chromium 和 WebKit 端到端覆盖。

### 暂缓

- 授权、多租户 identity 和持久化 conversation storage。
- 图表、可编辑表单、control command 和审批 workflow。
- 组合式 2D/3D 业务视图。
- 多用户协作和共享 camera session。
- 实时过程遥测。
- 从 Console 创建或编辑 3D Geometry。

## 架构

项目是单个 TypeScript package，包含四个 Runtime 边界：

```text
ice3-agent-console/
├── src/
│   ├── app/          # Application composition and lifecycle
│   ├── scene/        # ICE3 scene integration and scene commands
│   ├── view/         # Stage, chat, status, equipment card, quick actions
│   └── protocol/     # AG-UI client, reducer, and session state
├── server/
│   ├── agents/       # Scripted and real-model implementations
│   └── transport/    # HTTP endpoint, SSE encoding, and validation
├── shared/           # Names and types shared by browser and server
├── tests/
└── e2e/
```

依赖方向为：

```text
view -> protocol -> shared
app -> view + scene + protocol
scene -> public `ice3` package + shared
server -> agents + transport + shared
```

`src/scene` 是唯一允许构造或修改 Engine object 的浏览器模块。`server` 和 Agent 实现
不得导入 renderer internals 或访问 GPU resource。

## 应用组合

`src/app` 负责启动和停止：

1. 创建 PerspectiveCamera、Engine、orbit controller 和 Tileset loader。
2. 加载虚构污水处理厂 Tileset。
3. 创建 Scene controller。
4. 创建每个 session 的 event reducer 和 view。
5. 选择配置的 local 或 server Agent transport。
6. 暴露测试所需 Diagnostic，同时不暴露 Engine internals。

Disposal 按相反顺序执行，并且必须幂等。

## Scene Controller

Scene controller 将公开 `ice3` capability 转换为应用级 command。它负责：

- 当前 equipment catalog 和 metadata。
- 当前 Selection。
- camera overview 与 equipment focus。
- 临时 highlight state。
- loading 和 LOD status snapshot。
- 用户开始交互时取消 Agent 驱动的 camera movement。

首版 semantic command 为：

| Command | 输入 | 结果 |
| --- | --- | --- |
| `find_equipment` | text、tag、stage、kind 或 area | 排序后的 equipment match |
| `select_equipment` | 一个或多个 Selection ID | 更新 Selection 和 card |
| `focus_equipment` | Selection ID 和可选 framing | 选中设备并聚焦 camera |
| `highlight_equipment` | Selection ID 和可选 duration | 临时可见强调 |
| `set_camera_view` | overview、area、equipment 或 top | 动画切换 camera |
| `clear_scene_focus` | 无 | 清除 Selection/highlight 并恢复 overview |

这些名称只属于 Agent Console，不表示 ICE3 提供 AI 专用 API。

每个 command 返回结构化结果，包含 status、受影响的 Selection ID 和可安全展示的
message。无效 ID 和不可用 equipment 不修改 Scene。

## Agent Protocol

Agent Console 复用 2D 产品建立的 AG-UI event model：

- run lifecycle event。
- 流式 text message。
- tool-call start、argument、completion 和 result event。
- state snapshot 和 delta。
- application custom event。
- run error。

Tool-call name 和 custom event name 位于 `shared/contract.ts`，由 browser 和 server
共同导入。任何组件都不得重复定义这些 string literal。

Application custom event 表示非持久化 Scene intent：

- pointer 或 emphasis request。
- camera-view request。
- Scene feedback acknowledgement。

Selected equipment 和 active Scene view 等持久事实保存在 session state。

每次 Agent run 接收有边界的 context：

- 当前 selected equipment。
- 当前 camera target，以及当前是 overview 还是 focused。
- visible equipment summary。
- 最近的用户 Scene action（如有）。
- Client 提供的 conversation history。

Context 是结构化数据。Client 不把 Scene fact 拼接到用户 message 中。

## Agent 实现

两种实现都满足同一个 `AgentRun` interface，并发送相同 event type。

### Scripted Agent

首版确定性场景包括：

- 从全厂 overview 开始，依次巡游进水、厌氧、好氧、二沉池、混凝、过滤和污泥设备，
  最后回到 overview。
- 为 intake、AAO biology、secondary clarification、advanced treatment、sludge
  treatment、aeration、chemical dosing、effluent monitoring 和 emergency
  storage/return 提供分组静态巡游。
- 定位并解释指定 equipment group。
- 聚焦并高亮当前 Selection。
- 解释选中 device。
- 清除强调并恢复 overview。

实现必须具有确定性，并且不需要 network 或 credential。

### Real-Model Agent

Server 检测 model configuration 并构造 Real-Model adapter。Configuration 使用
environment variable，永不进入浏览器。

Adapter 负责：

- 发送经批准的 Scene Tool。
- 返回 client 前校验 tool call。
- 流式发送 text 和 reasoning-safe progress event。
- 跨流式 update 保持 tool-call ID。
- 在 client disconnect 时终止 provider work。
- 明确报告不可用或无效 model configuration。

Adapter 内部保持 provider-neutral。初始 transport 可以使用广泛支持的
chat-completions-compatible endpoint，但 model-specific behavior 不得进入 Scene
controller 或 view。

无法连接已配置 model 属于 error，不得静默生成 scripted response。

## Runtime 模式

行为由两个独立维度决定：

### Transport

- `server`：browser 通过 SSE 调用本地 Agent endpoint。
- `demo`：相同 scripted Agent 在 browser 内运行，不需要 backend。

普通构建默认使用 `server`，demo build 默认使用 `demo`。`?demo=1` 和 `?demo=0`
覆盖 build default。无效值回退到 build default。

### Autoplay

- 该演示的所有构建默认播放引导开场巡游。
- `?autoplay=1` 和 `?autoplay=0` 覆盖 build default。

两个维度互相独立。任何手动 conversation 或 Scene interaction 都会取消 autoplay 和
Agent 驱动的 camera movement。

引导开场巡游是一次多 event Agent run。每个 stop 流式发送讲解、选择相关 equipment，
并在下一 stop 开始前移动 camera。Tour tool 引起的 programmatic Selection 不是用户
意图，不得取消 run；pointer、keyboard 或显式用户 Selection 会取消。

## 界面

3D 舞台占据全 viewport，conversation panel 浮动在右侧边缘。

### Stage

- 黑色背景。
- 默认加载污水处理厂 view。
- 保留既有 orbit、zoom、pan、keyboard 和 picking 行为。
- Equipment focus 居中于 conversation panel 旁边或上方的未遮挡区域；camera distance
  根据 equipment Bounds 和 viewport aspect 计算，不使用固定 zoom multiplier。
- Selection 强调由 Engine 提供；选中 equipment 变化时播放短暂黄色 pulse。Pulse 以
  selected state 结束；用户接管时替换或取消。
- Reduced-motion preference 下黄色强调保持静态。
- 显示 loading、LOD 和 failure status。
- 不保留永久 equipment label 遮挡。

### Conversation Panel

- 可展开和折叠。
- 流式 assistant text。
- User message。
- 简洁 tool execution status。
- 显示 Agent mode 和 transport mode。
- 支持可访问 keyboard behavior。
- Error state 保持之前 Scene 可见。

### Equipment Overlay

Equipment card 与 conversation panel 分开显示：

- 显示名称。
- equipment tag。
- 工艺阶段。
- 区域。
- 连接数量。
- 当前 Selection 状态。

Scene 聚焦选中 equipment 时，overlay 不得遮挡该 equipment。

### Quick Command

首版提供：

- 全厂 overview。
- 定位 secondary clarifier。
- 解释 aerobic tank。
- 清除 Selection 和 focus。

Quick command 与 typed message 使用相同 Agent input path。

## Asset 与部署

开发应用可以直接从同级 `ice3-engine` 仓库读取虚构污水处理厂 Asset。本仓库的
autoplay、内置剧本、服务端脚本 Agent 和测试只针对该虚构 Asset；其它 3D 模型通过
独立的 custom deployment 配置接入，不作为默认示例切换项。

普通构建解析公开 `ice3` package，只把被引用的 Runtime Asset tree 复制到应用 output。

Demo build 自包含：

- Tileset 和 Runtime slice 使用相对 URL。
- 排除 source GLB 和仅开发使用的 intermediate file。
- 包含 browser-local Agent。
- 不需要 server 或 model credential。
- 从 repository subpath 提供服务时 output 仍可用。

Source、build script、test fixture、screenshot 或 deployment output 永不引用真实
客户 Asset。

## Error 处理

- 无效 AG-UI input 返回带结构化 issue 的 HTTP 422。
- Provider failure 发送 `RUN_ERROR`，不静默回退。
- 未知 tool 或 equipment 产生 tool error，不修改 Scene。
- Runtime Asset 缺失时显示持续且可访问的 load error。
- Model connection 丢失时保留之前完整 Scene 和 conversation。
- 用户 pointer 或 keyboard navigation 取消 Agent camera movement。
- Static demo mode 默认不尝试 network transport。

## 测试

### Unit

- Transport 和 autoplay mode 解析。
- AG-UI event reducer 顺序和 streamed text。
- Tool-call state transition。
- Scene command validation。
- Equipment query 和 metadata mapping。
- Scripted Agent 确定性。
- Model configuration 不暴露 credential。

### Integration

- 所有 scripted tool 针对只实现公开 command contract 的 Scene controller test double
  执行。
- 无效 tool 和 ID 不修改 Scene state。
- Server 发送有效 AG-UI SSE response。
- Client disconnect 终止 model request。

### End-to-end

- Server mode 加载污水处理厂并完成 overview command。
- Scripted mode 定位和聚焦指定 device。
- 选中 device 更新 equipment overlay。
- Agent highlight 可见且可清除。
- Autoplay 让位于用户 interaction。
- Static build 不发送 backend request。
- 响应式布局在桌面和窄屏下保持可用。

核心 E2E flow 在 Chromium 和 WebKit 中运行。

## 验收标准

- 应用启动时可见虚构污水处理厂。
- 默认演示不需要 model credential。
- 用户可以通过 typed command 和 quick command 定位、选择、聚焦和清除 equipment。
- 同一 Agent tool call 在 server 和 browser-local mode 中都能工作。
- 已配置 model 可以在不改变 UI 的情况下驱动同一 Scene。
- Static build 无需 backend 即可加载虚构污水处理厂和 scripted Agent。
- Engine 和 Toolchain 不因理解 Agent 概念而被修改。
- Package、browser 和 deployment test 全部通过。

## 关联文档

- `ICE3-AGENT-IDX-001` — [文档索引](../README.md)
- `ICE3-AGENT-PLAN-001` — [实施计划](../plans/2026-10-28-ice3-agent-console.md)
- `ICE3-AGENT-ARC-001` — [应用架构](../architecture.md)

# ICE3 Agent Console 架构

> Document ID: ICE3-AGENT-ARC-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## 系统上下文

Console 组合公开 Engine、Scene controller、Agent event stream 和对话界面。

```text
user or autoplay prompt
          ↓
 local transport ───── server transport ───── configured model
          ↓                     ↓
         Agent event stream / protocol reducer
          ↓
   approved scene-tool effects
          ↓
      scene controller
          ↓
       public ICE3 API
```

Scene 在多次 run 期间保持挂载。Conversation state 不会成为 Engine state。

## 组件

| 组件 | 职责 |
|---|---|
| 共享 contract | 定义六个 Scene Tool 和 custom event name |
| Protocol reducer | 将流式 model event 转换为 text 和 tool item |
| Session | 管理单次 run、cancellation、autoplay 和 tool-result update |
| Scene controller | 校验允许的 tool argument 并调用公开 ICE3 API |
| Browser Scene | 管理 camera、Selection pulse、panel Bounds 和 stage lifecycle |
| Local transport | 在浏览器中运行确定性脚本 Agent |
| Server transport | 通过 SSE 流式传输服务端输出 |
| Model adapter | 将兼容 chat-completion tool call 转换为 event stream |

## Run 生命周期

1. Prompt 携带 thread context 和可选 Scene Snapshot 启动一次 run。
2. Transport 发送 run、text、tool、custom、completion 或 error event。
3. Reducer 组装流式 text 和 tool argument。
4. 只有参数为合法 JSON 的允许 Scene Tool 才会产生 effect。
5. Scene controller 通过公开 Engine API 执行每个 effect。
6. Tool result 返回对话。
7. 手动交互或新意图会取消过时 autoplay。

## Scene 选中行为

Selection 是 semantic identity，不是屏幕坐标。Runtime 将 Selection 转换为 camera
Bounds 和短暂脉冲，随后保持 highlight。Focus target 使用未被 conversation panel 覆盖的
可见 stage 区域。

## 失败边界

- 未知 tool 永不执行。
- 格式错误的 tool argument 会展示并跳过。
- 未知 protocol event 被忽略，不破坏当前 state。
- 已配置 model 失败时返回 error，不回退到 scripted mode。
- Aborted run 释放 listener 并忽略 late event。

## 关联文档

- `ICE3-AGENT-RM-001` — [README](../README.md)
- `ICE3-AGENT-REF-001` — [Event 和 Scene Tool protocol](reference/protocol.md)
- `ICE3-AGENT-ADR-001` — [Agent 和 Scene 边界](decisions/0001-agent-scene-boundary.md)
- `ICE3-DOC-ARC-001` — [ICE3 家族架构](https://github.com/ice-3d/ice3-doc/blob/main/docs/architecture.md)

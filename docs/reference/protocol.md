# ICE3 Agent Console Protocol

> Document ID: ICE3-AGENT-REF-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## 1. Run 请求

Client 发送：

```ts
{
  threadId: string,
  runId: string,
  messages: Array<{ id: string, role: string, content: string }>,
  state?: unknown,
  context?: Array<{ description: string, value: string }>,
  resume?: Array<{ interruptId: string, status: 'resolved'|'cancelled', payload?: unknown }>
}
```

## 2. Stream Event

Server 使用 Server-Sent Events。每个 `data:` payload 是一个 JSON event。

| Event | 用途 |
|---|---|
| `RUN_STARTED` | 启动 run |
| `TEXT_MESSAGE_START` | 开始 assistant message |
| `TEXT_MESSAGE_CONTENT` | 追加 text |
| `TEXT_MESSAGE_END` | 结束 text message |
| `TOOL_CALL_START` | 开始 tool call |
| `TOOL_CALL_ARGS` | 追加 JSON argument 文本 |
| `TOOL_CALL_END` | 结束并解析 argument |
| `TOOL_CALL_RESULT` | 返回 tool output |
| `CUSTOM` | 发送 application event |
| `RUN_FINISHED` | 完成 run |
| `RUN_ERROR` | 报告 run failure |

未知 event 不修改既有 thread state。

## 3. Custom Event

| 名称 | 用途 |
|---|---|
| `ice3/anchor` | 标识叙述对应的 Scene anchor |
| `ice3/point-clear` | 表示当前视觉要点已完成 |
| `ice3/autoplay-cancelled` | 表示引导 autoplay 已取消 |

## 4. Scene Tool

### 4.1 `find_equipment`

```json
{ "query": "string", "area": "string" }
```

两个字段都是可选的，返回匹配的 equipment summary。

### 4.2 `select_equipment`

```json
{ "selectionIds": ["string"] }
```

至少需要一个 Selection ID。

### 4.3 `focus_equipment`

```json
{ "selectionId": "string" }
```

选中 equipment 并移动 camera。

### 4.4 `highlight_equipment`

```json
{ "selectionIds": ["string"], "durationMs": 1500 }
```

需要一个或多个 ID。`durationMs` 可选且不能为负。

### 4.5 `set_camera_view`

```json
{ "view": "overview" }
```

允许的 view 为 `overview`、`area`、`equipment` 和 `top`。

### 4.6 `clear_scene_focus`

```json
{}
```

清除 Selection 和 highlight，然后返回 overview。

## 5. Error 规则

- 未知 tool name 被拒绝。
- 无效或格式错误的 JSON argument 不执行。
- Tool 失败时针对其 tool-call ID 返回 error result。
- Run error 在没有有效 tool effect 时不会替换当前 Scene Selection。

## 6. 关联文档

- `ICE3-AGENT-ARC-001` — [应用架构](../architecture.md)
- `ICE3-AGENT-GUIDE-003` — [Real-Model 服务端](../guides/real-model-server.md)
- `ICE3-AGENT-ADR-001` — [Agent 和 Scene 边界](../decisions/0001-agent-scene-boundary.md)

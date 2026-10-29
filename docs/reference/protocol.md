# ICE3 Agent Console Protocol

> Document ID: ICE3-AGENT-REF-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## Run Request

The client sends:

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

## Stream Events

The server uses Server-Sent Events. Each `data:` payload is one JSON event.

| Event | Purpose |
|---|---|
| `RUN_STARTED` | Start a run |
| `TEXT_MESSAGE_START` | Begin an assistant message |
| `TEXT_MESSAGE_CONTENT` | Append text |
| `TEXT_MESSAGE_END` | Finish a text message |
| `TOOL_CALL_START` | Begin a tool call |
| `TOOL_CALL_ARGS` | Append JSON argument text |
| `TOOL_CALL_END` | Finish and parse arguments |
| `TOOL_CALL_RESULT` | Return tool output |
| `CUSTOM` | Emit an application event |
| `RUN_FINISHED` | Complete the run |
| `RUN_ERROR` | Report a run failure |

Unknown events do not alter existing thread state.

## Custom Events

| Name | Purpose |
|---|---|
| `ice3/anchor` | Identify a narrative scene anchor |
| `ice3/point-clear` | Signal that the current visual point is complete |
| `ice3/autoplay-cancelled` | Signal that guided autoplay was cancelled |

## Scene Tools

### `find_equipment`

```json
{ "query": "string", "area": "string" }
```

Both fields are optional. Returns matching equipment summaries.

### `select_equipment`

```json
{ "selectionIds": ["string"] }
```

Requires at least one selection ID.

### `focus_equipment`

```json
{ "selectionId": "string" }
```

Selects the equipment and moves the camera.

### `highlight_equipment`

```json
{ "selectionIds": ["string"], "durationMs": 1500 }
```

Requires one or more IDs. `durationMs` is optional and non-negative.

### `set_camera_view`

```json
{ "view": "overview" }
```

Allowed views are `overview`, `area`, `equipment`, and `top`.

### `clear_scene_focus`

```json
{}
```

Clears selection and highlight, then returns to the overview.

## Error Rules

- Unknown tool names are rejected.
- Invalid or malformed JSON arguments are not executed.
- A failed tool returns an error result for its tool-call ID.
- A run error does not replace an existing selected scene without a valid tool
  effect.

## Related Documents

- `ICE3-AGENT-ARC-001` — [Application architecture](../architecture.md)
- `ICE3-AGENT-GUIDE-003` — [Real-model server](../guides/real-model-server.md)
- `ICE3-AGENT-ADR-001` — [Agent and scene boundary](../decisions/0001-agent-scene-boundary.md)

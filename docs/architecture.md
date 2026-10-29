# ICE3 Agent Console Architecture

> Document ID: ICE3-AGENT-ARC-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## System Context

The console composes the public engine, a scene controller, an Agent event
stream, and a conversational interface.

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

The scene remains mounted across runs. Conversation state never becomes engine
state.

## Components

| Component | Responsibility |
|---|---|
| Shared contract | Defines the six scene tools and custom event names |
| Protocol reducer | Converts streamed model events into text and tool items |
| Session | Owns one run, cancellation, autoplay, and tool-result updates |
| Scene controller | Validates approved tool arguments and calls public ICE3 APIs |
| Browser scene | Owns camera, selection pulse, panel bounds, and stage lifecycle |
| Local transport | Runs the deterministic scripted Agent in the browser |
| Server transport | Streams server output over SSE |
| Model adapter | Converts compatible chat-completion tool calls into the event stream |

## Run Lifecycle

1. A prompt starts a run with a thread context and optional Scene Snapshot.
2. The transport emits run, text, tool, custom, completion, or error events.
3. The reducer assembles streamed text and tool arguments.
4. Only allowed scene tools with valid JSON arguments become effects.
5. The scene controller executes each effect through public engine APIs.
6. Tool results are returned to the conversation.
7. Manual interaction or a new intent cancels obsolete autoplay.

## Selected-Scene Behavior

Selection is a semantic identity, not a screen coordinate. The runtime turns a
selection into camera bounds and a short pulse followed by persistent highlight.
The focus target accounts for the visible stage area not covered by the
conversation panel.

## Failure Boundaries

- Unknown tools never execute.
- Malformed tool arguments are shown and skipped.
- Unknown protocol events are ignored without corrupting current state.
- A failed configured model produces an error and does not fall back to scripted
  mode.
- Aborted runs release listeners and ignore late events.

## Related Documents

- `ICE3-AGENT-RM-001` — [README](../README.md)
- `ICE3-AGENT-REF-001` — [Event and scene-tool protocol](reference/protocol.md)
- `ICE3-AGENT-ADR-001` — [Agent and scene boundary](decisions/0001-agent-scene-boundary.md)
- `ICE3-DOC-ARC-001` — [ICE3 family architecture](https://github.com/ice-3d/ice3-doc/blob/main/docs/architecture.md)

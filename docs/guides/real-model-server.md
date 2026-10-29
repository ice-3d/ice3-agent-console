# ICE3 Agent Console Real-Model Server

> Document ID: ICE3-AGENT-GUIDE-003
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## Intended Outcome

Connect the console to a compatible model endpoint without exposing credentials
to the browser.

## Configuration

Set all three variables:

```bash
export ICE_AGENT_MODEL_BASE_URL='https://model.example/v1'
export ICE_AGENT_MODEL_API_KEY='replace-with-your-secret'
export ICE_AGENT_MODEL_NAME='industrial-agent'
npm run dev
```

Optional server settings:

- `ICE_AGENT_PORT`, default `8099`.
- `ICE_AGENT_PACE`, default `18` milliseconds for scripted output pacing.

## Request Path

The server posts a chat-completions-compatible request containing the six
approved scene-tool definitions. It converts compatible text and tool-call
responses into the shared event stream.

## Credential Rules

- Keep the key only in server environment variables.
- Never place credentials in URL parameters, built assets, logs, or browser
  events.
- `/health` exposes mode, model name, and endpoint host only.

## Failure Behavior

If some model variables are present but others are missing, the service starts in
an invalid state and reports the missing names. If a configured endpoint fails,
the console reports an error; it does not silently run the scripted Agent.

## Related Documents

- `ICE3-AGENT-REF-001` — [Protocol](../reference/protocol.md)
- `ICE3-AGENT-ADR-002` — [Transport policy](../decisions/0002-scripted-and-real-model-transport.md)
- `ICE3-AGENT-GUIDE-001` — [Local development](local-development.md)

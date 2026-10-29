# ICE3 Agent Console Local Development

> Document ID: ICE3-AGENT-GUIDE-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## Intended Outcome

Run the web application and Agent service together and verify the scripted
conversation and scene actions.

## Prerequisites

- Node.js 24.22.1 LTS
- npm 11 or newer
- A WebGL2-capable browser

The local Agent service defaults to scripted mode when no model variables are
configured.

## Procedure

```bash
nvm use
npm install
npm run dev
```

Expected services:

- application: `http://127.0.0.1:8110/`
- Agent API: `http://127.0.0.1:8099/`
- health: `http://127.0.0.1:8099/health`

Use `?autoplay=0` to disable the opening tour while debugging.

## Focused Tests

```bash
npm run typecheck
npm test
npm run test:e2e
```

## Failure Diagnosis

| Symptom | Check |
|---|---|
| Scene does not load | Check the engine asset link and browser network errors |
| Agent service unavailable | Check port `8099` and `/health` |
| Partial model variables | Set all three model variables or none |
| Tool is visible but does not execute | Check tool name and JSON arguments in the protocol reference |
| Tour does not start | Inspect the `autoplay` URL parameter and reduced-motion behavior |

## Related Documents

- `ICE3-AGENT-RM-001` — [README](../../README.md)
- `ICE3-AGENT-GUIDE-002` — [Static deployment](static-deployment.md)
- `ICE3-AGENT-GUIDE-003` — [Real-model server](real-model-server.md)
- `ICE3-AGENT-REF-001` — [Protocol](../reference/protocol.md)

# ICE3 Agent Console Static Deployment

> Document ID: ICE3-AGENT-GUIDE-002
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## Intended Outcome

Publish a credential-free demonstration containing the application, runtime
assets, and deterministic local Agent.

## Build

```bash
nvm use
npm install
npm run build:demo
```

Preview locally:

```bash
npx http-server dist -p 8111 -c-1
```

Expected: `http://127.0.0.1:8111/` runs without the Agent service or model
credentials.

## Published Files

The static build contains:

- HTML, CSS, JavaScript, and source maps;
- the synthetic runtime `tiled/` asset tree only;
- no source GLB, prepared monolithic GLB, customer data, or credentials.

## URL Parameters

- `?autoplay=0` suppresses the opening tour.
- `?demo=1` explicitly selects browser-local transport.
- `?demo=0` selects server transport and requires a reachable service.

## Expected Result

A deployed path without a backend opens, loads the synthetic plant, and executes
all built-in scenarios using the local event stream.

## Related Documents

- `ICE3-AGENT-RM-001` — [README](../../README.md)
- `ICE3-AGENT-ARC-001` — [Architecture](../architecture.md)
- `ICE3-AGENT-ADR-002` — [Transport policy](../decisions/0002-scripted-and-real-model-transport.md)

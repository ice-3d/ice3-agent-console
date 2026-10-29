# Scripted And Real-Model Transport

> Document ID: ICE3-AGENT-ADR-002
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## Context

Static demonstrations must work without credentials, while configured
deployments may use a real model. Silent fallback between these modes can hide
misconfiguration and make demonstrations dishonest.

## Decision

The transport is selected explicitly:

- static demo builds default to browser-local scripted mode;
- server builds default to server transport;
- URL parameters can override the build default;
- all model variables absent selects the scripted server;
- partial model configuration is invalid;
- a configured model failure reports an error and does not fall back.

## Considered Alternatives

- Automatically fall back on network or model failure.
- Require credentials for every demonstration.
- Always use server transport in static builds.

These alternatives hide failures, prevent offline demos, or create deployment
coupling.

## Consequences

- Static demos are reproducible and credential-free.
- Real-model behavior is observable and failures remain visible.
- The same event protocol serves local and server transports.

## Verification

```bash
npm test -- tests/server-config.test.ts
npm test -- tests/model-client.test.ts
```

## Related Documents

- `ICE3-AGENT-GUIDE-002` — [Static deployment](../guides/static-deployment.md)
- `ICE3-AGENT-GUIDE-003` — [Real-model server](../guides/real-model-server.md)
- `ICE3-AGENT-REF-001` — [Protocol](../reference/protocol.md)

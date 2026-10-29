# Agent And Scene Boundary

> Document ID: ICE3-AGENT-ADR-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## Context

The Agent needs to inspect and operate the scene, but allowing arbitrary engine
access would couple the application to private runtime state and make behavior
unpredictable.

## Decision

The shared protocol exposes six validated scene tools. The scene controller
executes allowed tools through public `ice3` APIs. Model output cannot access
renderer internals, GPU objects, private scene nodes, or arbitrary application
functions.

## Considered Alternatives

- Give the Agent direct engine object access.
- Let the server construct scene mutations independently of the browser.
- Encode scene actions as free-form code.

These alternatives are difficult to validate, cancel, audit, and keep compatible.

## Consequences

- Tools have explicit names and argument shapes.
- The engine and industrial packages stay Agent-independent.
- New capabilities require deliberate contract changes.
- Malformed and unknown tool requests can be rejected before mutation.

## Verification

```bash
npm test -- tests
npm run test:e2e
```

## Related Documents

- `ICE3-AGENT-REF-001` — [Protocol](../reference/protocol.md)
- `ICE3-DOC-ADR-004` — [Generic semantic interfaces](https://github.com/ice-3d/ice3-doc/blob/main/docs/decisions/0004-generic-semantic-interfaces.md)

# ICE3 Agent Console Repository Rules

> Document ID: ICE3-AGENT-POL-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers
## Architecture

- The 3D stage is the primary interface and remains mounted across conversation updates.
- Browser scene integration uses only public `ice3` exports.
- Agent implementations emit a shared protocol event stream and do not import renderer or GPU internals.
- Shared tool and event names live in `shared/`; do not duplicate protocol strings.
- The scripted Agent must run without credentials.
- A configured model failure is an error, not a reason to silently run the scripted Agent.

## Delivery

- Develop on a feature branch; merge to `main` only after full verification passes.
- Every behavioral change follows RED-GREEN-REFACTOR.
- Use Node 24 LTS from `.nvmrc`.
- Do not introduce development tooling from the prohibited package families named in the workspace policy.
- Static builds must work without a backend or model credentials.
- Static output includes only the synthetic runtime asset tree.

## Naming and legal boundary

- Do not use competitor, vendor, or third-party product names in product documents, source identifiers, comments, examples, diagnostics, or commits.
- Describe comparisons with neutral category names.
- Never reference or copy real customer model assets into this repository.

## Verification

```bash
npm run verify
npm run build:demo
npm run test:e2e
```

## Related Documents

- `ICE3-AGENT-IDX-001` — [Documentation index](docs/README.md)
- `ICE3-AGENT-ARC-001` — [Application architecture](docs/architecture.md)

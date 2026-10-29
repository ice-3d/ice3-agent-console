# ICE3 Agent Console Repository Rules

> Document ID: ICE3-AGENT-POL-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## Architecture

- The 3D stage is the primary interface and remains mounted across conversation updates.
- Browser scene integration uses only public `ice3` exports.
- Conversation and Agent behavior stay in this application; they do not enter the engine or industrial core.
- Agent implementations emit protocol events and never import renderer or GPU internals.
- Shared tool and event names live in `shared/`; do not duplicate protocol strings across modules.
- The scripted Agent must run without credentials.
- A configured model failure is an error, not a reason to silently run the scripted Agent.
- Only `find_equipment` and `select_equipment` are exposed to the Agent.

## Demonstration assets

- The checked-in demonstration uses the synthetic wastewater plant.
- Do not add real customer models, derived models, screenshots, or extracted textures to this repository.
- Static builds contain only the synthetic runtime asset tree and must work without a backend or credentials.
- Before completing asset-dependent work, inspect Git status, tracked files, ignore rules, and staged content.

## Delivery

- Develop on a feature branch; merge to `main` only after full verification passes.
- Every behavioral change follows RED-GREEN-REFACTOR.
- Use Node.js 24.22.1 LTS from `.nvmrc`.
- Do not introduce development tooling that an approved ICE3 decision excludes.
- If an event, tool, asset, or protocol change crosses repositories, update the canonical change in `ice3-doc` and verify the affected consumer.

## Commit identity

- Every Git author and committer name in this repository must be `damoqiongqiu`.
- Verify the configured and recorded names before committing, merging, or pushing.

## Naming and legal boundary

- Do not use competitor, vendor, or third-party product names in product documents, source identifiers, comments, examples, diagnostics, or commits.
- Describe comparisons with neutral category names.
- Do not link to external research that exposes prohibited names.

## Verification

```bash
npm run verify
npm run build:demo
npm run test:e2e
```

## Related Documents

- `ICE3-AGENT-IDX-001` — [Documentation index](docs/README.md)
- `ICE3-AGENT-ARC-001` — [Application architecture](docs/architecture.md)

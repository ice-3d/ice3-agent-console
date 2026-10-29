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
- Use Node.js 24.22.1 LTS from `.nvmrc`.
- Do not introduce development tooling that an approved ICE3 decision excludes.
- Static builds must work without a backend or model credentials.
- Static output includes only the synthetic runtime asset tree.

## Commit identity

- Every Git author and committer name in this repository must be `damoqiongqiu`.
- Verify the configured and recorded names before committing, merging, or pushing.

## Naming and legal boundary

- Do not use competitor, vendor, or third-party product names in product documents, source identifiers, comments, examples, diagnostics, or commits.
- Describe comparisons with neutral category names.
- Do not link to external materials that expose prohibited names. Keep any necessary research outside product repositories and subject it to legal review.
- Never reference or copy real customer model assets into this repository.

## Customer asset protection

- Real customer model assets remain in a controlled local directory outside every repository.
- Original models and derived assets must not enter source, tests, examples, documentation, screenshots, logs, build output, packages, or Git history.
- Derived assets include converted models, simplified models, previews, thumbnails, extracted textures, and other identifiable content.
- Do not stage, commit, push, or upload customer assets or derivative data to any remote service.
- Tests, demos, and public builds use synthetic, sanitized, or explicitly redistributable assets.
- Before completing asset-related work, inspect Git status, tracked files, ignore rules, and staged content.

## Cross-repository contracts

- `ice3-doc` is the single source of truth for formats, metrics, budgets, compatibility rules, shared diagnostics, and other cross-project contracts.
- This repository documents its own implementation and links to the canonical contract instead of independently maintaining a complete copy.
- A contract change requires checking every consumer in the ICE3 family and passing the frozen contract or conformance tests.

## Verification

```bash
npm run verify
npm run build:demo
npm run test:e2e
```

## Related Documents

- `ICE3-AGENT-IDX-001` — [Documentation index](docs/README.md)
- `ICE3-AGENT-ARC-001` — [Application architecture](docs/architecture.md)

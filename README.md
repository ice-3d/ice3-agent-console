# ICE3 Agent Console

> Document ID: ICE3-AGENT-RM-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

ICE3 Agent Console demonstrates how a conversational Agent can operate an
industrial 3D scene through a small, validated tool surface. The default model
is a fully synthetic municipal wastewater treatment plant.

The application supports a deterministic browser-local Agent, a server-backed
scripted Agent, and an optional compatible real-model endpoint. The 3D stage
remains mounted while conversation and scene state update.

## Capabilities

| Area | Capability |
|---|---|
| Conversation | Streaming text, tool calls, run errors, and cancellation |
| Scene | Equipment discovery, selection, focus, highlight, camera views, and clear |
| Transport | Browser-local scripted mode or server-side event stream |
| Camera | Guided multi-stop tours with responsive stage framing |
| Selection | Strong yellow pulse and persistent selection |
| Presentation | Grouped built-in scenarios and quick actions |
| Deployment | Server-backed development mode and credential-free static demo |

The console is an application. It depends on public engine APIs and does not add
Agent concepts to the engine or industrial core.

## Quick Start

Requirements:

- Node.js 24 LTS or 26+
- npm 11 or newer
- A current Chromium or WebKit browser with WebGL2

```bash
git clone https://github.com/ice-3d/ice3-agent-console.git
cd ice3-agent-console
nvm use
npm install
npm run dev
```

Open `http://127.0.0.1:8110/`; the Agent service listens on
`http://127.0.0.1:8099/`. The scene starts an overview tour after loading.

## Browser-Local Demo

```bash
npm run build:demo
npx http-server dist -p 8111 -c-1
```

Open `http://127.0.0.1:8111/`. Static demo builds use the deterministic local
Agent and require no API key or server.

URL controls:

- `?demo=1` or `?demo=0` chooses local or server transport.
- `?autoplay=1` or `?autoplay=0` controls the opening tour.

Invalid values fall back to the build default.

## Real-Model Server

Configure all three variables:

```bash
export ICE_AGENT_MODEL_BASE_URL='https://model.example/v1'
export ICE_AGENT_MODEL_API_KEY='replace-with-your-secret'
export ICE_AGENT_MODEL_NAME='industrial-agent'
npm run dev
```

The key stays on the server. `/health` reports mode and endpoint host without
returning credentials. A configured but unavailable model produces an error
instead of silently switching to scripted output.

See [real-model server](docs/guides/real-model-server.md) for details.

## Scene Tools

The only scene tools exposed to the Agent are:

- `find_equipment`
- `select_equipment`
- `focus_equipment`
- `highlight_equipment`
- `set_camera_view`
- `clear_scene_focus`

Unknown tools are rejected. Malformed arguments are displayed without execution.

## Verification

```bash
npm run docs:check
npm run typecheck
npm test
npm run test:e2e
npm run verify
```

## Documentation

- [Documentation index](docs/README.md)
- [Application architecture](docs/architecture.md)
- [Local development](docs/guides/local-development.md)
- [Static deployment](docs/guides/static-deployment.md)
- [Real-model server](docs/guides/real-model-server.md)
- [Event and scene-tool protocol](docs/reference/protocol.md)
- [Architecture decisions](docs/decisions/README.md)

## AI-assisted development

This project makes substantial use of AI-assisted development. 本项目在设计和实现过程中大量使用了 AI 辅助开发。

## License

This project is licensed under the [MIT License](LICENSE).

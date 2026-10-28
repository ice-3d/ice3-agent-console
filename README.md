# ICE3 Agent Console

3D industrial scene console driven by an Agent event stream.

The default scene is a fully synthetic municipal wastewater treatment plant.
The first release provides a deterministic offline Agent, an optional real-model
server adapter, and both server-backed and static-demo builds.

```bash
nvm use
npm install
npm run dev
```

The application runs at `http://127.0.0.1:8110`; the Agent service runs at
`http://127.0.0.1:8099`.

```bash
npm run build:demo
npx http-server dist -p 8111 -c-1
```

Demo builds run the same scripted Agent entirely in the browser and do not
require the Agent service. URL overrides:

- `?demo=1` or `?demo=0` select browser-local or server transport.
- `?autoplay=1` or `?autoplay=0` control the opening walkthrough.

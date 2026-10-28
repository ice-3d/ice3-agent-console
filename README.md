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
`http://127.0.0.1:8099`. Opening the page starts the guided wastewater-plant
tour automatically after the scene becomes ready.

```bash
npm run build:demo
npx http-server dist -p 8111 -c-1
```

Demo builds run the same scripted Agent entirely in the browser and do not
require the Agent service. URL overrides:

- `?demo=1` or `?demo=0` select browser-local or server transport.
- `?autoplay=1` or `?autoplay=0` control the opening walkthrough.

Normal builds default to server transport. Demo builds default to browser-local
transport. Every build starts with the guided tour; `?autoplay=0` makes the
opening quiet for debugging or focused tests. Invalid query values fall back to
the build default.

The opening tour establishes the plant overview, then moves through the inlet,
anaerobic, aerobic, secondary-clarifier, coagulation, filtration, and sludge
areas before returning to the overview. Each stop combines narration, camera
motion, and equipment selection. A mouse, keyboard, device selection, typed
message, or quick action ends the tour and hands control back to the user.

## Real-model server

Set the following environment variables before `npm run dev`:

```bash
export ICE_AGENT_MODEL_BASE_URL='https://model.example/v1'
export ICE_AGENT_MODEL_API_KEY='replace-with-your-secret'
export ICE_AGENT_MODEL_NAME='industrial-agent'
```

The server sends the six approved scene tools to a chat-completions-compatible
endpoint. The key remains on the server and is never returned by `/health` or
included in browser events. An unavailable configured model produces an error;
it does not silently fall back to scripted output.

## Static assets

The development server reads the synthetic wastewater assets from
`../ice3-engine/examples/m1/assets`. `npm run build` and `npm run build:demo`
copy only the runtime `tiled/` tree into `dist/assets/wastewater-plant/`.

Source and prepared GLBs are deliberately excluded. The runtime uses relative
URLs, so the built directory can be served below a repository path.

## Scene tools

The application-level tools are `find_equipment`, `select_equipment`,
`focus_equipment`, `highlight_equipment`, `set_camera_view`, and
`clear_scene_focus`. They are implemented by the console through public `ice3`
APIs; they are not engine APIs.

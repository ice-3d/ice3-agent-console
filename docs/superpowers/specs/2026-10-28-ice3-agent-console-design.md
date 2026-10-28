# ICE3 Agent Console Design

## Purpose

ICE3 Agent Console is an independent industrial application that combines a
full-viewport 3D scene with a conversational Agent. The 3D scene remains the
primary interface. The conversation panel controls and explains that scene
instead of replacing it with a sequence of message cards.

The first release is a complete vertical slice for the synthetic municipal
wastewater treatment plant:

- load the wastewater workspace and its LOD assets;
- orbit, zoom, pan, select, focus, and highlight equipment;
- answer a small deterministic set of operational questions;
- provide a real-model adapter behind the same event interface;
- produce both a server-backed build and a self-contained static demo build.

The engine, toolchain, and industrial semantics remain independent of this
application. The Agent Console consumes their public interfaces and does not
move Agent behavior into the engine or domain model.

## Scope

### First release

- Full-screen 3D wastewater-plant stage.
- Floating, collapsible conversation panel.
- Equipment information overlay.
- Compact quick-command dock.
- Scripted Agent enabled by default.
- Real-model Agent adapter enabled by server configuration.
- Server transport using AG-UI events and server-sent events.
- Browser-local transport for a static demo build.
- Camera and equipment tools implemented through public scene APIs.
- Chromium and WebKit end-to-end coverage.

### Deferred

- Authorization, multi-tenant identity, and persistent conversation storage.
- Charts, editable forms, control commands, and approval workflows.
- Combined 2D and 3D business views.
- Multi-user collaboration and shared camera sessions.
- Real-time process telemetry.
- Authoring or editing 3D geometry from the console.

## Architecture

The project is a single TypeScript package with four runtime boundaries:

```text
ice3-agent-console/
├── src/
│   ├── app/          # Application composition and lifecycle
│   ├── scene/        # ICE3 scene integration and scene commands
│   ├── view/         # Stage, chat, status, equipment card, quick actions
│   └── protocol/     # AG-UI client, reducer, and session state
├── server/
│   ├── agents/       # Scripted and real-model implementations
│   └── transport/    # HTTP endpoint, SSE encoding, and validation
├── shared/           # Names and types shared by browser and server
├── tests/
└── e2e/
```

The dependency direction is:

```text
view -> protocol -> shared
app -> view + scene + protocol
scene -> public `ice3` package + shared
server -> agents + transport + shared
```

`src/scene` is the only browser module permitted to construct or mutate engine
objects. `server` and Agent implementations must not import renderer internals
or access GPU resources.

## Application Composition

`src/app` owns startup and shutdown:

1. create the perspective camera, engine, orbit controller, and tileset loader;
2. load the synthetic wastewater tileset;
3. create the scene controller;
4. create the per-session event reducer and view;
5. select the configured local or server Agent transport;
6. expose diagnostics needed by tests without exposing engine internals.

Disposal reverses the process and must be idempotent.

## Scene Controller

The scene controller adapts public `ice3` capabilities into application-level
commands. It owns:

- current equipment catalog and metadata;
- current selection;
- camera overview and equipment focus;
- temporary highlight state;
- loading and LOD status snapshots;
- cancellation of Agent-driven camera movement when the user starts
  interacting.

The first-release semantic commands are:

| Command | Input | Result |
| --- | --- | --- |
| `find_equipment` | text, tag, stage, kind, or area | ranked equipment matches |
| `select_equipment` | one or more selection IDs | updated selection and card |
| `focus_equipment` | selection ID and optional framing | selected device and camera focus |
| `highlight_equipment` | selection IDs and optional duration | temporary visible emphasis |
| `set_camera_view` | overview, area, equipment, or top | animated camera change |
| `clear_scene_focus` | none | clear selection, highlight, and restore overview |

These names belong only to the Agent Console. They do not imply that ICE3 has
an AI-specific API.

Every command returns a structured result containing its status, affected
selection IDs, and a display-safe message. Invalid IDs and unavailable
equipment do not mutate the scene.

## Agent Protocol

The Agent Console reuses the AG-UI event model established by the 2D product:

- run lifecycle events;
- streamed text messages;
- tool-call start, argument, completion, and result events;
- state snapshots and deltas;
- application custom events;
- run errors.

Tool-call names and custom event names live in `shared/contract.ts` and are
imported by both the browser and server. No component duplicates those string
literals.

Application custom events cover transient scene intent that is not durable
state:

- pointer or emphasis requests;
- camera-view requests;
- scene-feedback acknowledgement.

Durable facts, such as the selected equipment and the active scene view, live
in session state.

Each Agent run receives bounded context:

- current selected equipment;
- current camera target and whether the view is overview or focused;
- visible equipment summary;
- latest user scene action, if any;
- conversation history supplied by the client.

The context is structured data. The client does not concatenate scene facts
into the user's message.

## Agent Implementations

Both implementations satisfy one `AgentRun` interface and emit the same event
types.

### Scripted Agent

The deterministic first-release scenarios are:

- play a guided opening tour from the full-plant overview through inlet,
  anaerobic, aerobic, secondary-clarifier, coagulation, filtration, and sludge
  equipment before returning to the overview;
- provide grouped static tours for intake, AAO biology, secondary clarification,
  advanced treatment, sludge treatment, aeration, chemical dosing, effluent
  monitoring, and emergency storage/return;
- locate and explain a named equipment group;
- focus and highlight the current selection;
- explain the selected device;
- clear emphasis and restore overview.

The implementation must be deterministic and require no network or
credentials.

### Real-Model Agent

The server detects model configuration and constructs a real-model adapter.
Configuration uses environment variables and never reaches the browser.

The adapter:

- sends the approved scene tools;
- validates tool calls before returning them to the client;
- streams text and reasoning-safe progress events;
- preserves tool-call IDs across streaming updates;
- aborts provider work when the client disconnects;
- reports unavailable or invalid model configuration explicitly.

The adapter is provider-neutral internally. The initial transport may use a
widely supported chat-completions-compatible endpoint, but no model-specific
behavior may enter the scene controller or view.

Failure to reach a configured model is an error. It must not silently produce
the scripted response.

## Runtime Modes

Two independent axes determine behavior:

### Transport

- `server`: browser calls the local Agent endpoint over SSE.
- `demo`: the same scripted Agent runs in the browser with no backend.

Normal builds default to `server`. Demo builds default to `demo`.
`?demo=1` and `?demo=0` override the build default. Invalid values fall back to
the build default.

### Autoplay

- All builds of this demonstration default to the guided opening tour.
- `?autoplay=1` and `?autoplay=0` override the build default.

The two axes are independent. Any manual conversation or scene interaction
cancels autoplay and Agent-driven camera motion.

The guided opening tour is a multi-event Agent run. Every stop streams narration,
selects the relevant equipment, and moves the camera before the next stop starts.
Programmatic selections caused by tour tools are not user intent and must not
cancel the run; pointer, keyboard, or explicit user selection does cancel it.

## Interface

The 3D stage occupies the full viewport. The conversation panel floats over the
right edge.

### Stage

- black background;
- wastewater-plant view loaded by default;
- existing orbit, zoom, pan, keyboard, and picking behavior;
- equipment focus is centered in the unobscured stage region beside or above
  the conversation panel, with camera distance derived from the equipment
  bounds and viewport aspect rather than a fixed zoom multiplier;
- selection emphasis supplied by the engine, including a short yellow pulse
  whenever the selected equipment changes; the pulse finishes in the selected
  state and is replaced or cancelled when the user takes control;
- reduced-motion preferences keep the yellow emphasis static;
- loading, LOD, and failure status;
- no permanent equipment label clutter.

### Conversation Panel

- expandable and collapsible;
- streamed assistant text;
- user messages;
- concise tool execution status;
- visible Agent mode and transport mode;
- accessible keyboard behavior;
- error states that keep the previous scene visible.

### Equipment Overlay

The equipment card appears separately from the conversation panel and shows:

- display name;
- equipment tag;
- process stage;
- area;
- connection count;
- current selection state.

It must not cover the selected equipment when the scene focuses on it.

### Quick Commands

The first release exposes:

- full-plant overview;
- locate secondary clarifier;
- explain aerobic tank;
- clear selection and focus.

Quick commands use the same Agent input path as typed messages.

## Assets and Deployment

The development application may read the synthetic wastewater assets directly
from the sibling `ice3-engine` repository.

Normal builds resolve the public `ice3` package and copy only the referenced
runtime asset tree into the application output.

Demo builds are self-contained:

- Tileset and runtime slices use relative URLs;
- source GLBs and development-only intermediate files are excluded;
- the browser-local Agent is included;
- no server or model credentials are required;
- output works when served from a repository subpath.

Real customer assets must never be referenced by source, build scripts, test
fixtures, screenshots, or deployment output.

## Error Handling

- Invalid AG-UI input returns HTTP 422 with structured issues.
- Provider failures emit `RUN_ERROR` without silently falling back.
- Unknown tools or equipment produce a tool error and no scene mutation.
- Missing runtime assets show a persistent, accessible load error.
- Lost model connections preserve the complete prior scene and conversation.
- User pointer or keyboard navigation cancels Agent camera motion.
- Static demo mode does not attempt network transport by default.

## Testing

### Unit

- transport and autoplay mode resolution;
- AG-UI event reducer ordering and streamed text;
- tool-call state transitions;
- scene command validation;
- equipment query and metadata mapping;
- scripted Agent determinism;
- model configuration without exposing credentials.

### Integration

- all scripted tools execute against a scene-controller test double that
  implements only the public command contract;
- invalid tools and IDs leave scene state unchanged;
- server emits valid AG-UI SSE responses;
- client disconnect aborts a model request.

### End-to-end

- server mode loads the wastewater plant and completes an overview command;
- scripted mode locates and focuses a named device;
- selecting a device updates the equipment overlay;
- Agent highlight is visible and can be cleared;
- autoplay yields to user interaction;
- static build runs without backend requests;
- responsive layout remains usable at desktop and narrow widths.

Core E2E flows run in Chromium and WebKit.

## Acceptance Criteria

- The application starts with the synthetic wastewater plant visible.
- No model credential is needed for the default demonstration.
- A user can locate, select, focus, and clear equipment through both typed and
  quick commands.
- The same Agent tool calls work in server and browser-local modes.
- A configured model can drive the same scene without UI changes.
- The static build loads the 3D plant and scripted Agent without a backend.
- The engine and toolchain are not modified to understand Agent concepts.
- All package, browser, and deployment tests pass.

import {
  ICE3,
  ICEOrbitController,
  ICEPerspectiveCamera,
  ICETilesetLoader,
  type ICEGeometryBounds,
  type ICETilesetHandle,
} from 'ice3';
import type {
  CameraView,
  SceneCommand,
  SceneCommandResult,
  SceneSnapshot,
} from '../../shared/scene.js';
import { resolveWastewaterAssetUrl } from './asset-url.js';
import { moveCamera, type CameraPose } from './camera-controller.js';
import { SceneCommandExecutor } from './controller.js';
import type {
  EquipmentRecord,
  ICEGeometryBoundsLike,
  SceneController,
} from './types.js';
import {
  frameEquipment,
  type ScreenRect,
} from './focus-framing.js';

interface BrowserSceneOptions {
  readonly stage: HTMLElement;
  readonly assetBaseUri?: string;
  readonly visibleViewport?: () => ScreenRect;
  readonly onSelection?: (ids: readonly string[]) => void;
  readonly onUserCameraIntent?: () => void;
}

interface EquipmentManifest {
  readonly equipment: readonly {
    readonly selectionId: string;
    readonly tag: string;
    readonly name: string;
    readonly stage: string;
    readonly area: string;
    readonly connections: readonly string[];
    readonly bounds: ICEGeometryBoundsLike;
  }[];
}

function center(bounds: ICEGeometryBoundsLike): readonly [number, number, number] {
  return [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  ];
}

function radius(bounds: ICEGeometryBoundsLike): number {
  return Math.max(
    1,
    Math.hypot(
      bounds.max[0] - bounds.min[0],
      bounds.max[1] - bounds.min[1],
      bounds.max[2] - bounds.min[2],
    ) / 2,
  );
}

export async function createSceneController(
  options: BrowserSceneOptions,
): Promise<SceneController> {
  const assetBaseUri = options.assetBaseUri ?? document.baseURI;
  const manifestResponse = await fetch(new URL(
    'assets/wastewater-plant/equipment.json',
    assetBaseUri,
  ));
  if (!manifestResponse.ok) {
    throw new Error(
      `ICE3_EQUIPMENT_MANIFEST_INVALID: HTTP ${manifestResponse.status}`,
    );
  }
  const manifest = await manifestResponse.json() as EquipmentManifest;
  const catalogRecords = Object.freeze(
    manifest.equipment.map((record) => Object.freeze({
      selectionId: record.selectionId,
      name: record.name,
      bounds: record.bounds,
      metadata: Object.freeze({
        equipmentTag: record.tag,
        processStage: record.stage,
        area: record.area,
        connections: record.connections,
      }),
    })),
  );

  const engine = new ICE3().init(options.stage);
  engine.setBackgroundColor('#000000');
  const camera = new ICEPerspectiveCamera({
    id: 'agent-console-camera',
    fov: 45,
    near: 0.1,
    far: 1000,
    position: [1, 1, 1],
    target: [0, 0, 0],
  });
  const loader = new ICETilesetLoader(engine, { camera });
  const handle: ICETilesetHandle = await loader.open(
    resolveWastewaterAssetUrl(assetBaseUri),
  );
  let orbit = new ICEOrbitController(engine, camera).start();
  engine.setScene(handle.scene).setCamera(camera).start();

  const overviewCenter = center(handle.bounds);
  const overviewRadius = radius(handle.bounds);
  const overview: CameraPose = {
    target: overviewCenter,
    position: [
      overviewCenter[0] + overviewRadius * 0.75,
      overviewCenter[1] + overviewRadius * 0.65,
      overviewCenter[2] + overviewRadius * 0.95,
    ],
  };
  camera.setPosition(overview.position).setTarget(overview.target);

  let motion: AbortController | null = null;
  let programmaticSelectionDepth = 0;
  let view: CameraView = 'overview';
  const selectionListeners = new Set<(ids: readonly string[]) => void>();
  const intentListeners = new Set<() => void>();
  let disposed = false;

  const animate = async (destination: CameraPose): Promise<void> => {
    motion?.abort();
    const controller = new AbortController();
    motion = controller;
    await moveCamera(camera, destination, 420, controller.signal);
    if (controller.signal.aborted) return;
    orbit.dispose();
    orbit = new ICEOrbitController(engine, camera).start();
  };

  const boundsForArea = (area: string): ICEGeometryBounds | undefined => {
    const items = catalogRecords.filter((item) => item.metadata?.area === area);
    if (items.length === 0) return undefined;
    return {
      min: [0, 1, 2].map((axis) => (
        Math.min(...items.map((item) => item.bounds.min[axis]!))
      )) as [number, number, number],
      max: [0, 1, 2].map((axis) => (
        Math.max(...items.map((item) => item.bounds.max[axis]!))
      )) as [number, number, number],
    };
  };

  const setView = async (next: CameraView): Promise<void> => {
    view = next;
    if (next === 'overview') {
      await animate(overview);
      return;
    }
    if (next === 'top') {
      await animate({
        target: overviewCenter,
        position: [
          overviewCenter[0],
          overviewCenter[1] + overviewRadius * 1.8,
          overviewCenter[2] + 0.01,
        ],
      });
    }
  };

  const port = {
    records: () => catalogRecords,
    setSelection(ids: readonly string[]): void {
      programmaticSelectionDepth += 1;
      try {
        engine.setSelection(ids);
      } finally {
        programmaticSelectionDepth -= 1;
      }
    },
    async focus(bounds: ICEGeometryBoundsLike): Promise<void> {
      view = 'equipment';
      engine.requestRender('agent-focus');
      const viewport = {
        width: Math.max(1, options.stage.clientWidth),
        height: Math.max(1, options.stage.clientHeight),
      };
      await animate(frameEquipment(bounds, {
        viewport,
        visible: options.visibleViewport?.() ?? {
          x: 0,
          y: 0,
          ...viewport,
        },
        fovDegrees: camera.fov,
      }));
    },
    async setView(next: CameraView): Promise<void> {
      await setView(next);
    },
    snapshot(): SceneSnapshot {
      return {
        selectedIds: engine.getSelection(),
        view,
        cameraPosition: camera.getPosition().toArray(),
        cameraTarget: camera.getTarget().toArray(),
      };
    },
  };
  const executor = new SceneCommandExecutor(port);
  const cancelAgentMotion = (): void => {
    motion?.abort();
    motion = null;
    for (const listener of intentListeners) listener();
    options.onUserCameraIntent?.();
  };
  const onSelection = (event: {
    readonly param?: { readonly selection?: readonly string[] };
  }): void => {
    if (programmaticSelectionDepth > 0) return;
    const ids = event.param?.selection ?? [];
    for (const listener of selectionListeners) listener(ids);
    options.onSelection?.(ids);
  };
  engine.on<{
    readonly selection: readonly string[];
  }>('SELECTION_CHANGE', onSelection);
  engine.on('POINTER_DOWN', cancelAgentMotion);
  engine.on<{ readonly event?: { readonly code?: string } }>(
    'KEY_DOWN',
    (event) => {
      if (/^(Key[WASD]|Arrow(Up|Down|Left|Right))$/.test(
        event.param?.event?.code ?? '',
      )) {
        cancelAgentMotion();
      }
    },
  );

  return {
    records: port.records,
    setSelection: port.setSelection,
    focus: port.focus,
    setView: port.setView,
    snapshot: port.snapshot,
    execute(command: SceneCommand): Promise<SceneCommandResult> {
      return executor.execute(command);
    },
    onSelection(listener) {
      selectionListeners.add(listener);
      return () => selectionListeners.delete(listener);
    },
    onUserCameraIntent(listener) {
      intentListeners.add(listener);
      return () => intentListeners.delete(listener);
    },
    async whenReady(): Promise<void> {
      await handle.whenReady();
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      motion?.abort();
      orbit.dispose();
      handle.dispose();
    },
  };
}

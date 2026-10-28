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

interface BrowserSceneOptions {
  readonly stage: HTMLElement;
  readonly assetBaseUri?: string;
  readonly onSelection?: (ids: readonly string[]) => void;
  readonly onUserCameraIntent?: () => void;
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
    resolveWastewaterAssetUrl(options.assetBaseUri ?? document.baseURI),
  );
  const orbit = new ICEOrbitController(engine, camera).start();
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
  let view: CameraView = 'overview';
  const selectionListeners = new Set<(ids: readonly string[]) => void>();
  const intentListeners = new Set<() => void>();
  let disposed = false;

  const metadataRecords = (): readonly EquipmentRecord[] => (
    engine.queryScene().flatMap((item) => {
      const node = engine.findBySelectionId(item.selectionId);
      if (!node) return [];
      return [{
        selectionId: item.selectionId,
        name: item.name,
        metadata: node.metadata,
        bounds: item.bounds,
      }];
    })
  );

  const animate = async (destination: CameraPose): Promise<void> => {
    motion?.abort();
    motion = new AbortController();
    await moveCamera(camera, destination, 420, motion.signal);
  };

  const boundsForArea = (area: string): ICEGeometryBounds | undefined => {
    const items = metadataRecords().filter((item) => item.metadata?.area === area);
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
    records: metadataRecords,
    setSelection(ids: readonly string[]): void {
      engine.setSelection(ids);
    },
    async focus(bounds: ICEGeometryBoundsLike): Promise<void> {
      const target = center(bounds);
      const distance = radius(bounds) * 2.2;
      view = 'equipment';
      engine.requestRender('agent-focus');
      await animate({
        target,
        position: [
          target[0] + distance * 0.6,
          target[1] + distance * 0.45,
          target[2] + distance * 0.75,
        ],
      });
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

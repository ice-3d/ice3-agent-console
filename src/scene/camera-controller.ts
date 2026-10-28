import type { ICEPerspectiveCamera } from 'ice3';

export interface CameraPose {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

function ease(t: number): number {
  return 1 - (1 - t) ** 3;
}

export async function moveCamera(
  camera: ICEPerspectiveCamera,
  destination: CameraPose,
  durationMs: number,
  signal: AbortSignal,
): Promise<void> {
  const startPosition = camera.getPosition().toArray();
  const startTarget = camera.getTarget().toArray();
  const startedAt = performance.now();
  if (durationMs <= 0) {
    camera.setPosition(destination.position).setTarget(destination.target);
    return;
  }
  while (!signal.aborted) {
    const t = Math.min(1, (performance.now() - startedAt) / durationMs);
    const amount = ease(t);
    camera
      .setPosition([
        startPosition[0] + (destination.position[0] - startPosition[0]) * amount,
        startPosition[1] + (destination.position[1] - startPosition[1]) * amount,
        startPosition[2] + (destination.position[2] - startPosition[2]) * amount,
      ])
      .setTarget([
        startTarget[0] + (destination.target[0] - startTarget[0]) * amount,
        startTarget[1] + (destination.target[1] - startTarget[1]) * amount,
        startTarget[2] + (destination.target[2] - startTarget[2]) * amount,
      ]);
    if (t >= 1) return;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

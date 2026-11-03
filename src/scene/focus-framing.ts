import type { CameraPose } from './camera-controller.js';
import type { ICEGeometryBoundsLike } from './types.js';

export interface ScreenRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface FocusFramingOptions {
  readonly viewport: Readonly<{ width: number; height: number }>;
  readonly visible: ScreenRect;
  readonly fovDegrees: number;
  readonly fillRatio?: number;
}

type Vec3 = readonly [number, number, number];

export interface FramedCameraPose extends CameraPose {
  readonly projectionOffset: readonly [number, number];
}

export function resolveVisibleViewport(
  viewport: ScreenRect,
  overlay?: ScreenRect,
): ScreenRect {
  if (!overlay) return viewport;
  const localOverlayX = overlay.x - viewport.x;
  const localOverlayY = overlay.y - viewport.y;
  if (
    overlay.height >= viewport.height * 0.8
    && localOverlayX > 0
    && localOverlayX < viewport.width
  ) {
    return {
      x: viewport.x,
      y: viewport.y,
      width: localOverlayX,
      height: viewport.height,
    };
  }
  if (
    overlay.width >= viewport.width * 0.8
    && localOverlayY > 0
    && localOverlayY < viewport.height
  ) {
    return {
      x: viewport.x,
      y: viewport.y,
      width: viewport.width,
      height: localOverlayY,
    };
  }
  return viewport;
}

function center(bounds: ICEGeometryBoundsLike): Vec3 {
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

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(...vector);
  return length > 0
    ? [vector[0] / length, vector[1] / length, vector[2] / length]
    : [0, 0, 1];
}

function advance(
  vector: Vec3,
  direction: Vec3,
  amount: number,
): Vec3 {
  return [
    vector[0] + direction[0] * amount,
    vector[1] + direction[1] * amount,
    vector[2] + direction[2] * amount,
  ];
}

export function frameBounds(
  bounds: ICEGeometryBoundsLike,
  options: FocusFramingOptions,
): FramedCameraPose {
  const objectCenter = center(bounds);
  const direction = normalize([0.6, 0.45, 0.75]);
  const aspect = options.viewport.width / Math.max(options.viewport.height, 1);
  const tanVertical = Math.tan(options.fovDegrees * Math.PI / 360);
  const tanHorizontal = tanVertical * aspect;
  const limitingTan = Math.min(tanVertical, tanHorizontal);
  const fillRatio = Math.min(0.8, Math.max(0.35, options.fillRatio ?? 0.55));
  const distance = radius(bounds) / Math.max(limitingTan * fillRatio, 0.001);
  const visible = {
    x: Math.max(0, Math.min(options.viewport.width, options.visible.x)),
    y: Math.max(0, Math.min(options.viewport.height, options.visible.y)),
    width: Math.max(1, options.visible.width),
    height: Math.max(1, options.visible.height),
  };
  const desiredNdcX = (
    (visible.x + visible.width / 2) / options.viewport.width
  ) * 2 - 1;
  const desiredNdcY = 1 - (
    (visible.y + visible.height / 2) / options.viewport.height
  ) * 2;
  const target = objectCenter;
  const position = advance(target, direction, distance);

  return {
    position,
    target,
    projectionOffset: [desiredNdcX, desiredNdcY],
  };
}

export function frameEquipment(
  bounds: ICEGeometryBoundsLike,
  options: FocusFramingOptions,
): FramedCameraPose {
  return frameBounds(bounds, options);
}

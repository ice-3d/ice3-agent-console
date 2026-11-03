import { ICEPerspectiveCamera } from 'ice3';
import { expect } from '#test-expect';
import { test } from 'node:test';
import {
  frameBounds,
  frameEquipment,
  resolveVisibleViewport,
} from '../src/scene/focus-framing.js';
import type { ICEGeometryBoundsLike } from '../src/scene/types.js';

const BOUNDS = {
  min: [-4, -1, -4] as const,
  max: [4, 3, 4] as const,
};

const corners = (
  bounds: ICEGeometryBoundsLike = BOUNDS,
): [number, number, number][] => {
  const result: [number, number, number][] = [];
  for (const x of [bounds.min[0], bounds.max[0]]) {
    for (const y of [bounds.min[1], bounds.max[1]]) {
      for (const z of [bounds.min[2], bounds.max[2]]) {
        result.push([x, y, z]);
      }
    }
  }
  return result;
};

test('centers an equipment focus in the desktop area left of the panel', () => {
  const viewport = { width: 1280, height: 800 };
  const visible = { x: 0, y: 0, width: 820, height: 800 };
  const pose = frameEquipment(BOUNDS, {
    viewport,
    visible,
    fovDegrees: 45,
  });
  const camera = new ICEPerspectiveCamera({
    id: 'focus-test',
    fov: 45,
    near: 0.1,
    far: 1000,
    position: pose.position,
    target: pose.target,
  });
  const point = projectWorldPoint(camera, [0, 1, 0], {
    x: 0,
    y: 0,
    ...viewport,
  });
  const projectedCorners = corners().map((corner) => (
    projectWorldPoint(camera, corner, { x: 0, y: 0, ...viewport })
  ));
  const left = Math.min(...projectedCorners.map((corner) => corner.x));
  const right = Math.max(...projectedCorners.map((corner) => corner.x));
  const top = Math.min(...projectedCorners.map((corner) => corner.y));
  const bottom = Math.max(...projectedCorners.map((corner) => corner.y));

  expect(Math.abs(point.x - 410)).toBeLessThan(24);
  expect(Math.abs(point.y - 400)).toBeLessThan(24);
  expect(right - left).toBeLessThan(visible.width * 0.8);
  expect(bottom - top).toBeLessThan(visible.height * 0.8);
});

test('frames the complete plant inside the visible viewport', () => {
  const plantBounds = {
    min: [-10, -5, -185] as const,
    max: [610, 45, 185] as const,
  };
  const viewport = { width: 1_200, height: 720 };
  const visible = { x: 0, y: 0, width: 760, height: 720 };
  const pose = frameBounds(plantBounds, {
    viewport,
    visible,
    fovDegrees: 45,
    fillRatio: 0.78,
  });
  const camera = new ICEPerspectiveCamera({
    id: 'overview-test',
    fov: 45,
    near: 0.1,
    far: 5_000,
    position: pose.position,
    target: pose.target,
  });
  const projected = corners(plantBounds).map((corner) => (
    projectWorldPoint(camera, corner, { x: 0, y: 0, ...viewport })
  ));

  expect(Math.min(...projected.map(({ x }) => x)))
    .toBeGreaterThanOrEqual(visible.x + 8);
  expect(Math.max(...projected.map(({ x }) => x)))
    .toBeLessThanOrEqual(visible.x + visible.width - 8);
  expect(Math.min(...projected.map(({ y }) => y)))
    .toBeGreaterThanOrEqual(visible.y + 8);
  expect(Math.max(...projected.map(({ y }) => y)))
    .toBeLessThanOrEqual(visible.y + visible.height - 8);
});

function projectWorldPoint(
  camera: ICEPerspectiveCamera,
  position: readonly [number, number, number],
  viewport: Readonly<{ x: number; y: number; width: number; height: number }>,
) {
  const matrix = camera.getViewProjectionMatrix(
    viewport.width / viewport.height,
  ).elements;
  const [x, y, z] = position;
  const clip = [
    matrix[0]! * x + matrix[4]! * y + matrix[8]! * z + matrix[12]!,
    matrix[1]! * x + matrix[5]! * y + matrix[9]! * z + matrix[13]!,
    matrix[2]! * x + matrix[6]! * y + matrix[10]! * z + matrix[14]!,
    matrix[3]! * x + matrix[7]! * y + matrix[11]! * z + matrix[15]!,
  ] as const;
  return {
    x: viewport.x + (clip[0] / clip[3] + 1) * viewport.width / 2,
    y: viewport.y + (1 - clip[1] / clip[3]) * viewport.height / 2,
  };
}

test('centers an equipment focus above the mobile conversation panel', () => {
  const viewport = { width: 390, height: 844 };
  const visible = { x: 0, y: 0, width: 390, height: 350 };
  const pose = frameEquipment(BOUNDS, {
    viewport,
    visible,
    fovDegrees: 45,
  });
  const camera = new ICEPerspectiveCamera({
    id: 'focus-test',
    fov: 45,
    near: 0.1,
    far: 1000,
    position: pose.position,
    target: pose.target,
  });
  const point = projectWorldPoint(camera, [0, 1, 0], {
    x: 0,
    y: 0,
    ...viewport,
  });

  expect(Math.abs(point.x - 195)).toBeLessThan(18);
  expect(Math.abs(point.y - 175)).toBeLessThan(18);
});

test('excludes a full-height desktop conversation panel', () => {
  const visible = resolveVisibleViewport(
    { x: 0, y: 0, width: 1280, height: 800 },
    { x: 840, y: 20, width: 420, height: 760 },
  );

  expect(visible).toEqual({ x: 0, y: 0, width: 840, height: 800 });
});

test('excludes a bottom conversation panel on a narrow screen', () => {
  const visible = resolveVisibleViewport(
    { x: 0, y: 0, width: 390, height: 844 },
    { x: 10, y: 470, width: 370, height: 364 },
  );

  expect(visible).toEqual({ x: 0, y: 0, width: 390, height: 470 });
});

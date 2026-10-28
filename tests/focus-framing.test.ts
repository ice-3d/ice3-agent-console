import {
  projectWorldPoint,
} from '@ice3/runtime';
import { ICEPerspectiveCamera } from 'ice3';
import { expect } from '#test-expect';
import { test } from 'node:test';
import {
  frameEquipment,
  resolveVisibleViewport,
} from '../src/scene/focus-framing.js';

const BOUNDS = {
  min: [-4, -1, -4] as const,
  max: [4, 3, 4] as const,
};

const corners = (): [number, number, number][] => {
  const result: [number, number, number][] = [];
  for (const x of [BOUNDS.min[0], BOUNDS.max[0]]) {
    for (const y of [BOUNDS.min[1], BOUNDS.max[1]]) {
      for (const z of [BOUNDS.min[2], BOUNDS.max[2]]) {
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

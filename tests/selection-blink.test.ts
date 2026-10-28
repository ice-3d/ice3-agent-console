import { expect } from '#test-expect';
import { test } from 'node:test';
import { blinkSelection } from '../src/scene/selection-blink.js';

function controlledTimers() {
  let nextId = 1;
  const tasks: Array<{
    readonly id: number;
    readonly delay: number;
    readonly callback: () => void;
    cancelled: boolean;
  }> = [];
  return {
    tasks,
    schedule(callback: () => void, delay: number): number {
      const id = nextId++;
      tasks.push({ id, delay, callback, cancelled: false });
      return id;
    },
    clear(id: unknown): void {
      const task = tasks.find((entry) => entry.id === id);
      if (task) task.cancelled = true;
    },
    runAll(): void {
      while (true) {
        const task = tasks.find((entry) => !entry.cancelled && !('ran' in entry));
        if (!task) return;
        (task as typeof task & { ran: boolean }).ran = true;
        task.callback();
      }
    },
  };
}

test('blinks six times and finishes with the selection visible', () => {
  const timers = controlledTimers();
  const writes: (readonly string[])[] = [];
  blinkSelection(['equipment:a'], {
    apply: (ids) => writes.push(ids),
    schedule: timers.schedule,
    clear: timers.clear,
    intervalMs: 160,
    rounds: 6,
  });

  timers.runAll();

  expect(writes).toEqual([
    [],
    ['equipment:a'],
    [],
    ['equipment:a'],
    [],
    ['equipment:a'],
  ]);
  expect(timers.tasks.map((task) => task.delay)).toEqual([
    160, 160, 160, 160, 160, 160,
  ]);
});

test('cancelling restores the current selection and clears pending work', () => {
  const timers = controlledTimers();
  const writes: (readonly string[])[] = [];
  const blink = blinkSelection(['equipment:a'], {
    apply: (ids) => writes.push(ids),
    schedule: timers.schedule,
    clear: timers.clear,
    intervalMs: 160,
    rounds: 6,
  });
  const first = timers.tasks[0]!;
  first.callback();
  (first as typeof first & { ran: boolean }).ran = true;

  blink.cancel();
  timers.runAll();

  expect(writes.at(-1)).toEqual(['equipment:a']);
  expect(timers.tasks.every((task) => task.cancelled)).toBe(true);
});

test('replacement can cancel without restoring the previous selection', () => {
  const timers = controlledTimers();
  const writes: (readonly string[])[] = [];
  blinkSelection(['equipment:a'], {
    apply: (ids) => writes.push(ids),
    schedule: timers.schedule,
    clear: timers.clear,
  }).cancel(false);

  expect(writes).toEqual([]);
  expect(timers.tasks.every((task) => task.cancelled)).toBe(true);
});

test('keeps the selection static when reduced motion is requested', () => {
  const timers = controlledTimers();
  const writes: (readonly string[])[] = [];
  blinkSelection(['equipment:a'], {
    apply: (ids) => writes.push(ids),
    schedule: timers.schedule,
    clear: timers.clear,
    reducedMotion: true,
  });

  expect(writes).toEqual([]);
  expect(timers.tasks).toEqual([]);
});

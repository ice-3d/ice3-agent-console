export interface SelectionBlinkHandle {
  cancel(restore?: boolean): void;
}

export interface SelectionBlinkOptions {
  readonly apply: (ids: readonly string[]) => void;
  readonly schedule?: (callback: () => void, delayMs: number) => unknown;
  readonly clear?: (handle: unknown) => void;
  readonly intervalMs?: number;
  readonly rounds?: number;
  readonly reducedMotion?: boolean;
}

const NOOP: SelectionBlinkHandle = { cancel() {} };

export function blinkSelection(
  ids: readonly string[],
  options: SelectionBlinkOptions,
): SelectionBlinkHandle {
  const selection = [...new Set(ids)];
  if (selection.length === 0 || options.reducedMotion) return NOOP;

  const intervalMs = Math.max(1, options.intervalMs ?? 160);
  const rounds = Math.max(1, Math.round(options.rounds ?? 6));
  const schedule = options.schedule ?? ((callback, delayMs) => (
    setTimeout(callback, delayMs)
  ));
  const clear = options.clear ?? ((handle) => {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  });
  const handles = new Set<unknown>();
  let active = true;
  let step = 0;

  const tick = (): void => {
    if (!active) return;
    step += 1;
    options.apply(step % 2 === 0 ? selection : []);
    if (step >= rounds) return;
    handles.add(schedule(tick, intervalMs));
  };

  handles.add(schedule(tick, intervalMs));
  return {
    cancel(restore = true) {
      if (!active) return;
      active = false;
      for (const handle of handles) clear(handle);
      handles.clear();
      if (restore) options.apply(selection);
    },
  };
}

export function applyUserSelection(
  ids: readonly string[],
  selectableIds: ReadonlySet<string>,
  apply: (ids: readonly string[]) => void,
): readonly string[] {
  const selection = [...new Set(ids)].filter((id) => selectableIds.has(id));
  apply(selection);
  return selection;
}

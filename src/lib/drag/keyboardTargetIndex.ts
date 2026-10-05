/** The parts of a keyboard event that keyboard reordering reads. A `KeyboardEvent` fits. */
export type ReorderKey = Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>;

/**
 * Where a reordering key moves an item, as the final index among the active items (the index `move()` takes):
 * `↑` / `↓` by one position, `Home` / `End` to the first / last one. The result is clamped to `0`…`lastIndex`, so at an
 * edge it can be `index` itself. Returns `undefined` for keys that don't reorder, and for any key with a modifier
 * (those stay free for the browser and assistive technologies).
 */
export function keyboardTargetIndex(event: ReorderKey, index: number, lastIndex: number): number | undefined {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return undefined;
  }

  switch (event.key) {
    case 'ArrowUp':
      return Math.max(index - 1, 0);
    case 'ArrowDown':
      return Math.min(index + 1, lastIndex);
    case 'Home':
      return 0;
    case 'End':
      return lastIndex;
    default:
      return undefined;
  }
}

import type { VerticalSpan } from './resolveDropIndex';

/** Vertical offsets that show a drag from one index to another without moving any DOM node. */
export interface DragOffsets {
  /** Offset of each item, same order as the spans. The dragged item's own offset is always 0. */
  readonly items: readonly number[];
  /** Offset of the placeholder, from the slot of the dragged item to the slot of the drop index. */
  readonly placeholder: number;
}

/**
 * Computes how far each item and the placeholder move while an item is dragged from `fromIndex` to `toIndex`.
 *
 * The items between the two indexes make room by the slot of the dragged item (its height plus the gap), so the
 * result is exact with items of different heights.
 *
 * @param spans Active items in display order, measured when the drag starts.
 * @param fromIndex Index of the dragged item in `spans`.
 * @param toIndex Drop index, among the active items (see `resolveDropIndex`).
 * @throws {RangeError} if an index is not an index of `spans`.
 */
export function dragOffsets(spans: readonly VerticalSpan[], fromIndex: number, toIndex: number): DragOffsets {
  const from = spanAt(spans, fromIndex);
  const to = spanAt(spans, toIndex);
  const first = spans[0];
  const second = spans[1];
  const gap = first && second ? second.top - first.bottom : 0;
  const slot = from.bottom - from.top + gap;

  const items = spans.map((_span, index) => {
    if (fromIndex < index && index <= toIndex) {
      return -slot;
    }
    if (toIndex <= index && index < fromIndex) {
      return slot;
    }
    return 0;
  });
  const placeholder = toIndex > fromIndex ? to.bottom - from.bottom : to.top - from.top;

  return { items, placeholder };
}

function spanAt(spans: readonly VerticalSpan[], index: number): VerticalSpan {
  const span = Number.isInteger(index) ? spans[index] : undefined;
  if (!span) {
    throw new RangeError(`Index ${String(index)} is out of range (0-${String(spans.length - 1)})`);
  }
  return span;
}

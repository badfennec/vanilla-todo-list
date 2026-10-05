/** Vertical extent of an item. A `DOMRect` fits, as long as all rects use the same origin (e.g. the list container). */
export interface VerticalSpan {
  readonly top: number;
  readonly bottom: number;
}

/**
 * Computes where a dragged item would be dropped, as the final index among the active items (the index `move()`
 * takes, see ADR-011).
 *
 * `spans` are the active items in display order, dragged item included, measured once when the drag starts. The
 * result is the number of other items whose middle is above `y`: the thresholds never move during a drag, so the
 * index can't flicker while the placeholder shifts the items on screen.
 *
 * @param y Vertical position being dragged, in the same coordinates as `spans`.
 * @param spans Active items in display order.
 * @param fromIndex Index of the dragged item in `spans`.
 * @throws {RangeError} if `fromIndex` is not an index of `spans`.
 */
export function resolveDropIndex(y: number, spans: readonly VerticalSpan[], fromIndex: number): number {
  if (!Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= spans.length) {
    throw new RangeError(`Index ${String(fromIndex)} is out of range (0-${String(spans.length - 1)})`);
  }

  let index = 0;
  spans.forEach((span, spanIndex) => {
    if (spanIndex !== fromIndex && (span.top + span.bottom) / 2 < y) {
      index++;
    }
  });

  return index;
}

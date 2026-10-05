/** Height of the zone near each edge where dragging scrolls, in pixels. */
const EDGE_SIZE = 48;
/** Scroll distance per frame when the pointer is at (or past) an edge, in pixels. */
const MAX_SPEED = 16;

/**
 * Scroll speed for a pointer at `y` in a scroll area whose visible part spans `top`…`bottom` (all in viewport
 * coordinates): negative near the top edge, positive near the bottom edge, 0 elsewhere. The speed grows linearly from
 * 0 at the inner border of the edge zone to `MAX_SPEED` at the edge, and stays at the maximum past it.
 */
export function autoScrollSpeed(y: number, top: number, bottom: number): number {
  // Small areas get smaller zones, so the middle third never scrolls.
  const edge = Math.min(EDGE_SIZE, (bottom - top) / 3);
  if (edge <= 0) {
    return 0;
  }

  if (y < top + edge) {
    return -MAX_SPEED * Math.min(1, (top + edge - y) / edge);
  }
  if (y > bottom - edge) {
    return MAX_SPEED * Math.min(1, (y - (bottom - edge)) / edge);
  }
  return 0;
}

/** The closest ancestor of `element` that scrolls vertically, or `null` when the page itself is what scrolls. */
export function findScrollContainer(element: Element): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (parent === document.body || parent === document.documentElement) {
      return null;
    }

    const { overflowY } = getComputedStyle(parent);
    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
  }

  return null;
}

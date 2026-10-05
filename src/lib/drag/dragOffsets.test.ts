import { describe, expect, it } from 'vitest';

import { dragOffsets } from './dragOffsets';
import type { VerticalSpan } from './resolveDropIndex';

// Four 40px items with a 10px gap: each slot is 50px.
const SPANS: VerticalSpan[] = [
  { top: 0, bottom: 40 },
  { top: 50, bottom: 90 },
  { top: 100, bottom: 140 },
  { top: 150, bottom: 190 },
];

describe('dragOffsets', () => {
  it('moves nothing while the drop index is the starting one', () => {
    expect(dragOffsets(SPANS, 1, 1)).toEqual({ items: [0, 0, 0, 0], placeholder: 0 });
  });

  it('moves the items in between up when dragging down', () => {
    expect(dragOffsets(SPANS, 0, 2)).toEqual({ items: [0, -50, -50, 0], placeholder: 100 });
  });

  it('moves the items in between down when dragging up', () => {
    expect(dragOffsets(SPANS, 3, 1)).toEqual({ items: [0, 50, 50, 0], placeholder: -100 });
  });

  it('uses the slot of the dragged item with items of different heights', () => {
    // Heights 20, 60, 40 with a 10px gap.
    const spans: VerticalSpan[] = [
      { top: 0, bottom: 20 },
      { top: 30, bottom: 90 },
      { top: 100, bottom: 140 },
    ];

    // The 20px item goes last: the others move up by 30, it ends at the bottom of the last one.
    expect(dragOffsets(spans, 0, 2)).toEqual({ items: [0, -30, -30], placeholder: 120 });
    // The 40px item goes first: the others move down by 50, it starts at the top of the first one.
    expect(dragOffsets(spans, 2, 0)).toEqual({ items: [50, 50, 0], placeholder: -100 });
  });

  it('works with no gap and with a single item', () => {
    const spans: VerticalSpan[] = [
      { top: 0, bottom: 40 },
      { top: 40, bottom: 80 },
    ];

    expect(dragOffsets(spans, 0, 1)).toEqual({ items: [0, -40], placeholder: 40 });
    expect(dragOffsets([{ top: 0, bottom: 40 }], 0, 0)).toEqual({ items: [0], placeholder: 0 });
  });

  it('rejects indexes out of range', () => {
    expect(() => dragOffsets(SPANS, 4, 0)).toThrow(new RangeError('Index 4 is out of range (0-3)'));
    expect(() => dragOffsets(SPANS, 0, -1)).toThrow(new RangeError('Index -1 is out of range (0-3)'));
    expect(() => dragOffsets(SPANS, 0.5, 0)).toThrow(RangeError);
  });
});

import { describe, expect, it } from 'vitest';

import { resolveDropIndex, type VerticalSpan } from './resolveDropIndex';

// Four 40px items with a 10px gap: middles at 20, 70, 120, 170.
const SPANS: VerticalSpan[] = [
  { top: 0, bottom: 40 },
  { top: 50, bottom: 90 },
  { top: 100, bottom: 140 },
  { top: 150, bottom: 190 },
];

describe('resolveDropIndex', () => {
  it('keeps the current index while no other middle is crossed', () => {
    expect(resolveDropIndex(20, SPANS, 0)).toBe(0);
    expect(resolveDropIndex(69, SPANS, 0)).toBe(0);
    expect(resolveDropIndex(100, SPANS, 1)).toBe(1);
  });

  it('moves down once the middle of the next item is passed', () => {
    expect(resolveDropIndex(71, SPANS, 0)).toBe(1);
    expect(resolveDropIndex(121, SPANS, 0)).toBe(2);
    expect(resolveDropIndex(171, SPANS, 0)).toBe(3);
  });

  it('moves up once the middle of the previous item is passed', () => {
    expect(resolveDropIndex(119, SPANS, 3)).toBe(2);
    expect(resolveDropIndex(69, SPANS, 3)).toBe(1);
    expect(resolveDropIndex(19, SPANS, 3)).toBe(0);
  });

  it('clamps to the first and last index outside the list', () => {
    expect(resolveDropIndex(-500, SPANS, 2)).toBe(0);
    expect(resolveDropIndex(5000, SPANS, 1)).toBe(3);
  });

  it('keeps the item before an item whose middle is exactly at y', () => {
    expect(resolveDropIndex(70, SPANS, 0)).toBe(0);
  });

  it('handles items of different heights', () => {
    const spans: VerticalSpan[] = [
      { top: 0, bottom: 100 }, // middle 50
      { top: 110, bottom: 130 }, // middle 120
      { top: 140, bottom: 240 }, // middle 190
    ];

    expect(resolveDropIndex(119, spans, 2)).toBe(1);
    expect(resolveDropIndex(49, spans, 2)).toBe(0);
    expect(resolveDropIndex(189, spans, 0)).toBe(1);
    expect(resolveDropIndex(191, spans, 0)).toBe(2);
  });

  it('treats 0 as a valid coordinate and index (A5)', () => {
    const spans: VerticalSpan[] = [
      { top: -40, bottom: 0 }, // middle -20
      { top: 0, bottom: 40 }, // middle 20
    ];

    expect(resolveDropIndex(0, spans, 1)).toBe(1);
    expect(resolveDropIndex(0, spans, 0)).toBe(0);
  });

  it('returns 0 for a single item', () => {
    expect(resolveDropIndex(1000, [{ top: 0, bottom: 40 }], 0)).toBe(0);
  });

  it('rejects an invalid dragged index', () => {
    expect(() => resolveDropIndex(0, SPANS, 4)).toThrow(new RangeError('Index 4 is out of range (0-3)'));
    expect(() => resolveDropIndex(0, SPANS, -1)).toThrow(RangeError);
    expect(() => resolveDropIndex(0, SPANS, 1.5)).toThrow(RangeError);
    expect(() => resolveDropIndex(0, [], 0)).toThrow(RangeError);
  });
});

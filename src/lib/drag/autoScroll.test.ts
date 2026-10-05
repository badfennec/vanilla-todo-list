import { afterEach, describe, expect, it } from 'vitest';

import { autoScrollSpeed, findScrollContainer } from './autoScroll';

describe('autoScrollSpeed', () => {
  // Visible area from 0 to 600: edge zones are 0–48 and 552–600.
  it('does not scroll outside the edge zones', () => {
    expect(autoScrollSpeed(300, 0, 600)).toBe(0);
    expect(autoScrollSpeed(48, 0, 600)).toBe(0);
    expect(autoScrollSpeed(552, 0, 600)).toBe(0);
  });

  it('scrolls up near the top edge, faster closer to it', () => {
    expect(autoScrollSpeed(24, 0, 600)).toBe(-8);
    expect(autoScrollSpeed(0, 0, 600)).toBe(-16);
  });

  it('scrolls down near the bottom edge, faster closer to it', () => {
    expect(autoScrollSpeed(576, 0, 600)).toBe(8);
    expect(autoScrollSpeed(600, 0, 600)).toBe(16);
  });

  it('keeps the maximum speed past the edges', () => {
    expect(autoScrollSpeed(-100, 0, 600)).toBe(-16);
    expect(autoScrollSpeed(900, 0, 600)).toBe(16);
  });

  it('works with an area that does not start at 0', () => {
    expect(autoScrollSpeed(124, 100, 400)).toBe(-8);
    expect(autoScrollSpeed(250, 100, 400)).toBe(0);
  });

  it('shrinks the edge zones of small areas, keeping a still middle third', () => {
    // 90px high: 30px zones.
    expect(autoScrollSpeed(45, 0, 90)).toBe(0);
    expect(autoScrollSpeed(15, 0, 90)).toBe(-8);
    expect(autoScrollSpeed(75, 0, 90)).toBe(8);
  });

  it('does not scroll an empty area', () => {
    expect(autoScrollSpeed(0, 0, 0)).toBe(0);
    expect(autoScrollSpeed(10, 50, 20)).toBe(0);
  });
});

describe('findScrollContainer', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  function scrollable(overflowY: string, overflowing: boolean): HTMLDivElement {
    const element = document.createElement('div');
    element.style.overflowY = overflowY;
    // The test DOM has no layout: give the sizes by hand.
    Object.defineProperty(element, 'clientHeight', { value: 100 });
    Object.defineProperty(element, 'scrollHeight', { value: overflowing ? 500 : 100 });
    return element;
  }

  it('returns the closest ancestor that scrolls', () => {
    const outer = scrollable('auto', true);
    const inner = scrollable('scroll', true);
    const child = document.createElement('div');
    outer.append(inner);
    inner.append(child);
    document.body.append(outer);

    expect(findScrollContainer(child)).toBe(inner);
  });

  it('skips ancestors that do not overflow or do not allow scrolling', () => {
    const outer = scrollable('auto', true);
    const hidden = scrollable('hidden', true);
    const fitting = scrollable('auto', false);
    const child = document.createElement('div');
    outer.append(hidden);
    hidden.append(fitting);
    fitting.append(child);
    document.body.append(outer);

    expect(findScrollContainer(child)).toBe(outer);
  });

  it('returns null when only the page scrolls', () => {
    const child = document.createElement('div');
    document.body.append(child);

    expect(findScrollContainer(child)).toBeNull();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AutoScroller } from './AutoScroller';

describe('AutoScroller', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    vi.stubGlobal('innerHeight', 600);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  function pageSetup() {
    const element = document.createElement('div');
    document.body.append(element);
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    return { scroller: new AutoScroller(element), scrollBy };
  }

  it('scrolls the page every frame while the pointer is near an edge', () => {
    const { scroller, scrollBy } = pageSetup();

    scroller.update(600);
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();

    expect(scrollBy.mock.calls).toEqual([
      [0, 16],
      [0, 16],
    ]);
  });

  it('does nothing while the pointer is away from the edges', () => {
    const { scroller, scrollBy } = pageSetup();

    scroller.update(300);
    vi.advanceTimersToNextFrame();

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('follows the pointer and stops when it leaves the edge zone', () => {
    const { scroller, scrollBy } = pageSetup();

    scroller.update(0);
    vi.advanceTimersToNextFrame();
    scroller.update(24);
    vi.advanceTimersToNextFrame();
    scroller.update(300);
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();

    expect(scrollBy.mock.calls).toEqual([
      [0, -16],
      [0, -8],
    ]);
  });

  it('stops on stop()', () => {
    const { scroller, scrollBy } = pageSetup();

    scroller.update(600);
    scroller.stop();
    vi.advanceTimersToNextFrame();

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('scrolls the closest scroll container, measured on its visible part', () => {
    const container = document.createElement('div');
    container.style.overflowY = 'auto';
    // The test DOM has no layout: give the sizes by hand. The container spans 100–700, cut by the viewport at 600.
    Object.defineProperty(container, 'clientHeight', { value: 600 });
    Object.defineProperty(container, 'scrollHeight', { value: 2000 });
    container.getBoundingClientRect = () => new DOMRect(0, 100, 300, 600);
    const containerScrollBy = vi.fn();
    container.scrollBy = containerScrollBy;
    const windowScrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    const element = document.createElement('div');
    container.append(element);
    document.body.append(container);
    const scroller = new AutoScroller(element);

    scroller.update(124); // 24px inside the container's top edge
    vi.advanceTimersToNextFrame();
    scroller.update(600); // at the viewport bottom, which cuts the container
    vi.advanceTimersToNextFrame();

    expect(containerScrollBy.mock.calls).toEqual([
      [0, -8],
      [0, 16],
    ]);
    expect(windowScrollBy).not.toHaveBeenCalled();
  });
});

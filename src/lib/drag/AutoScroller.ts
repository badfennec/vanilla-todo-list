import { autoScrollSpeed, findScrollContainer } from './autoScroll';

/**
 * Scrolls the scroll container of an element (or the page) while the pointer stays near its top or bottom edge.
 * One instance lives for one drag: call `update()` with each pointer position and `stop()` at the end.
 */
export class AutoScroller {
  readonly #container: HTMLElement | null;
  #clientY = 0;
  #frame: number | undefined;

  /** @param element An element inside the area to scroll; its closest scrolling ancestor (or the page) is used. */
  constructor(element: Element) {
    this.#container = findScrollContainer(element);
  }

  /** Records the pointer position and starts scrolling if it is in an edge zone. */
  update(clientY: number): void {
    this.#clientY = clientY;
    if (this.#frame === undefined && this.#speed() !== 0) {
      this.#frame = requestAnimationFrame(this.#step);
    }
  }

  stop(): void {
    if (this.#frame !== undefined) {
      cancelAnimationFrame(this.#frame);
      this.#frame = undefined;
    }
  }

  readonly #step = (): void => {
    this.#frame = undefined;
    const speed = this.#speed();
    if (speed === 0) {
      return;
    }

    if (this.#container) {
      this.#container.scrollBy(0, speed);
    } else {
      window.scrollBy(0, speed);
    }
    this.#frame = requestAnimationFrame(this.#step);
  };

  /** Speed for the current pointer position, measured against the visible part of the container. */
  #speed(): number {
    if (!this.#container) {
      return autoScrollSpeed(this.#clientY, 0, window.innerHeight);
    }

    const rect = this.#container.getBoundingClientRect();
    return autoScrollSpeed(this.#clientY, Math.max(rect.top, 0), Math.min(rect.bottom, window.innerHeight));
  }
}

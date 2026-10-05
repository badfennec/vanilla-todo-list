import { resolveDropIndex, type VerticalSpan } from '../drag/resolveDropIndex';

export interface DragSessionOptions {
  /** Root of the list: it gets the `--dragging` modifier for the duration of the drag. */
  readonly root: HTMLElement;
  /** The active list: the dragged item is positioned inside it, and measures are relative to it. */
  readonly list: HTMLElement;
  /** Elements of the active items, in display order. */
  readonly elements: readonly HTMLElement[];
  /** Index of the dragged element in `elements`. */
  readonly fromIndex: number;
}

/**
 * Visual state of one drag in the active list: the measures taken at start, the placeholder and the drop index.
 * One instance lives for one drag, from start to `finish()`, so no drag state can outlive the drag.
 */
export class DragSession {
  readonly fromIndex: number;
  readonly #root: HTMLElement;
  readonly #list: HTMLElement;
  readonly #element: HTMLElement;
  /** The other active elements, in display order: the placeholder goes before one of them, or at the end. */
  readonly #others: readonly HTMLElement[];
  readonly #placeholder: HTMLLIElement;
  /** Active items measured at start, relative to the list (so page scroll doesn't matter). */
  readonly #spans: readonly VerticalSpan[];
  readonly #startTop: number;
  readonly #height: number;
  #index: number;

  /** @throws {RangeError} if `fromIndex` is not an index of `elements`. */
  constructor({ root, list, elements, fromIndex }: DragSessionOptions) {
    const element = elements[fromIndex];
    if (!element) {
      throw new RangeError(`Index ${String(fromIndex)} is out of range (0-${String(elements.length - 1)})`);
    }

    const listTop = list.getBoundingClientRect().top;
    const spans = elements.map((item) => {
      const rect = item.getBoundingClientRect();
      return { top: rect.top - listTop, bottom: rect.bottom - listTop };
    });
    // Same length as `elements`, so the dragged element has a span.
    const span = spans[fromIndex] as VerticalSpan;

    this.fromIndex = fromIndex;
    this.#index = fromIndex;
    this.#root = root;
    this.#list = list;
    this.#element = element;
    this.#others = elements.filter((item) => item !== element);
    this.#spans = spans;
    this.#startTop = span.top;
    this.#height = span.bottom - span.top;

    this.#placeholder = document.createElement('li');
    this.#placeholder.className = 'badfennec-todo__placeholder';
    this.#placeholder.setAttribute('aria-hidden', 'true');
    this.#placeholder.style.blockSize = `${String(this.#height)}px`;
    element.before(this.#placeholder);

    // The item leaves the flow (CSS) and stays where it was; the placeholder keeps its slot.
    element.style.top = `${String(span.top)}px`;
    element.classList.add('badfennec-todo__item--dragging');
    root.classList.add('badfennec-todo--dragging');
  }

  /** Drop index the placeholder currently shows, among the active items. */
  get index(): number {
    return this.#index;
  }

  /** Updates the drop index for the dragged item moved by `offsetY` and moves the placeholder there. */
  move(offsetY: number): void {
    // The middle of the dragged item, not the pointer: the handle is near the top of the item.
    const y = this.#startTop + offsetY + this.#height / 2;
    const index = resolveDropIndex(y, this.#spans, this.fromIndex);
    if (index === this.#index) {
      return;
    }

    this.#index = index;
    this.#list.insertBefore(this.#placeholder, this.#others[index] ?? null);
  }

  /** Removes the placeholder and the drag styles: the DOM is back as it was. Safe to call more than once. */
  finish(): void {
    this.#placeholder.remove();
    this.#element.style.top = '';
    this.#element.classList.remove('badfennec-todo__item--dragging');
    this.#root.classList.remove('badfennec-todo--dragging');
  }
}

export interface DragControllerOptions {
  /** Element that starts the drag and captures the pointer. */
  readonly handle: HTMLElement;
  /** Element translated vertically while dragging. */
  readonly element: HTMLElement;
  /**
   * Viewport top of the box the element moves with (e.g. its positioned container). Offsets are measured relative to
   * it, so the element stays under the pointer when the page scrolls during a drag. Defaults to the viewport.
   */
  readonly getReferenceTop?: () => number;
  /** Called on pointer down; returning `false` refuses the drag. */
  readonly canStart?: () => boolean;
  readonly onStart: () => void;
  /** `offsetY`: vertical pointer movement since the drag started, relative to the reference box, in pixels. */
  readonly onMove: (offsetY: number) => void;
  /** The pointer was released: the drop should be applied. */
  readonly onEnd: (offsetY: number) => void;
  /** The drag was interrupted (`pointercancel`, lost capture or Escape): nothing should change. */
  readonly onCancel: () => void;
}

interface DragState {
  readonly pointerId: number;
  /** Pointer position relative to the reference box when the drag started. */
  readonly startY: number;
  /** Last pointer position in the viewport, used again when the page scrolls without the pointer moving. */
  clientY: number;
  offsetY: number;
  /** Removes the listeners added for this drag only. */
  readonly listeners: AbortController;
}

/**
 * Turns pointer input on a handle into a vertical drag: start, move, end or cancel. Mouse, touch and pen share one
 * code path (Pointer Events); only the primary pointer with the main button starts a drag. It moves the element on
 * screen but knows nothing about drop positions.
 */
export class DragController {
  readonly #options: DragControllerOptions;
  /** State of the current drag; it exists only between start and end/cancel. */
  #drag: DragState | undefined;

  constructor(options: DragControllerOptions) {
    this.#options = options;
    this.#options.handle.addEventListener('pointerdown', this.#handlePointerDown);
  }

  /** Interrupts the current drag, if any, as if the user pressed Escape (`onCancel` is called). */
  cancel(): void {
    if (this.#drag) {
      this.#cancel();
    }
  }

  /** Removes every listener. A drag in progress is stopped without calling `onEnd` or `onCancel`. */
  destroy(): void {
    this.#stop();
    this.#options.handle.removeEventListener('pointerdown', this.#handlePointerDown);
  }

  readonly #handlePointerDown = (event: PointerEvent): void => {
    if (this.#drag || !event.isPrimary || event.button !== 0 || this.#options.canStart?.() === false) {
      return;
    }

    // Keeps the browser from selecting text or starting a native drag.
    event.preventDefault();

    const { handle } = this.#options;
    const listeners = new AbortController();
    const { signal } = listeners;
    this.#drag = {
      pointerId: event.pointerId,
      startY: event.clientY - this.#referenceTop(),
      clientY: event.clientY,
      offsetY: 0,
      listeners,
    };

    // With capture, move/up/cancel reach the handle even when the pointer leaves it.
    handle.setPointerCapture(event.pointerId);
    handle.addEventListener('pointermove', this.#handlePointerMove, { signal });
    handle.addEventListener('pointerup', this.#handlePointerUp, { signal });
    handle.addEventListener('pointercancel', this.#handleInterrupt, { signal });
    handle.addEventListener('lostpointercapture', this.#handleInterrupt, { signal });
    document.addEventListener('keydown', this.#handleKeyDown, { signal });
    // Scroll events don't bubble: capturing on the document catches the page and any scrolling ancestor.
    document.addEventListener('scroll', this.#handleScroll, { signal, capture: true, passive: true });

    this.#options.onStart();
  };

  readonly #handlePointerMove = (event: PointerEvent): void => {
    const drag = this.#drag;
    if (drag?.pointerId !== event.pointerId) {
      return;
    }

    drag.clientY = event.clientY;
    this.#move(drag);
  };

  readonly #handleScroll = (): void => {
    if (this.#drag) {
      this.#move(this.#drag);
    }
  };

  readonly #handlePointerUp = (event: PointerEvent): void => {
    const drag = this.#drag;
    if (drag?.pointerId !== event.pointerId) {
      return;
    }

    this.#stop();
    this.#options.onEnd(drag.offsetY);
  };

  readonly #handleInterrupt = (event: PointerEvent): void => {
    if (this.#drag?.pointerId !== event.pointerId) {
      return;
    }

    this.#cancel();
  };

  readonly #handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.#cancel();
    }
  };

  #move(drag: DragState): void {
    drag.offsetY = drag.clientY - this.#referenceTop() - drag.startY;
    this.#options.element.style.transform = `translate3d(0, ${String(drag.offsetY)}px, 0)`;
    this.#options.onMove(drag.offsetY);
  }

  #referenceTop(): number {
    return this.#options.getReferenceTop?.() ?? 0;
  }

  #cancel(): void {
    this.#stop();
    this.#options.onCancel();
  }

  /** Resets the drag state: listeners, pointer capture and transform. Safe to call when no drag is in progress. */
  #stop(): void {
    const drag = this.#drag;
    if (!drag) {
      return;
    }

    // Cleared first, so the `lostpointercapture` fired by the release below is ignored.
    this.#drag = undefined;
    drag.listeners.abort();

    const { handle, element } = this.#options;
    if (handle.hasPointerCapture(drag.pointerId)) {
      handle.releasePointerCapture(drag.pointerId);
    }
    element.style.transform = '';
  }
}

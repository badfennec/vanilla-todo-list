export interface DragControllerOptions {
  /** Element that starts the drag and captures the pointer. */
  readonly handle: HTMLElement;
  /** Element translated vertically while dragging. */
  readonly element: HTMLElement;
  /** Called on pointer down; returning `false` refuses the drag. */
  readonly canStart?: () => boolean;
  readonly onStart: () => void;
  /** `offsetY`: vertical pointer movement since the drag started, in pixels. */
  readonly onMove: (offsetY: number) => void;
  /** The pointer was released: the drop should be applied. */
  readonly onEnd: (offsetY: number) => void;
  /** The drag was interrupted (`pointercancel`, lost capture or Escape): nothing should change. */
  readonly onCancel: () => void;
}

interface DragState {
  readonly pointerId: number;
  readonly startY: number;
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
    this.#drag = { pointerId: event.pointerId, startY: event.clientY, offsetY: 0, listeners };

    // With capture, move/up/cancel reach the handle even when the pointer leaves it.
    handle.setPointerCapture(event.pointerId);
    handle.addEventListener('pointermove', this.#handlePointerMove, { signal });
    handle.addEventListener('pointerup', this.#handlePointerUp, { signal });
    handle.addEventListener('pointercancel', this.#handleInterrupt, { signal });
    handle.addEventListener('lostpointercapture', this.#handleInterrupt, { signal });
    document.addEventListener('keydown', this.#handleKeyDown, { signal });

    this.#options.onStart();
  };

  readonly #handlePointerMove = (event: PointerEvent): void => {
    const drag = this.#drag;
    if (drag?.pointerId !== event.pointerId) {
      return;
    }

    drag.offsetY = event.clientY - drag.startY;
    this.#options.element.style.transform = `translate3d(0, ${String(drag.offsetY)}px, 0)`;
    this.#options.onMove(drag.offsetY);
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

import { afterEach, describe, expect, it, vi } from 'vitest';

import { DragController, type DragControllerOptions } from './DragController';

function setup(overrides: Partial<DragControllerOptions> = {}) {
  const element = document.createElement('li');
  const handle = document.createElement('button');
  element.append(handle);
  document.body.append(element);

  // Pointer capture is stubbed: the test DOM doesn't track it.
  const captured = new Set<number>();
  const setPointerCapture = vi.fn((id: number) => captured.add(id));
  handle.setPointerCapture = setPointerCapture;
  handle.releasePointerCapture = vi.fn((id: number) => captured.delete(id));
  handle.hasPointerCapture = (id: number) => captured.has(id);

  const callbacks = { onStart: vi.fn(), onMove: vi.fn(), onEnd: vi.fn(), onCancel: vi.fn() };
  const controller = new DragController({ handle, element, ...callbacks, ...overrides });

  const pointer = (type: string, init: PointerEventInit = {}): PointerEvent => {
    const event = new PointerEvent(type, { pointerId: 1, isPrimary: true, button: 0, cancelable: true, ...init });
    handle.dispatchEvent(event);
    return event;
  };

  return { controller, element, handle, setPointerCapture, pointer, ...callbacks };
}

describe('DragController', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('starts a drag on primary pointer down and captures the pointer', () => {
    const { setPointerCapture, pointer, onStart } = setup();

    const event = pointer('pointerdown', { clientY: 100 });

    expect(onStart).toHaveBeenCalledOnce();
    expect(setPointerCapture).toHaveBeenCalledWith(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores secondary buttons and non-primary pointers (A4)', () => {
    const { pointer, onStart } = setup();

    pointer('pointerdown', { button: 2 });
    pointer('pointerdown', { button: 1 });
    pointer('pointerdown', { isPrimary: false });

    expect(onStart).not.toHaveBeenCalled();
  });

  it('does not start when canStart refuses', () => {
    const { pointer, onStart, setPointerCapture } = setup({ canStart: () => false });

    pointer('pointerdown');

    expect(onStart).not.toHaveBeenCalled();
    expect(setPointerCapture).not.toHaveBeenCalled();
  });

  it('reports the offset since the start and translates the element', () => {
    const { element, pointer, onMove } = setup();

    pointer('pointerdown', { clientY: 100 });
    pointer('pointermove', { clientY: 130 });
    pointer('pointermove', { clientY: 80 });

    expect(onMove.mock.calls).toEqual([[30], [-20]]);
    expect(element.style.transform).toBe('translate3d(0, -20px, 0)');
  });

  it('treats a clientY of 0 as a real position (A4, A5)', () => {
    const { pointer, onMove } = setup();

    pointer('pointerdown', { clientY: 0 });
    pointer('pointermove', { clientY: 0 });

    expect(onMove).toHaveBeenCalledExactlyOnceWith(0);
  });

  it('ignores moves before a drag and from other pointers', () => {
    const { pointer, onMove } = setup();

    pointer('pointermove', { clientY: 50 });
    pointer('pointerdown', { clientY: 100 });
    pointer('pointermove', { pointerId: 2, clientY: 200 });

    expect(onMove).not.toHaveBeenCalled();
  });

  it('ends on pointer up with the last offset and resets everything', () => {
    const { element, handle, pointer, onEnd, onCancel, onMove } = setup();

    pointer('pointerdown', { clientY: 100 });
    pointer('pointermove', { clientY: 150 });
    pointer('pointerup', { clientY: 150 });
    pointer('lostpointercapture');
    pointer('pointermove', { clientY: 300 });

    expect(onEnd).toHaveBeenCalledExactlyOnceWith(50);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onMove).toHaveBeenCalledOnce();
    expect(element.style.transform).toBe('');
    expect(handle.hasPointerCapture(1)).toBe(false);
  });

  it.each(['pointercancel', 'lostpointercapture'])('cancels on %s (A4)', (type) => {
    const { element, pointer, onEnd, onCancel } = setup();

    pointer('pointerdown', { clientY: 100 });
    pointer('pointermove', { clientY: 150 });
    pointer(type);
    pointer('pointerup');

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onEnd).not.toHaveBeenCalled();
    expect(element.style.transform).toBe('');
  });

  it('cancels on Escape', () => {
    const { handle, pointer, onCancel } = setup();

    pointer('pointerdown', { clientY: 100 });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(handle.hasPointerCapture(1)).toBe(false);
  });

  it('cancels from code, and does nothing when no drag is in progress', () => {
    const { controller, element, pointer, onCancel } = setup();

    controller.cancel();
    pointer('pointerdown', { clientY: 100 });
    pointer('pointermove', { clientY: 150 });
    controller.cancel();

    expect(onCancel).toHaveBeenCalledOnce();
    expect(element.style.transform).toBe('');
  });

  it('measures offsets relative to the reference box, also when the page scrolls (A9)', () => {
    let referenceTop = 0;
    const { element, pointer, onMove, onEnd } = setup({ getReferenceTop: () => referenceTop });

    pointer('pointerdown', { clientY: 100 });
    referenceTop = -50; // the page scrolled down by 50px, the pointer didn't move
    document.dispatchEvent(new Event('scroll'));
    expect(onMove).toHaveBeenLastCalledWith(50);
    expect(element.style.transform).toBe('translate3d(0, 50px, 0)');

    pointer('pointermove', { clientY: 80 });
    expect(onMove).toHaveBeenLastCalledWith(30);

    pointer('pointerup', { clientY: 80 });
    expect(onEnd).toHaveBeenCalledExactlyOnceWith(30);
  });

  it('ignores scrolling when no drag is in progress', () => {
    const { pointer, onMove } = setup({ getReferenceTop: () => 0 });

    document.dispatchEvent(new Event('scroll'));
    pointer('pointerdown', { clientY: 100 });
    pointer('pointerup', { clientY: 100 });
    document.dispatchEvent(new Event('scroll'));

    expect(onMove).not.toHaveBeenCalled();
  });

  it('autoscrolls near the viewport edges only when enabled, and stops at the end of the drag', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    vi.stubGlobal('innerHeight', 600);
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    try {
      const plain = setup();
      plain.pointer('pointerdown', { clientY: 300 });
      plain.pointer('pointermove', { clientY: 600 });
      vi.advanceTimersToNextFrame();
      plain.pointer('pointerup', { clientY: 600 });
      expect(scrollBy).not.toHaveBeenCalled();

      const scrolling = setup({ autoScroll: true });
      scrolling.pointer('pointerdown', { clientY: 300 });
      scrolling.pointer('pointermove', { clientY: 600 });
      vi.advanceTimersToNextFrame();
      expect(scrollBy).toHaveBeenCalledExactlyOnceWith(0, 16);

      scrolling.pointer('pointerup', { clientY: 600 });
      vi.advanceTimersToNextFrame();
      expect(scrollBy).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      scrollBy.mockRestore();
    }
  });

  it('ignores Escape when no drag is in progress', () => {
    const { onCancel } = setup();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('can start a new drag after one ends, from a clean state (A2)', () => {
    const { pointer, onStart, onEnd } = setup();

    pointer('pointerdown', { clientY: 100 });
    pointer('pointermove', { clientY: 140 });
    pointer('pointerup');
    pointer('pointerdown', { clientY: 10 });
    pointer('pointerup');

    expect(onStart).toHaveBeenCalledTimes(2);
    expect(onEnd.mock.calls).toEqual([[40], [0]]);
  });

  it('ignores a second pointer down during a drag', () => {
    const { pointer, onStart } = setup();

    pointer('pointerdown', { clientY: 100 });
    pointer('pointerdown', { pointerId: 2, clientY: 100 });

    expect(onStart).toHaveBeenCalledOnce();
  });

  it('stops a drag silently and removes its listeners on destroy', () => {
    const { controller, element, pointer, onStart, onEnd, onCancel } = setup();

    pointer('pointerdown', { clientY: 100 });
    pointer('pointermove', { clientY: 150 });
    controller.destroy();
    pointer('pointerup');
    pointer('pointerdown');

    expect(onStart).toHaveBeenCalledOnce();
    expect(onEnd).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(element.style.transform).toBe('');
  });
});

import { describe, expect, it, vi } from 'vitest';

import { TypedEmitter } from './TypedEmitter';

interface TestEvents {
  add: { id: string };
  count: number;
}

describe('TypedEmitter', () => {
  it('calls the listener with the payload', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const listener = vi.fn();

    emitter.on('add', listener);
    emitter.emit('add', { id: 'a' });

    expect(listener).toHaveBeenCalledExactlyOnceWith({ id: 'a' });
  });

  it('supports several listeners per event, in registration order', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const calls: string[] = [];

    emitter.on('count', () => calls.push('first'));
    emitter.on('count', () => calls.push('second'));
    emitter.emit('count', 1);

    expect(calls).toEqual(['first', 'second']);
  });

  it('only calls the listeners of the emitted event', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const listener = vi.fn();

    emitter.on('count', listener);
    emitter.emit('add', { id: 'a' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('does nothing when an event has no listeners', () => {
    const emitter = new TypedEmitter<TestEvents>();

    expect(() => {
      emitter.emit('count', 1);
    }).not.toThrow();
  });

  it('removes a listener with off', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const listener = vi.fn();

    emitter.on('count', listener);
    emitter.off('count', listener);
    emitter.emit('count', 1);

    expect(listener).not.toHaveBeenCalled();
  });

  it('removes a listener with the function returned by on', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const listener = vi.fn();

    const unsubscribe = emitter.on('count', listener);
    unsubscribe();
    emitter.emit('count', 1);

    expect(listener).not.toHaveBeenCalled();
  });

  it('registers the same listener only once per event', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const listener = vi.fn();

    emitter.on('count', listener);
    emitter.on('count', listener);
    emitter.emit('count', 1);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('applies changes made during an emit from the next emit', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const late = vi.fn();

    emitter.on('count', () => {
      emitter.on('count', late);
    });
    emitter.emit('count', 1);
    expect(late).not.toHaveBeenCalled();

    emitter.emit('count', 2);
    expect(late).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('removes every listener with clear', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const onAdd = vi.fn();
    const onCount = vi.fn();

    emitter.on('add', onAdd);
    emitter.on('count', onCount);
    emitter.clear();
    emitter.emit('add', { id: 'a' });
    emitter.emit('count', 1);

    expect(onAdd).not.toHaveBeenCalled();
    expect(onCount).not.toHaveBeenCalled();
  });

  // Checked by `npm run typecheck`: an unused @ts-expect-error is itself a compile error.
  it('rejects unknown events and wrong payloads at compile time', () => {
    const emitter = new TypedEmitter<TestEvents>();

    // @ts-expect-error unknown event
    emitter.on('remove', vi.fn());
    // @ts-expect-error wrong payload type
    emitter.emit('count', '1');
    // @ts-expect-error missing payload field
    emitter.emit('add', {});
  });
});

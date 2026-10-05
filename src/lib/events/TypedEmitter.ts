export type Listener<Payload> = (payload: Payload) => void;

/**
 * Minimal typed event emitter. `Events` maps each event name to its payload type, e.g.
 * `{ add: { item: TodoItem }; remove: { id: string } }`.
 */
export class TypedEmitter<Events extends object> {
  readonly #listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  /** Registers a listener. Returns a function that removes it. */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    (this.#listeners[event] ??= new Set()).add(listener);

    return () => {
      this.off(event, listener);
    };
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.#listeners[event]?.delete(listener);
  }

  /**
   * Calls the listeners of `event` in registration order. Listeners added or removed during the call
   * take effect from the next emit. Errors thrown by a listener propagate to the caller.
   */
  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const listeners = this.#listeners[event];
    if (!listeners) {
      return;
    }

    for (const listener of [...listeners]) {
      listener(payload);
    }
  }

  /** Removes every listener of every event. */
  clear(): void {
    for (const event of Object.keys(this.#listeners) as (keyof Events)[]) {
      this.#listeners[event]?.clear();
    }
  }
}

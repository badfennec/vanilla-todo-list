import { type Listener, TypedEmitter } from '../events/TypedEmitter';
import { createId } from './createId';
import type { TodoItem } from './types';

export interface TodoStoreEvents {
  add: { item: TodoItem };
  remove: { item: TodoItem };
  toggle: { item: TodoItem };
  edit: { item: TodoItem };
  /** Indexes are among the active items. */
  move: { item: TodoItem; fromIndex: number; toIndex: number };
  /** Emitted after every mutation, after the specific event (`setItems` emits only this one). */
  change: { items: readonly TodoItem[] };
}

/**
 * Single source of truth for the todo items.
 *
 * Items are kept in display order: active items first, then completed ones. Items are frozen,
 * so they can be shared with listeners and callers without copies.
 */
export class TodoStore {
  #items: TodoItem[];
  readonly #emitter = new TypedEmitter<TodoStoreEvents>();
  /** Active index of each completed item at the time it was completed, used to restore it. */
  readonly #restoreIndexes = new Map<string, number>();

  constructor(items: readonly TodoItem[] = []) {
    this.#items = toDisplayOrder(items);
  }

  on<K extends keyof TodoStoreEvents>(event: K, listener: Listener<TodoStoreEvents[K]>): () => void {
    return this.#emitter.on(event, listener);
  }

  off<K extends keyof TodoStoreEvents>(event: K, listener: Listener<TodoStoreEvents[K]>): void {
    this.#emitter.off(event, listener);
  }

  /** Returns the items in display order. The array is a copy; the items are frozen. */
  getItems(): readonly TodoItem[] {
    return [...this.#items];
  }

  /** Adds a new active item at the end of the active items. Its id never clashes with an existing one. */
  add(text = ''): TodoItem {
    const id = createId((candidate) => this.#items.some((item) => item.id === candidate));
    const item = Object.freeze({ id, text, completed: false });
    this.#items.splice(this.#activeCount(), 0, item);

    this.#emit('add', { item });
    return item;
  }

  /** @throws {Error} if no item has this id. */
  remove(id: string): TodoItem {
    const { index, item } = this.#find(id);
    this.#items.splice(index, 1);
    this.#restoreIndexes.delete(id);

    this.#emit('remove', { item });
    return item;
  }

  /**
   * Completes an active item (it moves to the end of the completed items) or restores a completed one
   * (it goes back to its previous active index, or to the end of the active items if that index no longer exists).
   * @throws {Error} if no item has this id.
   */
  toggle(id: string): TodoItem {
    const { index, item } = this.#find(id);
    const toggled = Object.freeze({ ...item, completed: !item.completed });
    this.#items.splice(index, 1);

    if (toggled.completed) {
      // Active items come first, so the array index is also the index among active items.
      this.#restoreIndexes.set(id, index);
      this.#items.push(toggled);
    } else {
      const activeCount = this.#activeCount();
      const restoreIndex = Math.min(this.#restoreIndexes.get(id) ?? activeCount, activeCount);
      this.#restoreIndexes.delete(id);
      this.#items.splice(restoreIndex, 0, toggled);
    }

    this.#emit('toggle', { item: toggled });
    return toggled;
  }

  /**
   * Changes the text of an item. Does nothing (and emits nothing) if the text is the same.
   * @throws {Error} if no item has this id.
   */
  edit(id: string, text: string): TodoItem {
    const { index, item } = this.#find(id);
    if (item.text === text) {
      return item;
    }

    const edited = Object.freeze({ ...item, text });
    this.#items[index] = edited;

    this.#emit('edit', { item: edited });
    return edited;
  }

  /**
   * Moves an active item so that it ends up at `toIndex` among the active items
   * (e.g. `move(id, 0)` makes it the first one). Does nothing (and emits nothing) if it is already there.
   * @throws {Error} if no item has this id, or if the item is completed.
   * @throws {RangeError} if `toIndex` is not a valid index among the active items.
   */
  move(id: string, toIndex: number): TodoItem {
    const { index: fromIndex, item } = this.#find(id);
    if (item.completed) {
      throw new Error(`Todo item "${id}" is completed and cannot be moved`);
    }

    const activeCount = this.#activeCount();
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= activeCount) {
      throw new RangeError(`Index ${String(toIndex)} is out of range (0-${String(activeCount - 1)})`);
    }

    if (fromIndex === toIndex) {
      return item;
    }

    // Active items come first, so array indexes are also indexes among active items.
    this.#items.splice(fromIndex, 1);
    this.#items.splice(toIndex, 0, item);

    this.#emit('move', { item, fromIndex, toIndex });
    return item;
  }

  /** Replaces every item. Emits only `change`. The previous positions remembered by `toggle` are forgotten. */
  setItems(items: readonly TodoItem[]): void {
    this.#items = toDisplayOrder(items);
    this.#restoreIndexes.clear();

    this.#emitter.emit('change', { items: this.getItems() });
  }

  /** Removes every listener. */
  destroy(): void {
    this.#emitter.clear();
  }

  #find(id: string): { index: number; item: TodoItem } {
    const index = this.#items.findIndex((item) => item.id === id);
    const item = this.#items[index];

    if (!item) {
      throw new Error(`Todo item "${id}" not found`);
    }

    return { index, item };
  }

  #activeCount(): number {
    return this.#items.filter((item) => !item.completed).length;
  }

  #emit<K extends Exclude<keyof TodoStoreEvents, 'change'>>(event: K, payload: TodoStoreEvents[K]): void {
    this.#emitter.emit(event, payload);
    this.#emitter.emit('change', { items: this.getItems() });
  }
}

/** Frozen copies of the items, active ones first, keeping the relative order. */
function toDisplayOrder(items: readonly TodoItem[]): TodoItem[] {
  const frozen = items.map((item) => Object.freeze({ ...item }));

  return [...frozen.filter((item) => !item.completed), ...frozen.filter((item) => item.completed)];
}

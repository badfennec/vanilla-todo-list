import type { Listener } from './events/TypedEmitter';
import { TodoStore, type TodoStoreEvents } from './model/TodoStore';
import type { TodoItem, TodoItemInput, TodoOptions } from './model/types';
import { parseItems, parseOptions, parseString, parseTarget } from './model/validation';
import { DEFAULT_ICONS } from './view/icons';
import { DEFAULT_LABELS } from './view/labels';
import { TodoListView } from './view/TodoListView';

/** Events of a todo list and their payloads. `change` follows every mutation, after the specific event. */
export type TodoListEvents = TodoStoreEvents;

/**
 * A todo list rendered into an element: the public entry point of the library.
 * It validates the consumer's input and wires the store (data) to the view (DOM); it holds no logic of its own.
 */
export class TodoList {
  readonly #store: TodoStore;
  readonly #view: TodoListView;

  /**
   * @param target The element to render into, or a CSS selector for it.
   * @throws {TypeError} if the target or the options are not valid.
   */
  constructor(target: HTMLElement | string, options?: TodoOptions) {
    const root = parseTarget(target);
    const { items, icons, labels } = parseOptions(options);

    this.#store = new TodoStore(items);
    this.#view = new TodoListView({
      root,
      icons: { ...DEFAULT_ICONS, ...icons },
      labels: { ...DEFAULT_LABELS, ...labels },
      onToggle: (id) => this.#store.toggle(id),
      onEdit: (id, text) => this.#store.edit(id, text),
      onDelete: (id) => this.#store.remove(id),
      onMove: (id, toIndex) => this.#store.move(id, toIndex),
      onAdd: () => {
        const item = this.#store.add();
        this.#view.editAsNew(item.id);
      },
    });

    // Registered before any consumer listener, so the DOM is up to date when they run.
    this.#store.on('change', ({ items: current }) => {
      this.#view.render(current);
    });
    this.#view.render(this.#store.getItems());
  }

  /** Adds an active item at the end of the active items and returns it. */
  add(text = ''): TodoItem {
    return this.#store.add(parseString(text, 'text'));
  }

  /** @throws {Error} if no item has this id. */
  remove(id: string): TodoItem {
    return this.#store.remove(parseString(id, 'id'));
  }

  /**
   * Completes an active item or restores a completed one.
   * @throws {Error} if no item has this id.
   */
  toggle(id: string): TodoItem {
    return this.#store.toggle(parseString(id, 'id'));
  }

  /** @throws {Error} if no item has this id. */
  edit(id: string, text: string): TodoItem {
    return this.#store.edit(parseString(id, 'id'), parseString(text, 'text'));
  }

  /**
   * Moves an active item so that it ends up at `toIndex` among the active items.
   * @throws {Error} if no item has this id, or if the item is completed.
   * @throws {RangeError} if `toIndex` is not a valid index among the active items.
   */
  move(id: string, toIndex: number): TodoItem {
    return this.#store.move(parseString(id, 'id'), toIndex);
  }

  /** Returns the items in display order (active first, then completed). The items are frozen. */
  getItems(): readonly TodoItem[] {
    return this.#store.getItems();
  }

  /**
   * Replaces every item. Emits only `change`.
   * @throws {TypeError} if the items are not valid.
   */
  setItems(items: readonly TodoItemInput[]): void {
    this.#store.setItems(parseItems(items));
  }

  /** Adds a listener and returns a function that removes it. */
  on<K extends keyof TodoListEvents>(event: K, listener: Listener<TodoListEvents[K]>): () => void {
    return this.#store.on(event, listener);
  }

  off<K extends keyof TodoListEvents>(event: K, listener: Listener<TodoListEvents[K]>): void {
    this.#store.off(event, listener);
  }

  /** Removes every listener and the list's DOM. The target element itself is left in place. */
  destroy(): void {
    this.#store.destroy();
    this.#view.destroy();
  }
}

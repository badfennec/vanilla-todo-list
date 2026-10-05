import type { TodoIcons, TodoItem, TodoLabels } from '../model/types';
import { TodoItemView } from './TodoItemView';

export interface TodoListViewOptions {
  /** Element the list renders into. It gets the `badfennec-todo` class until `destroy()`. */
  readonly root: HTMLElement;
  readonly icons: Readonly<TodoIcons>;
  readonly labels: Readonly<TodoLabels>;
  readonly onToggle: (id: string) => void;
  readonly onEdit: (id: string, text: string) => void;
  readonly onDelete: (id: string) => void;
}

/**
 * Renders the two lists (active and completed items) and keeps one item view per item in sync with the items it is
 * given. It never decides the order: `render()` receives the items in display order from the store.
 */
export class TodoListView {
  readonly #root: HTMLElement;
  readonly #activeList: HTMLUListElement;
  readonly #completedList: HTMLUListElement;
  readonly #views = new Map<string, TodoItemView>();
  readonly #itemOptions: Omit<TodoListViewOptions, 'root'>;

  constructor({ root, ...itemOptions }: TodoListViewOptions) {
    this.#root = root;
    this.#itemOptions = itemOptions;

    this.#activeList = createList('badfennec-todo__list--active');
    this.#completedList = createList('badfennec-todo__list--completed');

    this.#root.classList.add('badfennec-todo');
    this.#root.append(this.#activeList, this.#completedList);
  }

  /** Creates, updates and removes item views so that the lists show exactly these items, in this order. */
  render(items: readonly TodoItem[]): void {
    const ids = new Set(items.map((item) => item.id));
    for (const [id, view] of this.#views) {
      if (!ids.has(id)) {
        view.destroy();
        this.#views.delete(id);
      }
    }

    const active: HTMLLIElement[] = [];
    const completed: HTMLLIElement[] = [];
    for (const item of items) {
      let view = this.#views.get(item.id);
      if (view) {
        view.update(item);
      } else {
        view = new TodoItemView({ item, ...this.#itemOptions });
        this.#views.set(item.id, view);
      }
      (item.completed ? completed : active).push(view.element);
    }

    placeChildren(this.#activeList, active);
    placeChildren(this.#completedList, completed);
  }

  /** Destroys every item view and removes the lists and the root class. */
  destroy(): void {
    for (const view of this.#views.values()) {
      view.destroy();
    }
    this.#views.clear();
    this.#activeList.remove();
    this.#completedList.remove();
    this.#root.classList.remove('badfennec-todo');
  }
}

function createList(modifier: string): HTMLUListElement {
  const list = document.createElement('ul');
  list.className = `badfennec-todo__list ${modifier}`;

  return list;
}

/**
 * Makes `elements` the children of `list`, in order. Elements already in the right place are not touched: moving a
 * node makes it lose focus, so the item being edited must stay where it is.
 */
function placeChildren(list: HTMLElement, elements: readonly HTMLElement[]): void {
  elements.forEach((element, index) => {
    const current = list.children.item(index);
    if (current !== element) {
      list.insertBefore(element, current);
    }
  });
}

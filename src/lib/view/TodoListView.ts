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
  /** The user asked for a new item (the "add" row). */
  readonly onAdd: () => void;
}

/**
 * Renders the two lists (active and completed items) with the "add" row between them, and keeps one item view per
 * item in sync with the items it is given. It never decides the order: `render()` receives the items in display order
 * from the store.
 */
export class TodoListView {
  readonly #root: HTMLElement;
  readonly #activeList: HTMLUListElement;
  readonly #completedList: HTMLUListElement;
  readonly #addButton: HTMLButtonElement;
  readonly #views = new Map<string, TodoItemView>();
  readonly #itemOptions: Omit<TodoListViewOptions, 'root' | 'onAdd'>;
  readonly #onAdd: () => void;

  constructor({ root, onAdd, ...itemOptions }: TodoListViewOptions) {
    this.#root = root;
    this.#onAdd = onAdd;
    this.#itemOptions = itemOptions;

    this.#activeList = createList('badfennec-todo__list--active');
    this.#completedList = createList('badfennec-todo__list--completed');
    this.#addButton = createAddButton(itemOptions.labels.addItem, itemOptions.icons.add);
    this.#addButton.addEventListener('click', this.#handleAdd);

    this.#root.classList.add('badfennec-todo');
    this.#root.append(this.#activeList, this.#addButton, this.#completedList);
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

  /**
   * Focuses the text of an item just added from the UI; the item is deleted if the user leaves it empty.
   * Call it after `render()` has received the item.
   * @throws {Error} if no rendered item has this id.
   */
  editAsNew(id: string): void {
    const view = this.#views.get(id);
    if (!view) {
      throw new Error(`Todo item "${id}" is not rendered`);
    }
    view.editAsNew();
  }

  /** Destroys every item view and removes the lists and the root class. */
  destroy(): void {
    for (const view of this.#views.values()) {
      view.destroy();
    }
    this.#views.clear();
    this.#addButton.removeEventListener('click', this.#handleAdd);
    this.#activeList.remove();
    this.#addButton.remove();
    this.#completedList.remove();
    this.#root.classList.remove('badfennec-todo');
  }

  readonly #handleAdd = (): void => {
    this.#onAdd();
  };
}

function createList(modifier: string): HTMLUListElement {
  const list = document.createElement('ul');
  list.className = `badfennec-todo__list ${modifier}`;

  return list;
}

/** The "add" row: one button with the icon and a visible label. The icon markup comes from trusted options. */
function createAddButton(label: string, icon: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'badfennec-todo__add';

  const iconWrapper = document.createElement('span');
  iconWrapper.className = 'badfennec-todo__icon';
  iconWrapper.innerHTML = icon;

  const text = document.createElement('span');
  text.textContent = label;

  button.append(iconWrapper, text);
  return button;
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

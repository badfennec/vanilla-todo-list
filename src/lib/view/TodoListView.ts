import { DragController } from '../drag/DragController';
import { resolveDropIndex, type VerticalSpan } from '../drag/resolveDropIndex';
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
  /** The user dropped an active item at `toIndex` among the active items (only called when the index changes). */
  readonly onMove: (id: string, toIndex: number) => void;
}

interface Entry {
  readonly view: TodoItemView;
  readonly drag: DragController;
}

interface ActiveItem {
  readonly id: string;
  readonly element: HTMLLIElement;
}

/** State of the current drag; it exists only between start and end/cancel. */
interface DragState {
  readonly id: string;
  readonly element: HTMLLIElement;
  readonly placeholder: HTMLLIElement;
  /** Active items measured at drag start, relative to the active list (so page scroll doesn't matter). */
  readonly spans: readonly VerticalSpan[];
  readonly fromIndex: number;
  readonly startTop: number;
  readonly height: number;
  /** Drop index the placeholder currently shows. */
  index: number;
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
  /** Live region announcing keyboard moves to screen readers. */
  readonly #status: HTMLDivElement;
  readonly #movedLabel: string;
  readonly #entries = new Map<string, Entry>();
  readonly #itemOptions: Omit<TodoListViewOptions, 'root' | 'onAdd' | 'onMove'>;
  readonly #onAdd: () => void;
  readonly #onMove: (id: string, toIndex: number) => void;
  /** Active items of the last render, in display order. */
  #active: readonly ActiveItem[] = [];
  #drag: DragState | undefined;

  constructor({ root, onAdd, onMove, ...itemOptions }: TodoListViewOptions) {
    this.#root = root;
    this.#onAdd = onAdd;
    this.#onMove = onMove;
    this.#itemOptions = itemOptions;

    this.#activeList = createList('badfennec-todo__list--active');
    this.#completedList = createList('badfennec-todo__list--completed');
    this.#addButton = createAddButton(itemOptions.labels.addItem, itemOptions.icons.add);
    this.#addButton.addEventListener('click', this.#handleAdd);
    this.#activeList.addEventListener('keydown', this.#handleKeyDown);

    this.#movedLabel = itemOptions.labels.moved;
    this.#status = document.createElement('div');
    this.#status.className = 'badfennec-todo__status';
    this.#status.setAttribute('role', 'status');

    this.#root.classList.add('badfennec-todo');
    this.#root.append(this.#activeList, this.#addButton, this.#completedList, this.#status);
  }

  /** Creates, updates and removes item views so that the lists show exactly these items, in this order. */
  render(items: readonly TodoItem[]): void {
    // The items may have changed under the drag (e.g. a pending edit was applied): stop it, nothing is moved.
    if (this.#drag) {
      this.#entries.get(this.#drag.id)?.drag.cancel();
      this.#finishDrag();
    }

    const ids = new Set(items.map((item) => item.id));
    for (const [id, entry] of this.#entries) {
      if (!ids.has(id)) {
        destroyEntry(entry);
        this.#entries.delete(id);
      }
    }

    const active: ActiveItem[] = [];
    const completed: HTMLLIElement[] = [];
    for (const item of items) {
      let entry = this.#entries.get(item.id);
      if (entry) {
        entry.view.update(item);
      } else {
        entry = this.#createEntry(item);
        this.#entries.set(item.id, entry);
      }

      const { element } = entry.view;
      if (item.completed) {
        completed.push(element);
      } else {
        active.push({ id: item.id, element });
      }
    }
    this.#active = active;

    // Moving a node makes it lose focus: give it back, so keyboard users stay on the item they moved or toggled.
    const focused = document.activeElement;
    placeChildren(
      this.#activeList,
      active.map(({ element }) => element),
    );
    placeChildren(this.#completedList, completed);
    if (focused instanceof HTMLElement && focused !== document.activeElement && this.#root.contains(focused)) {
      focused.focus();
    }
  }

  /**
   * Focuses the text of an item just added from the UI; the item is deleted if the user leaves it empty.
   * Call it after `render()` has received the item.
   * @throws {Error} if no rendered item has this id.
   */
  editAsNew(id: string): void {
    const entry = this.#entries.get(id);
    if (!entry) {
      throw new Error(`Todo item "${id}" is not rendered`);
    }
    entry.view.editAsNew();
  }

  /** Destroys every item view, stops a drag in progress and removes the lists and the root class. */
  destroy(): void {
    this.#finishDrag();
    for (const entry of this.#entries.values()) {
      destroyEntry(entry);
    }
    this.#entries.clear();
    this.#addButton.removeEventListener('click', this.#handleAdd);
    this.#activeList.removeEventListener('keydown', this.#handleKeyDown);
    this.#activeList.remove();
    this.#addButton.remove();
    this.#completedList.remove();
    this.#status.remove();
    this.#root.classList.remove('badfennec-todo');
  }

  readonly #handleAdd = (): void => {
    this.#onAdd();
  };

  /** Keyboard reordering on a focused handle: ↑/↓ move by one, Home/End to the first/last position. */
  readonly #handleKeyDown = (event: KeyboardEvent): void => {
    if (this.#drag || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    const fromIndex = this.#active.findIndex(({ id }) => this.#entries.get(id)?.view.handle === event.target);
    const item = this.#active[fromIndex];
    if (!item) {
      return;
    }

    const lastIndex = this.#active.length - 1;
    const toIndex = keyTargets(fromIndex, lastIndex)[event.key];
    if (toIndex === undefined) {
      return;
    }

    // Also keeps the arrows from scrolling the page at the first or last position.
    event.preventDefault();
    if (toIndex < 0 || toIndex > lastIndex || toIndex === fromIndex) {
      return;
    }

    this.#onMove(item.id, toIndex);
    this.#status.textContent = this.#movedLabel
      .replace('{position}', String(toIndex + 1))
      .replace('{total}', String(lastIndex + 1));
  };

  #createEntry(item: TodoItem): Entry {
    const { id } = item;
    const view = new TodoItemView({ item, ...this.#itemOptions });
    const drag = new DragController({
      handle: view.handle,
      element: view.element,
      // The dragged item is positioned inside the active list, so it scrolls with it.
      getReferenceTop: () => this.#activeList.getBoundingClientRect().top,
      autoScroll: true,
      canStart: () => this.#active.some((active) => active.id === id),
      onStart: () => {
        this.#startDrag(id);
      },
      onMove: (offsetY) => {
        this.#moveDrag(offsetY);
      },
      onEnd: () => {
        this.#endDrag();
      },
      onCancel: () => {
        this.#finishDrag();
      },
    });

    return { view, drag };
  }

  #startDrag(id: string): void {
    const fromIndex = this.#active.findIndex((active) => active.id === id);
    const listTop = this.#activeList.getBoundingClientRect().top;
    const spans = this.#active.map(({ element }) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top - listTop, bottom: rect.bottom - listTop };
    });
    const span = spans[fromIndex];
    const element = this.#active[fromIndex]?.element;
    if (!span || !element) {
      return;
    }

    const height = span.bottom - span.top;
    const placeholder = document.createElement('li');
    placeholder.className = 'badfennec-todo__placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.blockSize = `${String(height)}px`;
    element.before(placeholder);

    // The item leaves the flow (CSS) and stays where it was; the placeholder keeps its slot.
    element.style.top = `${String(span.top)}px`;
    element.classList.add('badfennec-todo__item--dragging');
    this.#root.classList.add('badfennec-todo--dragging');

    this.#drag = { id, element, placeholder, spans, fromIndex, startTop: span.top, height, index: fromIndex };
  }

  #moveDrag(offsetY: number): void {
    const drag = this.#drag;
    if (!drag) {
      return;
    }

    // The middle of the dragged item, not the pointer: the handle is near the top of the item.
    const y = drag.startTop + offsetY + drag.height / 2;
    const index = resolveDropIndex(y, drag.spans, drag.fromIndex);
    if (index === drag.index) {
      return;
    }

    drag.index = index;
    const others = this.#active.filter(({ element }) => element !== drag.element);
    this.#activeList.insertBefore(drag.placeholder, others[index]?.element ?? null);
  }

  #endDrag(): void {
    const drag = this.#drag;
    this.#finishDrag();

    // The DOM is back as it was; the store applies the move and the next render reorders the items.
    if (drag && drag.index !== drag.fromIndex) {
      this.#onMove(drag.id, drag.index);
    }
  }

  /** Removes the placeholder and the drag styles. Safe to call when no drag is in progress. */
  #finishDrag(): void {
    const drag = this.#drag;
    if (!drag) {
      return;
    }

    this.#drag = undefined;
    drag.placeholder.remove();
    drag.element.style.top = '';
    drag.element.classList.remove('badfennec-todo__item--dragging');
    this.#root.classList.remove('badfennec-todo--dragging');
  }
}

function keyTargets(index: number, lastIndex: number): Partial<Record<string, number>> {
  return { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: lastIndex };
}

function destroyEntry({ view, drag }: Entry): void {
  drag.destroy();
  view.destroy();
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

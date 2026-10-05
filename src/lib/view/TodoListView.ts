import { DragController } from '../drag/DragController';
import { keyboardTargetIndex } from '../drag/keyboardTargetIndex';
import type { TodoIcons, TodoItem, TodoLabels } from '../model/types';
import { Announcer } from './Announcer';
import { DragSession } from './DragSession';
import { fillLabel } from './labels';
import { animateLanding } from './landing';
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

/** The drag in progress: which item, and its visual session. */
interface ActiveDrag {
  readonly id: string;
  readonly session: DragSession;
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
  /** Announces keyboard moves to screen readers. */
  readonly #announcer = new Announcer();
  readonly #movedLabel: string;
  readonly #entries = new Map<string, Entry>();
  readonly #itemOptions: Omit<TodoListViewOptions, 'root' | 'onAdd' | 'onMove'>;
  readonly #onAdd: () => void;
  readonly #onMove: (id: string, toIndex: number) => void;
  /** Active items of the last render, in display order. */
  #active: readonly ActiveItem[] = [];
  #drag: ActiveDrag | undefined;
  /** Stops the landing animation of the last dropped item, if it is still running. */
  #stopLanding: (() => void) | undefined;

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

    this.#root.classList.add('badfennec-todo');
    this.#root.append(this.#activeList, this.#addButton, this.#completedList, this.#announcer.element);
  }

  /** Creates, updates and removes item views so that the lists show exactly these items, in this order. */
  render(items: readonly TodoItem[]): void {
    // The items may have changed under the drag (e.g. a pending edit was applied): stop it, nothing is moved.
    // The session ends first, so the controller's cancel finds no drag and nothing lands mid-render.
    const drag = this.#finishDrag();
    if (drag) {
      this.#entries.get(drag.id)?.drag.cancel();
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
    this.#endLanding();
    for (const entry of this.#entries.values()) {
      destroyEntry(entry);
    }
    this.#entries.clear();
    this.#addButton.removeEventListener('click', this.#handleAdd);
    this.#activeList.removeEventListener('keydown', this.#handleKeyDown);
    this.#activeList.remove();
    this.#addButton.remove();
    this.#completedList.remove();
    this.#announcer.destroy();
    this.#root.classList.remove('badfennec-todo');
  }

  readonly #handleAdd = (): void => {
    this.#onAdd();
  };

  /** Keyboard reordering on a focused handle (see `keyboardTargetIndex` for the keys). */
  readonly #handleKeyDown = (event: KeyboardEvent): void => {
    if (this.#drag) {
      return;
    }

    const fromIndex = this.#active.findIndex(({ id }) => this.#entries.get(id)?.view.handle === event.target);
    const item = this.#active[fromIndex];
    if (!item) {
      return;
    }

    const lastIndex = this.#active.length - 1;
    const toIndex = keyboardTargetIndex(event, fromIndex, lastIndex);
    if (toIndex === undefined) {
      return;
    }

    // Also keeps the arrows from scrolling the page at the first or last position.
    event.preventDefault();
    if (toIndex === fromIndex) {
      return;
    }

    this.#onMove(item.id, toIndex);
    this.#announcer.announce(fillLabel(this.#movedLabel, { position: toIndex + 1, total: lastIndex + 1 }));
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
        this.#drag?.session.move(offsetY);
      },
      onEnd: () => {
        this.#endDrag();
      },
      onCancel: () => {
        const drag = this.#finishDrag();
        if (drag) {
          this.#land(drag);
        }
      },
    });

    return { view, drag };
  }

  #startDrag(id: string): void {
    const fromIndex = this.#active.findIndex((active) => active.id === id);
    if (fromIndex === -1) {
      return;
    }

    // A landing item must be measured in its slot, not mid-animation.
    this.#endLanding();
    const session = new DragSession({
      root: this.#root,
      list: this.#activeList,
      elements: this.#active.map(({ element }) => element),
      fromIndex,
    });
    this.#drag = { id, session };
  }

  #endDrag(): void {
    const drag = this.#finishDrag();
    if (!drag) {
      return;
    }

    // The DOM is back as it was; the store applies the move and the next render reorders the items.
    if (drag.session.index !== drag.session.fromIndex) {
      this.#onMove(drag.id, drag.session.index);
    }
    this.#land(drag);
  }

  /** Animates the dragged item from where it was released to its slot (after the render of the move, if any). */
  #land({ id, session }: ActiveDrag): void {
    const element = this.#entries.get(id)?.view.element;
    if (!element?.isConnected) {
      return;
    }

    const top = element.getBoundingClientRect().top - this.#activeList.getBoundingClientRect().top;
    this.#endLanding();
    this.#stopLanding = animateLanding(element, session.top - top);
  }

  #endLanding(): void {
    this.#stopLanding?.();
    this.#stopLanding = undefined;
  }

  /** Ends the visual session of the drag in progress, if any, and returns it. */
  #finishDrag(): ActiveDrag | undefined {
    const drag = this.#drag;
    this.#drag = undefined;
    drag?.session.finish();

    return drag;
  }
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

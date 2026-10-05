import type { TodoIcons, TodoItem, TodoLabels } from '../model/types';
import { EditableText } from './EditableText';

export interface TodoItemViewOptions {
  readonly item: TodoItem;
  readonly icons: Readonly<TodoIcons>;
  readonly labels: Readonly<TodoLabels>;
  readonly onToggle: (id: string) => void;
  readonly onEdit: (id: string, text: string) => void;
  readonly onDelete: (id: string) => void;
  /** Milliseconds without typing before a text change is reported. Leaving the text reports it at once. */
  readonly editDelay?: number;
}

/**
 * DOM of a single item. It only renders the item it is given and reports user intents through callbacks:
 * it never changes the item itself. Text editing is delegated to `EditableText`.
 */
export class TodoItemView {
  readonly element: HTMLLIElement;
  /** Drag handle. The list view attaches the drag behavior to it. */
  readonly handle: HTMLButtonElement;
  #item: TodoItem;
  readonly #icons: Readonly<TodoIcons>;
  readonly #toggle: HTMLButtonElement;
  readonly #text: EditableText;
  readonly #listeners = new AbortController();
  /** Set by `editAsNew()`: the item is deleted if its text is still empty when the user leaves it. */
  #discardIfEmpty = false;

  constructor({ item, icons, labels, onToggle, onEdit, onDelete, editDelay }: TodoItemViewOptions) {
    this.#item = item;
    this.#icons = icons;

    this.element = document.createElement('li');
    this.element.className = 'badfennec-todo__item';

    this.handle = createButton('badfennec-todo__handle', labels.drag, icons.grab);
    this.#toggle = createButton('badfennec-todo__toggle', labels.toggle, '');
    const remove = createButton('badfennec-todo__delete', labels.delete, icons.delete);
    this.#text = new EditableText({
      label: labels.text,
      value: item.text,
      delay: editDelay,
      onChange: (text) => {
        onEdit(this.#item.id, text);
      },
      onLeave: (text) => {
        const discard = this.#discardIfEmpty && text === '';
        this.#discardIfEmpty = false;
        if (discard) {
          onDelete(this.#item.id);
        }
      },
    });

    this.element.append(this.handle, this.#toggle, this.#text.element, remove);
    this.#renderCompleted();

    const { signal } = this.#listeners;
    this.#toggle.addEventListener(
      'click',
      () => {
        onToggle(this.#item.id);
      },
      { signal },
    );
    remove.addEventListener(
      'click',
      () => {
        onDelete(this.#item.id);
      },
      { signal },
    );
  }

  /** Renders a new state of the same item (same id). */
  update(item: TodoItem): void {
    const completedChanged = item.completed !== this.#item.completed;
    this.#item = item;

    if (completedChanged) {
      this.#renderCompleted();
    }
    this.#text.setValue(item.text);
  }

  /**
   * Focuses the text of an item just added from the UI. If the user leaves it with no text, the item is deleted
   * through `onDelete`, so the UI never leaves empty items behind. Existing items emptied by the user are kept.
   */
  editAsNew(): void {
    this.#discardIfEmpty = true;
    this.#text.focus();
  }

  /** Removes the element and its listeners. A pending text change is dropped, not reported (fixes A3). */
  destroy(): void {
    this.#text.destroy();
    this.#listeners.abort();
    this.element.remove();
  }

  #renderCompleted(): void {
    const { completed } = this.#item;
    this.element.classList.toggle('badfennec-todo__item--completed', completed);
    this.#toggle.setAttribute('aria-pressed', String(completed));
    this.#toggle.innerHTML = completed ? this.#icons.checked : this.#icons.unchecked;
  }
}

/** Icon button. The icon markup comes from trusted options, never from user input. */
function createButton(className: string, label: string, icon: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `badfennec-todo__button ${className}`;
  button.setAttribute('aria-label', label);
  button.innerHTML = icon;

  return button;
}

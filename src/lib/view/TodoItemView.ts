import type { TodoIcons, TodoItem, TodoLabels } from '../model/types';

const DEFAULT_EDIT_DELAY = 300;

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
 * it never changes the item itself.
 */
export class TodoItemView {
  readonly element: HTMLLIElement;
  #item: TodoItem;
  readonly #icons: Readonly<TodoIcons>;
  readonly #onEdit: (id: string, text: string) => void;
  readonly #onDelete: (id: string) => void;
  readonly #editDelay: number;
  readonly #toggle: HTMLButtonElement;
  readonly #text: HTMLDivElement;
  readonly #listeners = new AbortController();
  #editTimer: ReturnType<typeof setTimeout> | undefined;
  /** Set by `editAsNew()`: the item is deleted if its text is still empty when the user leaves it. */
  #discardIfEmpty = false;

  constructor({ item, icons, labels, onToggle, onEdit, onDelete, editDelay }: TodoItemViewOptions) {
    this.#item = item;
    this.#icons = icons;
    this.#onEdit = onEdit;
    this.#onDelete = onDelete;
    this.#editDelay = editDelay ?? DEFAULT_EDIT_DELAY;

    this.element = document.createElement('li');
    this.element.className = 'badfennec-todo__item';

    const handle = createButton('badfennec-todo__handle', labels.drag, icons.grab);
    this.#toggle = createButton('badfennec-todo__toggle', labels.toggle, '');
    const remove = createButton('badfennec-todo__delete', labels.delete, icons.delete);

    this.#text = document.createElement('div');
    this.#text.className = 'badfennec-todo__text';
    // plaintext-only: pasted content is inserted as plain text, never as markup.
    this.#text.setAttribute('contenteditable', 'plaintext-only');
    this.#text.setAttribute('role', 'textbox');
    this.#text.setAttribute('aria-label', labels.text);
    this.#text.textContent = item.text;

    this.element.append(handle, this.#toggle, this.#text, remove);
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
        this.#onDelete(this.#item.id);
      },
      { signal },
    );
    this.#text.addEventListener(
      'input',
      () => {
        this.#scheduleEdit();
      },
      { signal },
    );
    this.#text.addEventListener(
      'blur',
      () => {
        this.#leaveText();
      },
      { signal },
    );
    this.#text.addEventListener(
      'keydown',
      (event) => {
        // Items are single paragraphs: Enter confirms the text instead of adding a line break.
        if (event.key === 'Enter' && !event.isComposing) {
          event.preventDefault();
          this.#text.blur();
        }
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
    // Rewriting the text while the user is typing would move the caret; their pending edit wins anyway.
    if (document.activeElement !== this.#text && this.#text.textContent !== item.text) {
      this.#text.textContent = item.text;
    }
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
    clearTimeout(this.#editTimer);
    this.#editTimer = undefined;
    this.#listeners.abort();
    this.element.remove();
  }

  #renderCompleted(): void {
    const { completed } = this.#item;
    this.element.classList.toggle('badfennec-todo__item--completed', completed);
    this.#toggle.setAttribute('aria-pressed', String(completed));
    this.#toggle.innerHTML = completed ? this.#icons.checked : this.#icons.unchecked;
  }

  #leaveText(): void {
    this.#flushEdit();

    const discard = this.#discardIfEmpty && this.#readText() === '';
    this.#discardIfEmpty = false;
    if (discard) {
      this.#onDelete(this.#item.id);
    }
  }

  #scheduleEdit(): void {
    clearTimeout(this.#editTimer);
    this.#editTimer = setTimeout(() => {
      this.#flushEdit();
    }, this.#editDelay);
  }

  #flushEdit(): void {
    clearTimeout(this.#editTimer);
    this.#editTimer = undefined;

    const text = this.#readText();
    if (text !== this.#item.text) {
      this.#onEdit(this.#item.id, text);
    }
  }

  #readText(): string {
    // Pasted text can still contain line breaks: keep the item on one paragraph.
    return this.#text.textContent.replace(/[\r\n]+/g, ' ');
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

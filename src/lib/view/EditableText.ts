const DEFAULT_DELAY = 300;

export interface EditableTextOptions {
  /** Accessible name of the text box. */
  readonly label: string;
  /** Initial text. */
  readonly value: string;
  /** Milliseconds without typing before a change is reported. Leaving the text reports it at once. */
  readonly delay?: number;
  /** The user changed the text (after a pause in typing, or on blur). Not called when the text is the current value. */
  readonly onChange: (text: string) => void;
  /** The user left the text (blur), after any pending `onChange`. */
  readonly onLeave: (text: string) => void;
}

/**
 * A single-paragraph editable text: a `contenteditable="plaintext-only"` element with debounced change reports.
 * It knows nothing about todos. Its value comes from outside through `setValue()`: it reports what the user types but
 * never decides what the value is.
 */
export class EditableText {
  readonly element: HTMLDivElement;
  /** The current value, as last given by the owner: what typed text is compared against. */
  #value: string;
  readonly #delay: number;
  readonly #onChange: (text: string) => void;
  readonly #onLeave: (text: string) => void;
  readonly #listeners = new AbortController();
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor({ label, value, delay, onChange, onLeave }: EditableTextOptions) {
    this.#value = value;
    this.#delay = delay ?? DEFAULT_DELAY;
    this.#onChange = onChange;
    this.#onLeave = onLeave;

    this.element = document.createElement('div');
    this.element.className = 'badfennec-todo__text';
    // plaintext-only: pasted content is inserted as plain text, never as markup.
    this.element.setAttribute('contenteditable', 'plaintext-only');
    this.element.setAttribute('role', 'textbox');
    this.element.setAttribute('aria-label', label);
    this.element.textContent = value;

    const { signal } = this.#listeners;
    this.element.addEventListener(
      'input',
      () => {
        this.#schedule();
      },
      { signal },
    );
    this.element.addEventListener(
      'blur',
      () => {
        this.#flush();
        this.#onLeave(this.#read());
      },
      { signal },
    );
    this.element.addEventListener(
      'keydown',
      (event) => {
        // Single paragraph: Enter confirms the text instead of adding a line break.
        if (event.key === 'Enter' && !event.isComposing) {
          event.preventDefault();
          this.element.blur();
        }
      },
      { signal },
    );
  }

  /** Sets the current value. The shown text is not rewritten while the user is typing: it would move the caret. */
  setValue(text: string): void {
    this.#value = text;
    if (document.activeElement !== this.element && this.element.textContent !== text) {
      this.element.textContent = text;
    }
  }

  focus(): void {
    this.element.focus();
  }

  /** Removes the element and its listeners. A pending change is dropped, not reported (A3). */
  destroy(): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#listeners.abort();
    this.element.remove();
  }

  #schedule(): void {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#flush();
    }, this.#delay);
  }

  #flush(): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;

    const text = this.#read();
    if (text !== this.#value) {
      this.#onChange(text);
    }
  }

  #read(): string {
    // Pasted text can still contain line breaks: keep a single paragraph.
    return this.element.textContent.replace(/[\r\n]+/g, ' ');
  }
}

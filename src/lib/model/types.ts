/** A todo item as exposed by the library. Always a copy: mutating it has no effect on the list. */
export interface TodoItem {
  readonly id: string;
  readonly text: string;
  readonly completed: boolean;
}

/** A todo item as provided by consumers. Missing fields get defaults (generated id, empty text, not completed). */
export interface TodoItemInput {
  readonly id?: string;
  readonly text?: string;
  readonly completed?: boolean;
}

/**
 * SVG markup for each icon. The markup is inserted as HTML, so it must come from a trusted source
 * (never from user input).
 */
export interface TodoIcons {
  readonly checked: string;
  readonly unchecked: string;
  readonly grab: string;
  readonly delete: string;
  readonly add: string;
}

/** Visible texts and accessible names, so the list can be translated. */
export interface TodoLabels {
  readonly addItem: string;
  readonly toggle: string;
  readonly delete: string;
  readonly drag: string;
}

/** Options accepted by the list constructor. Every field is optional and falls back to a default. */
export interface TodoOptions {
  readonly items?: readonly TodoItemInput[];
  readonly icons?: Partial<TodoIcons>;
  readonly labels?: Partial<TodoLabels>;
}

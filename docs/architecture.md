# Target architecture

The goal is a small TypeScript library with clear responsibilities (SRP), simple solutions (KISS), and one-way data flow.
This document describes the target. Details may change during the refactor; any change is recorded in `docs/decisions.md`.

## Layout

```
src/
  lib/                        # the publishable library
    index.ts                  # public exports only
    TodoList.ts               # facade: wires store + views + drag, exposes the public API
    model/
      types.ts                # hand-written types (TodoItem, TodoOptions…)
      validation.ts           # pure functions: unknown → valid type, or TypeError
      TodoStore.ts            # single source of truth: the ordered list of items
    events/
      TypedEmitter.ts         # generic typed on/off/emit
    view/
      TodoListView.ts         # renders the containers and keeps item views in sync with the store
      TodoItemView.ts         # DOM of a single item, reports user intents through callbacks
      icons.ts                # default SVG icons
      labels.ts               # default texts and accessible names
    drag/
      DragController.ts       # pointer input on a handle: start / move / end / cancel
      resolveDropIndex.ts     # pure function: pointer Y + item rects → target index
    styles/
      todo.css                # BEM classes + --bf-* custom properties
  demo/
    main.ts                   # demo app (imports the font, not the library)
```

The legacy code (`badfennec-todo/`, `assets/js/`) stays untouched as a reference and is removed in the last phase.

## Responsibilities

| Unit               | Owns                                                                                      | Does NOT                        |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------- |
| `types.ts`         | Shape of the data and of the options                                                      | Contain logic                   |
| `validation.ts`    | Runtime checks of public input (`parseOptions`, `parseItem`)                              | Hold state                      |
| `TodoStore`        | Ordered items; `add`, `remove`, `toggle`, `edit`, `move`, `setItems`; emits change events | Touch the DOM                   |
| `TypedEmitter`     | Listener registry with typed event map                                                    | Know about todos                |
| `TodoListView`     | Containers, creating/removing/reordering item views from store state, drop placeholder    | Decide order or mutate data     |
| `TodoItemView`     | One item's elements, a11y attributes, text input debounce                                 | Know its siblings or its parent |
| `DragController`   | Pointer Events, pointer capture, visual translate of the dragged element                  | Compute the drop position       |
| `resolveDropIndex` | Drop math (pure, unit-tested)                                                             | Read the DOM                    |
| `TodoList`         | Validating options, composing the units, public API, `destroy()`                          | Contain business logic itself   |

Rules:

- Children never receive a reference to their parent. They get data plus callbacks (dependency injection).
- Units without state are plain functions (`resolveDropIndex`, `icons.ts`), not classes.
- Each unit with listeners, timers or DOM exposes `destroy()`.

## Data flow

One direction only:

```
user action ──▶ TodoItemView / DragController ──(callback)──▶ TodoList ──▶ TodoStore.mutation()
                                                                               │
                         TodoListView.render(items) ◀──── "change" event ◀─────┘
                         public listeners          ◀──── typed events
```

- The view never mutates data. It reports an intent (`onToggle(id)`, `onEdit(id, text)`, `onDelete(id)`…).
- The store applies the change and emits an event.
- `TodoListView` reconciles the DOM with the new items. It keeps a `Map<id, TodoItemView>`, creates and destroys views
  as needed, and puts nodes in store order, moving only the ones that are out of place (moving a node makes it lose
  focus, so the item being edited must stay put). It does no diffing beyond that (KISS).
- Order is **never** read from the DOM.

## Data model

```ts
type TodoItem = { id: string; text: string; completed: boolean };
```

- `id` is an opaque string. If the consumer omits it, a UUID is generated that never clashes with an existing id.
- The library is agnostic about persistence: mapping its ids to database ids is the consumer's job (see ADR-010).
- The store keeps **one** array, always in display order: active items first, then completed ones. The view renders
  the active items in the first container and the completed items in the second.
- Completing an item moves it to the end of the completed items. Un-completing it restores its previous active index
  (see ADR-009).
- Only active items can be moved. `move(id, toIndex)` takes the final index among the active items (see ADR-011).

## Drag & drop flow

1. `pointerdown` on an item handle (primary button only, active items only) makes `DragController` capture the pointer.
2. At drag start `TodoListView` measures the active items' rects **once**, relative to the list container, so that
   page scroll doesn't break them. It also inserts a placeholder.
3. On `pointermove`, `DragController` translates the element, and `resolveDropIndex(pointerY, rects)` gives the
   target index. The view moves the placeholder there.
4. On `pointerup`, `TodoList` calls `store.move(id, index)` and the view re-renders. On `pointercancel` or `Escape`,
   nothing changes and the item returns to its place.
5. All drag state lives in `DragController` for the duration of one drag and is reset at the end (fixes A2).

## Adding an item from the UI

1. The "add" row (a `<button>` between the two lists) calls `onAdd()`.
2. `TodoList` calls `store.add()` (empty text), the store emits `add` + `change`, and the view renders the new item.
3. `TodoList` calls `listView.editAsNew(id)`: the new item's text gets focus.
4. If the user leaves the text still empty, the item view reports `onDelete(id)`, so `TodoList` calls `store.remove(id)`
   and the store emits `remove`. Existing items that the user empties are kept (see ADR-014).

## Public API (draft)

```ts
const todo = new TodoList(element | selector, {
  items?: TodoItemInput[],    // validated at runtime by validation.ts
  icons?: Partial<TodoIcons>,
  labels?: Partial<TodoLabels>, // e.g. "Add new item", aria labels
});

todo.add(text?: string): TodoItem;
todo.remove(id: string): void;
todo.toggle(id: string): void;
todo.edit(id: string, text: string): void;
todo.move(id: string, toIndex: number): void;
todo.getItems(): TodoItem[];     // copies, in display order
todo.setItems(items: TodoItemInput[]): void;

todo.on('change', ({ items }) => {}); // any mutation
todo.on('add' | 'remove' | 'toggle' | 'edit' | 'move', (payload) => {});
todo.off(event, listener);
todo.destroy();
```

The item gap moves from a JS option (`itemsGap`) to the CSS custom property `--bf-gap`.

## CSS classes and custom properties

`styles/todo.css` uses flat BEM selectors. Every visual value is a `--bf-*` custom property declared on
`.badfennec-todo` (see ADR-012). Views only toggle these classes; the only inline style is the drag `transform`.

| Class                                               | Element                                                     |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `badfennec-todo`, `--dragging`                      | Root element; `--dragging` while a drag is in progress      |
| `badfennec-todo__list`, `--active`, `--completed`   | The two item containers                                     |
| `badfennec-todo__item`, `--completed`, `--dragging` | One item row                                                |
| `badfennec-todo__button`                            | Shared style of the icon `<button>`s                        |
| `badfennec-todo__handle`, `__toggle`, `__delete`    | The item's drag handle, completion toggle and delete button |
| `badfennec-todo__text`                              | The editable item text                                      |
| `badfennec-todo__add`                               | The add-new-item row (one `<button>` with a visible label)  |
| `badfennec-todo__icon`                              | Icon wrapper inside the add row                             |

Default icons live in `view/icons.ts` (`DEFAULT_ICONS`), keyed like `TodoIcons`. Default texts live in
`view/labels.ts` (`DEFAULT_LABELS`), keyed like `TodoLabels`.

## Open points (to decide during the refactor)

- Keyboard reordering keys (e.g. `Alt+↑/↓` on the handle).

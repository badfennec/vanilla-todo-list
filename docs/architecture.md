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
      resolveDropIndex.ts     # pure function: y + item spans + dragged index → target index
    styles/
      todo.css                # BEM classes + --bf-* custom properties
  demo/
    main.ts                   # demo app: imports the font, the theme and the library like a consumer
    demo.css                  # demo page layout and theme overrides
```

The legacy vanilla JS code (`badfennec-todo/`, `assets/js/`) was kept as a reference during the refactor and removed
in step 6.5.

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

1. `pointerdown` on an item handle (primary pointer and main button only; `canStart()` refuses completed items) makes
   `DragController` capture the pointer. There is one `DragController` per handle; it reports `onStart`,
   `onMove(offsetY)`, `onEnd(offsetY)` and `onCancel` and knows nothing about todos.
2. At drag start `TodoListView` measures the active items' rects **once**, relative to the active list, so that
   page scroll doesn't break them. It inserts a placeholder (same height) in the item's slot and takes the item out of
   the flow (`--dragging`: `position: absolute` in CSS, `top` set from JS).
3. On `pointermove`, `DragController` translates the element, and `resolveDropIndex(y, spans, fromIndex)` gives the
   target index, with `y` the middle of the dragged item. The view moves the placeholder there.
4. On `pointerup`, `TodoList` calls `store.move(id, index)` and the view re-renders. On `pointercancel`, lost pointer
   capture or `Escape`, nothing changes and the item returns to its place.
5. Drag state exists only for the duration of one drag and is reset at the end (fixes A2): pointer state in
   `DragController`, placeholder and measures in `TodoListView`. A `render()` during a drag cancels it.

## Adding an item from the UI

1. The "add" row (a `<button>` between the two lists) calls `onAdd()`.
2. `TodoList` calls `store.add()` (empty text), the store emits `add` + `change`, and the view renders the new item.
3. `TodoList` calls `listView.editAsNew(id)`: the new item's text gets focus.
4. If the user leaves the text still empty, the item view reports `onDelete(id)`, so `TodoList` calls `store.remove(id)`
   and the store emits `remove`. Existing items that the user empties are kept (see ADR-014).

## Public API

Exported from `src/lib/index.ts`: the `TodoList` class and the types `TodoListEvents`, `Listener`, `TodoItem`,
`TodoItemInput`, `TodoIcons`, `TodoLabels`, `TodoOptions`.

```ts
const todo = new TodoList(element | selector, {
  items?: TodoItemInput[],      // validated at runtime by validation.ts
  icons?: Partial<TodoIcons>,   // merged with DEFAULT_ICONS
  labels?: Partial<TodoLabels>, // merged with DEFAULT_LABELS (visible texts and accessible names)
});

todo.add(text?: string): TodoItem;
todo.remove(id: string): TodoItem;
todo.toggle(id: string): TodoItem;
todo.edit(id: string, text: string): TodoItem;
todo.move(id: string, toIndex: number): TodoItem;
todo.getItems(): readonly TodoItem[];  // frozen items, in display order
todo.setItems(items: TodoItemInput[]): void;

const off = todo.on('change', ({ items }) => {}); // any mutation; returns an unsubscribe function
todo.on('add' | 'remove' | 'toggle' | 'edit', ({ item }) => {});
todo.on('move', ({ item, fromIndex, toIndex }) => {});
todo.off(event, listener);
todo.destroy();                        // removes listeners and DOM, keeps the target element
```

Method arguments are checked at runtime (`parseString`), since consumers may call them from plain JS. Mutations
return the resulting item. The view re-renders before consumer listeners run, so they see an up-to-date DOM.

The item gap moves from a JS option (`itemsGap`) to the CSS custom property `--bf-gap`.

## Build and package

`npm run build` runs Vite in library mode and then `tsc -p tsconfig.build.json` (ADR-020):

| Output                           | Source                                          | Package export             |
| -------------------------------- | ----------------------------------------------- | -------------------------- |
| `dist/badfennec-todo.js` (ESM)   | `src/lib/buildEntry.ts` → `index.ts`            | `badfennec-todo`           |
| `dist/badfennec-todo.css`        | `src/lib/styles/todo.css` (via `buildEntry.ts`) | `badfennec-todo/style.css` |
| `dist/index.d.ts` (+ per module) | `src/lib/index.ts`                              | `types`                    |

`npm run build:demo` (`vite build --mode demo`) builds the demo page (`index.html` → `src/demo/main.ts`) into
`dist-demo/`; `npm run preview` serves it.

Consumers import the stylesheet themselves (`import 'badfennec-todo/style.css'` or a `<link>`), or write their own theme.

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
| `badfennec-todo__placeholder`                       | Keeps the slot of the dragged item                          |
| `badfennec-todo__status`                            | Visually hidden live region for announcements               |
| `badfennec-todo__text`                              | The editable item text                                      |
| `badfennec-todo__add`                               | The add-new-item row (one `<button>` with a visible label)  |
| `badfennec-todo__icon`                              | Icon wrapper inside the add row                             |

Default icons live in `view/icons.ts` (`DEFAULT_ICONS`), keyed like `TodoIcons`. Default texts live in
`view/labels.ts` (`DEFAULT_LABELS`), keyed like `TodoLabels`.

## Keyboard reordering

With the focus on an active item's handle, `↑` / `↓` move the item by one position and `Home` / `End` move it to the
first / last position (no modifiers). `TodoListView` reports `onMove(id, toIndex)` like a drop, keeps the focus on the
moved handle after the re-render, and announces the new position in a `role="status"` live region (`moved` label).
See ADR-018.

## Open points (to decide during the refactor)

- None at the moment.

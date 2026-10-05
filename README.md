# BadFennec Todo

A small, dependency-free todo list library written in TypeScript, with its own drag & drop engine for mouse, touch and
pen.

## Features

- **Zero runtime dependencies**, one ES module plus an optional stylesheet.
- **Drag & drop** built on Pointer Events: one code path for mouse, touch and pen, cancellable with `Escape`.
- **Keyboard reordering** and accessible markup: real buttons, ARIA attributes, announcements for screen readers.
- **Active and completed lists**: completing an item moves it to the completed list, restoring it puts it back
  where it was.
- **Typed API and events**, with runtime validation of everything you pass in.
- **Themable** through CSS custom properties (`--bf-*`); every text is translatable.

## Getting started

The package is not published on npm yet. Build it from this repository:

```bash
npm install
npm run build   # dist/badfennec-todo.js, dist/badfennec-todo.css and the .d.ts files
```

Then import the library and, unless you write your own theme, the default stylesheet:

```ts
import { TodoList } from 'badfennec-todo';
import 'badfennec-todo/style.css';

const todo = new TodoList('#todo', {
  items: [{ text: 'Learn TypeScript' }, { text: 'Build a todo app', completed: true }],
});

todo.on('change', ({ items }) => {
  localStorage.setItem('todos', JSON.stringify(items));
});
```

```html
<div id="todo"></div>
```

Without a bundler, load `dist/badfennec-todo.css` with a `<link>` and import `dist/badfennec-todo.js` from a
`<script type="module">`.

## Options

```ts
new TodoList(target: HTMLElement | string, options?: TodoOptions);
```

`target` is the element to render into, or a CSS selector for it. Every option is optional:

| Option   | Type                  | Description                                                            |
| -------- | --------------------- | ---------------------------------------------------------------------- |
| `items`  | `TodoItemInput[]`     | Initial items: `{ id?: string; text?: string; completed?: boolean }`.  |
| `icons`  | `Partial<TodoIcons>`  | SVG markup replacing the default icons (see below).                    |
| `labels` | `Partial<TodoLabels>` | Visible texts and accessible names, to translate the list (see below). |

Missing item fields get defaults: a generated id, an empty text, not completed. Ids must be unique, non-empty strings.
Invalid options throw a `TypeError` that names the wrong field (e.g. `options.items[2].text must be a string`).

### Icons

| Key         | Used for                   |
| ----------- | -------------------------- |
| `checked`   | Toggle of a completed item |
| `unchecked` | Toggle of an active item   |
| `grab`      | Drag handle                |
| `delete`    | Delete button              |
| `add`       | "Add new item" row         |

> **Security:** icon markup is inserted as HTML. Only pass trusted, static strings, never user input or data from
> a server you don't control.

Icons are sized by CSS (`--bf-icon-size`), so they don't need `width` / `height` attributes. Use `currentColor` to
follow the text color.

### Labels

| Key       | Default                                   | Used for                             |
| --------- | ----------------------------------------- | ------------------------------------ |
| `addItem` | `Add new item`                            | Visible text of the add row          |
| `toggle`  | `Completed`                               | Accessible name of the toggle button |
| `delete`  | `Delete item`                             | Accessible name of the delete button |
| `drag`    | `Move item`                               | Accessible name of the drag handle   |
| `text`    | `Item text`                               | Accessible name of the editable text |
| `moved`   | `Moved to position {position} of {total}` | Announced after a keyboard move      |

## API

All mutations update the DOM, emit their event followed by `change`, and return the resulting item.

| Method                 | Description                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `add(text = '')`       | Adds an active item at the end of the active items.                                               |
| `remove(id)`           | Removes an item.                                                                                  |
| `toggle(id)`           | Completes an active item (it goes to the end of the completed items) or restores a completed one. |
| `edit(id, text)`       | Changes the text of an item. Same text: nothing happens.                                          |
| `move(id, toIndex)`    | Moves an active item to `toIndex` among the active items (`0` is the first).                      |
| `getItems()`           | Returns the items in display order: active first, then completed. Items are frozen.               |
| `setItems(items)`      | Replaces every item. Emits only `change`.                                                         |
| `on(event, listener)`  | Adds a listener. Returns a function that removes it.                                              |
| `off(event, listener)` | Removes a listener.                                                                               |
| `destroy()`            | Removes the listeners and the list's DOM. The target element stays.                               |

Unknown ids throw an `Error`; an invalid `move` index throws a `RangeError`; completed items can't be moved.

### Events

| Event    | Payload                        | When                                                      |
| -------- | ------------------------------ | --------------------------------------------------------- |
| `add`    | `{ item }`                     | An item was added                                         |
| `remove` | `{ item }`                     | An item was removed                                       |
| `toggle` | `{ item }`                     | An item was completed or restored                         |
| `edit`   | `{ item }`                     | The text of an item changed                               |
| `move`   | `{ item, fromIndex, toIndex }` | An active item was moved (indexes among the active items) |
| `change` | `{ items }`                    | After every mutation, with all the items                  |

Text typed by the user is reported after a short pause (300 ms) or when the text loses focus, not on every key.
"Add new item" creates an empty item and focuses it; if the user leaves it empty, it is removed, so you get `add`
followed by `remove`.

### Persisting items

The library doesn't know about storage. Each item has one opaque `id`; ids generated by the library are UUIDs that never
clash with existing ones. Two common patterns:

- **Use the generated id as your key.** Save items as they are (`change` gives you all of them) and pass them back
  through `items` or `setItems()`.
- **Keep your own ids.** If your database assigns ids, keep a map from list id to database id on your side, filled
  when you handle `add`.

## Interaction

- **Mouse, touch, pen:** drag an active item by its handle. `Escape` cancels the drag. Near the top or bottom edge of
  the page (or of a scrolling container) the list scrolls by itself.
- **Keyboard:** with the focus on a handle, `↑` / `↓` move the item by one position, `Home` / `End` to the first / last
  position. `Enter` in a text confirms it.
- Completed items can't be reordered; they stay in completion order.

## Theming

The default theme reads every value from custom properties declared on `.badfennec-todo`. Override them on your
container:

```css
#todo {
  --bf-font-family: 'Inter', sans-serif;
  --bf-gap: 12px;
  --bf-item-bg: #fffbe6;
}
```

| Property               | Default                        |
| ---------------------- | ------------------------------ |
| `--bf-font-family`     | `inherit`                      |
| `--bf-gap`             | `10px` (between items)         |
| `--bf-section-gap`     | `20px` (between lists)         |
| `--bf-padding`         | `20px`                         |
| `--bf-bg`              | `#f9f9f9`                      |
| `--bf-item-bg`         | `#fff`                         |
| `--bf-text-color`      | `inherit`                      |
| `--bf-completed-color` | `#888`                         |
| `--bf-border-color`    | `#ddd`                         |
| `--bf-radius`          | `5px`                          |
| `--bf-shadow`          | `0 2px 5px rgb(0 0 0 / 10%)`   |
| `--bf-shadow-dragging` | `0 10px 20px rgb(0 0 0 / 20%)` |
| `--bf-icon-size`       | `18px`                         |
| `--bf-focus-color`     | `#2563eb`                      |

To write a theme from scratch, skip `style.css` and style the BEM classes: `badfennec-todo`, `__list--active`,
`__list--completed`, `__item`, `__item--completed`, `__item--dragging`, `__placeholder`, `__button`, `__handle`,
`__toggle`, `__delete`, `__text`, `__add`, `__icon`, `__status`.

## Browser support

Recent evergreen browsers. The editable text uses `contenteditable="plaintext-only"` (Firefox 136+ and every current
Chromium and Safari version) and drag & drop uses Pointer Events.

## Development

| Command              | Purpose                         |
| -------------------- | ------------------------------- |
| `npm run dev`        | Demo with hot reload            |
| `npm run build`      | Library build into `dist/`      |
| `npm run build:demo` | Demo build into `dist-demo/`    |
| `npm run preview`    | Serve the demo build            |
| `npm run test`       | Unit tests (Vitest, watch mode) |
| `npm run typecheck`  | TypeScript check                |
| `npm run lint`       | ESLint                          |
| `npm run format`     | Prettier                        |

## Migrating from the vanilla JS version

The TypeScript version is a new major version with a new API.

| Before                                      | Now                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `import Todo from '…/badfennec-todo.js'`    | `import { TodoList } from 'badfennec-todo'` + `import 'badfennec-todo/style.css'` |
| `new Todo({ el, items, itemsGap, icons })`  | `new TodoList(el, { items, icons, labels })`                                      |
| `itemsGap: 25`                              | CSS: `--bf-gap: 25px`                                                             |
| Item `ID` field, numeric ids                | `id` only, as a string (convert with `String(id)`)                                |
| `itemCheckedIcon`, `itemUncheckedIcon`      | `checked`, `unchecked`                                                            |
| `itemGrabIcon`, `itemDeleteIcon`, `addIcon` | `grab`, `delete`, `add`                                                           |
| Event `input`                               | `edit`                                                                            |
| Event `delete`                              | `remove`                                                                          |
| Event `update`                              | `change` (any mutation) or `move` (reordering only)                               |
| Event `toggle` with `{ item, items }`       | `toggle` with `{ item }`; use `change` or `getItems()` for the full list          |
| One callback per event                      | Any number of listeners; `off()` or the function returned by `on()`               |
| Poppins loaded by the library               | No font: set `--bf-font-family` and load the font yourself                        |

Renamed CSS classes, if you styled the old markup:

| Before                                      | Now                                  |
| ------------------------------------------- | ------------------------------------ |
| `badfennec-todo__not-completed-container`   | `badfennec-todo__list--active`       |
| `badfennec-todo__completed-container`       | `badfennec-todo__list--completed`    |
| `badfennec-todo__item` + `__item-container` | `badfennec-todo__item` (one element) |
| `badfennec-todo__shape`                     | `badfennec-todo__button`             |
| `badfennec-todo__add-new-item-box`          | `badfennec-todo__add`                |
| `badfennec-todo__grabber`                   | `badfennec-todo__handle`             |
| `badfennec-todo__checkbox`                  | `badfennec-todo__toggle`             |

## License

[MIT](LICENSE)

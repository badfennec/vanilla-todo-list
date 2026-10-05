# Legacy code audit

Audit of the legacy vanilla JS implementation (`badfennec-todo/`, `assets/js/app.js`, `index.html`) before the
TypeScript refactor. Each finding has an ID so steps, commits and `docs/progress.md` can reference it.

Status: `open` until the refactor step that resolves it is done, then `resolved (step X.Y)`.

## A. Bugs

| ID  | Location                                             | Problem                                                                                                                                                                                                                                   | Status              |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| A1  | `badfennec-todo.js:279`                              | Typo `this.notCompletedContaine` gives `undefined`, so `insertBefore` falls back to append. It works by accident, and the stated intent ("before not-completed") is wrong anyway.                                                         | resolved (step 4.3) |
| A2  | `drag-intersector.js`                                | `lastIntersectedItem` and `isOverWindow` are never reset at drag end. On the next drag a short move can reuse a stale target (even a deleted item), and `setOverWindow` returns early.                                                    | open                |
| A3  | `todo-item.js:297-303`                               | `destroy()` sets `inputTimer = null` without `clearTimeout`, so a pending debounce calls `onInput` on a deleted item. `Reactive` subscribers are never released.                                                                          | resolved (step 4.2) |
| A4  | `drag-physics.js:34-37`                              | `e.clientY \|\| …` treats `0` as missing and falls back to a magic `1`. No `touchcancel` handling (the drag gets stuck). No primary-button check (right click starts a drag).                                                             | resolved (step 5.2) |
| A5  | `todo-item.js:158,170`, `drag-intersector.js:79-80`  | `top \|\| getBoundingClientRect()` and similar: any legitimate `0` is treated as missing.                                                                                                                                                 | resolved (step 5.2) |
| A6  | model / DOM                                          | The `items[]` order drifts from the visual order (toggle and add don't reorder it), so the `update`/`toggle` payloads don't match what the user sees.                                                                                     | resolved (step 3.4) |
| A7  | add item (`dom.js`, `badfennec-todo.js:160`)         | "+" adds an empty item without focus and without emitting any event. Empty items are never cleaned up. "Add new item" is static text, not an input.                                                                                       | resolved (step 4.4) |
| A8  | `events.js:11`                                       | `id \|\| ID \|\| key` loses an id of `0`. Duplicate `id` / `ID` fields.                                                                                                                                                                   | resolved (step 3.2) |
| A9  | layout cache (`todo-item.js`, `drag-intersector.js`) | Sizes and positions are measured once in the constructor (before the Poppins font loads) and never refreshed on resize, scroll or font load. `position: fixed` plus cached rects breaks if the page scrolls during a drag. No autoscroll. | open                |
| A10 | `index.html:6`                                       | Favicon declared as `image/svg+xml` but the file is a PNG.                                                                                                                                                                                | open                |

## B. Architecture / OOP

| ID  | Problem                                                                                                                                                                                                       | Status              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| B1  | **The DOM is the source of truth.** `sort.js` rebuilds the array order from `getBoundingClientRect()`. No model/view separation.                                                                              | open                |
| B2  | **God object** `BadFennecTodo`: it owns state, drag state (`delta`, `dragY`, `draggingItem`), DOM creation, events and the completed-container logic.                                                         | open                |
| B3  | **Circular coupling**: `TodoItem`, `DragEvents` and `DragIntersector` all receive the parent `ToDo` and read and write its internals (`draggingItem`, `el.style.cursor`, `items`, `dragY`…).                  | resolved (step 5.2) |
| B4  | **Fake reactivity**: `Reactive` is a misused event bus. Its `value` is never read, state is duplicated three times (`text` / `oldText` / `reactive.value.text`), and `subscribe` fires immediately.           | resolved (step 3.4) |
| B5  | `Events`: one callback per event (each call overwrites the previous one), no `off()`, one copy-pasted method per event.                                                                                       | resolved (step 3.3) |
| B6  | `Sorting`: a class created on every drag end that shallow-copies a class instance (`{...draggingItem}`) only to compare `startY`.                                                                             | resolved (step 3.6) |
| B7  | `DOMHandler`: a class with no state. It should be a view, or plain functions.                                                                                                                                 | resolved (step 4.3) |
| B8  | Constructors with 15+ loose arguments (`TodoItem`). Defaults (icons) are scattered across 3 files.                                                                                                            | resolved (step 4.2) |
| B9  | Everything is public and mutable. Dead code: `rect`, `draggingItemOriginY`, `index`/`setIndex`, `middleHeight`, `marginBottom`, `spaceAvailableHeight`, the unused `deltaY` in `#move`, commented-out blocks. | open                |
| B10 | Misleading names: the "deltaY" passed around is actually the absolute `clientY`. `onUpdate` means toggle.                                                                                                     | resolved (step 5.1) |
| B11 | The public API is only `on()`. Missing: `add`, `remove`, `getItems`, `setItems`, `destroy`, `off`.                                                                                                            | open                |
| B12 | No input validation: a selector that matches nothing crashes later with an unclear error.                                                                                                                     | open                |

## C. UI / accessibility / CSS

| ID  | Problem                                                                                                                                   | Status              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| C1  | Buttons are `<div>`s: no `role`, `tabindex`, `aria-label` or `aria-checked`, no keyboard support (including keyboard reordering).         | open                |
| C2  | `contentEditable=true` with no Enter handling and no paste sanitization (use `plaintext-only` or an `<input>`).                           | resolved (step 4.2) |
| C3  | Inline styles set from JS (`flexGrow`, `outline`, `cursor`, `marginBottom` for the gap). They belong in CSS (custom property `--bf-gap`). | open                |
| C4  | Hardcoded colors, no CSS variables or theming. Dead CSS: `.badfennec-todo__item--intersected`.                                            | resolved (step 4.1) |
| C5  | `innerHTML` with consumer-provided SVG strings is an XSS surface. Document it, or accept `SVGElement`.                                    | open                |
| C6  | The library itself imports `@fontsource/poppins`, forcing a font on consumers (and contradicting the "zero dependencies" claim).          | open                |

## D. Project / tooling

| ID  | Problem                                                                                                                                                                 | Status              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| D1  | `package.json` name is `"01"`. `vite.config.js` is in `.gitignore`. No lib-mode build, even though the README presents the project as a library.                        | open                |
| D2  | Non-standard layout (`badfennec-todo/` at the root, app in `assets/js/`). Inconsistent imports (`./icons` vs `./icons.js`) and icon names (`CheckedIcon` vs `addIcon`). | open                |
| D3  | No linter, formatter, types or tests.                                                                                                                                   | resolved (step 2.6) |
| D4  | README: the `const icons: {` example has a syntax error, there is a "toogle" typo, code blocks are tagged `bash`, and the clone URL doesn't match the repo.             | open                |

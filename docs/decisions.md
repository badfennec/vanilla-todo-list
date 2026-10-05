# Decisions

Lightweight ADR log. Add a new entry when a design decision is made. Never rewrite past entries: supersede them with a new one.

Format: `## ADR-NNN — Title` · date · status (`accepted` / `superseded by ADR-NNN`) · context · decision · consequences.

---

## ADR-001 — Refactor in place on a dedicated branch

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** The legacy code is small but tangled (see `docs/audit.md`, B1–B3).
- **Decision:** Refactor in this repo on `refactor/typescript-architecture`. Keep the legacy code untouched as a reference
  until the last phase, then remove it.
- **Consequences:** The old demo keeps working until the new one replaces it.

## ADR-002 — TypeScript strict + hand-written runtime validation

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** There are no types and no input validation today (B12, D3). TypeScript types disappear at runtime, so
  consumers using plain JS, or passing data from JSON / `localStorage`, bypass them. The surface to validate is tiny:
  the target element and the items `{ id, text, completed }`, icons and labels.
- **Decision:** Use TypeScript in `strict` mode. Validate consumer input with small pure functions written by hand
  (`model/validation.ts`) instead of a schema library (Zod was considered and rejected: too much weight for a vanilla library).
- **Consequences:** The library keeps **zero runtime dependencies**. Types are declared by hand in `model/types.ts`,
  and the validators are unit-tested.

## ADR-003 — Public API redesign, no backward compatibility

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** The current API only offers `on()` with one callback per event (B5, B11).
- **Decision:** Design a new API (see `docs/architecture.md`). Document the migration in the README.
- **Consequences:** This is a breaking change, so the next release is a major version.

## ADR-004 — KISS and SRP as guiding principles

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** The legacy code has a god object, back-references to the parent and stateless classes (B2, B3, B7).
- **Decision:** One responsibility per class. Use plain functions for stateless logic. No abstractions without a concrete need.
- **Consequences:** More small files, each easy to test.

## ADR-005 — Store as single source of truth, one-way data flow

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** Order is read back from the DOM (B1), so the model and the view drift apart (A6).
- **Decision:** `TodoStore` owns the ordered items. Views only render store state and report intents.
- **Consequences:** Drag & drop must compute a target index and call `store.move()` instead of moving DOM nodes itself.

## ADR-006 — Pointer Events for drag & drop

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** Separate mouse and touch handling has bugs (A4: falsy `0`, no cancel, any button starts a drag).
- **Decision:** Use the Pointer Events API with `setPointerCapture`, handle `pointercancel`, and accept the primary button only.
- **Consequences:** One code path for mouse, touch and pen.

## ADR-007 — Claude workflow: no git, no installs, one step = one commit

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** The user wants full control of the git history and of dependencies.
- **Decision:** Claude never runs git or installs packages. These are enforced in `.claude/settings.json`. Work goes in small
  steps, and each step ends with a change summary plus a suggested Conventional Commit message that the user commits.
- **Consequences:** The pace is slower but every change is reviewable. See `CLAUDE.md`.

## ADR-008 — TypeScript pinned to 6.0 while the lint ecosystem catches up

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** TypeScript 7 (the native Go port of the compiler) no longer ships the JavaScript compiler API, only an
  `unstable/*` API. `typescript-eslint` depends on that API: its latest version (8.71.0) requires `typescript >=4.8.4 <6.1.0`.
  The language and type system are the same in 6.0 and 7; only compiler speed differs.
- **Decision:** Use the current standard stack (ESLint + type-aware `typescript-eslint` + Prettier) with TypeScript pinned
  to `~6.0.3`. Don't force the peer conflict (`--force`, `--legacy-peer-deps`) and don't switch to less common tools.
- **Consequences:** No code changes are needed later. Upgrade to TypeScript 7 in a dedicated step once `typescript-eslint`
  supports it (check its `peerDependencies`).

## ADR-009 — Item position when toggling

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** The store keeps items in display order (active first, then completed), so toggling must decide where an
  item goes.
- **Decision:** Completing an item moves it to the **end of the completed items** (chronological order). Un-completing
  it restores it to the **active index it had when it was completed**. If that index no longer exists (fewer active
  items now), or the item was already completed when the list was created, it goes to the end of the active items.
- **Consequences:** The store keeps one extra map (`id → active index`). The restored position is an index, not a
  neighbor: if the active items were reordered in the meantime, the item returns to the same slot, not next to the same
  items.

## ADR-010 — One opaque id, persistence stays with the consumer

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** Items created from the UI get an id generated by the library. A consumer saving them to a database that
  assigns its own ids (e.g. auto-increment) needs to relate the two. Two designs were considered and rejected:
  - `changeId(currentId, newId)` to replace the temporary id with the database one (the optimistic-update pattern of
    data layers such as TanStack Query);
  - a separate internal `key` next to the consumer `id` (the `cid` / `id` pattern of Backbone).

  Both put persistence concerns into a UI component. The second also makes every consumer deal with two ids.

- **Decision:** Keep a single opaque `id`. The library is agnostic about persistence. Consumers either store the
  generated UUID as the database key, or keep their own map from list id to database id. Generated ids never clash
  with existing ones: `createId` skips ids already in use, both in `parseItems` and in `TodoStore.add`.
- **Consequences:** The API stays small. The README must document both persistence patterns (step 6.4).
  `changeId` can still be added later without breaking changes if a real need appears.

## ADR-011 — `move` takes the final index among active items

- **Date:** 2026-10-02 · **Status:** accepted
- **Context:** Reordering needs a way to express the destination. The two common forms are a final index
  (`move(id, 6)`: "it becomes the 7th") and a reference item (`move(id, beforeId)`: "put it before that one").
- **Decision:** `move(id, toIndex)` with the **final index among the active items**, like SortableJS's `newIndex`.
  Only active items can be moved; completed ones keep their completion order (ADR-009). An invalid index throws a
  `RangeError`; moving to the current index does nothing.
- **Consequences:** It matches what drag & drop computes ("dropped at position N") and reads the same when moving up
  or down. A reference item would be more robust if the list changed between computing and applying the move, but moves
  are applied immediately, so that case doesn't arise.

## ADR-012 — Flat BEM stylesheet themed with `--bf-*` custom properties

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** The legacy CSS uses nesting, hardcoded colors and a forced font (C4), and JS sets layout styles inline (C3).
  Class names follow the legacy DOM (`__not-completed-container`, `__shape`, an `__item` / `__item-container` pair).
- **Decision:** `styles/todo.css` uses flat BEM selectors and reads every visual value from a `--bf-*` custom property
  declared on `.badfennec-todo`, with the legacy look as defaults. Classes are renamed for the new DOM:
  `__list--active` / `__list--completed` for the containers, `__button` (real `<button>`s) instead of `__shape`, and one
  `__item` element per row instead of `__item` + `__item-container`. The font is no longer forced (`--bf-font-family:
inherit`); the demo imports Poppins. How the CSS is shipped to consumers is decided in step 6.2.
- **Consequences:** Theming needs no JS option: `itemsGap` becomes `--bf-gap`. The renamed classes break custom CSS
  written for the legacy markup, which is covered by the major version (ADR-003).

## ADR-013 — Item text edited in a `plaintext-only` contenteditable

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** The legacy text is a `contentEditable=true` div with no Enter handling and no paste sanitization (C2),
  and its debounce fires after the item is deleted (A3). An `<input>` can't wrap long texts; a `<textarea>` needs its
  height computed in JS.
- **Decision:** The text is a `<div contenteditable="plaintext-only" role="textbox">` with an accessible name from the
  new `text` label. Enter confirms the text (blurs) instead of adding a line break, and pasted line breaks become spaces.
  Changes are reported through `onEdit` after 300 ms without typing, or at once on blur; unchanged text is not reported.
  `destroy()` drops a pending change instead of reporting it. `update()` doesn't rewrite the text while it has focus.
- **Consequences:** Long texts wrap as before. `plaintext-only` needs a recent browser (Firefox 136+). Consumers get
  one `edit` event per pause in typing, not one per keystroke.

## ADR-014 — "Add" creates an empty item, discarded if left empty

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** The legacy "+" adds an empty item with no focus and no event, and empty items pile up (A7). The usual
  alternative is a text field where the item is created on Enter (TodoMVC). The user prefers to keep the legacy
  interaction and fix it.
- **Decision:** The "add" row is a `<button>` with a visible label between the two lists. It creates an empty item
  through the store and focuses its text (`TodoListView.editAsNew(id)`). If the user leaves that text still empty, the
  item view reports `onDelete` and the item is removed. Only items just added from the UI are discarded this way: an
  existing item emptied by the user keeps its empty text, and items added through the API (`todo.add()`) don't get
  focus.
- **Consequences:** Consumers see `add` followed by `remove` for an item created and abandoned. The wiring
  (`onAdd` → `store.add()` → `editAsNew`) lives in the `TodoList` facade (step 6.1).

## ADR-015 — Drop index from fixed midpoint thresholds

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** The legacy drop logic recomputes item rects on every move, adding the placeholder height by hand, and
  keeps state between drags (A2). The names it passes around are misleading (`deltaY` is an absolute `clientY`, B10).
- **Decision:** `resolveDropIndex(y, spans, fromIndex)` is a pure function. `spans` are the active items, measured once
  at drag start relative to the list container. The target index is the number of other items whose middle is above
  `y`. Which `y` is passed (the pointer or the dragged item's middle) is decided when wiring the drag in step 5.3.
- **Consequences:** The index is a monotonic function of `y`, so it can't flicker while the placeholder shifts items on
  screen, and the function has no state to reset. It assumes the layout doesn't change during a drag (no reflow
  from other sources); scroll is handled by measuring relative to the container.

## ADR-016 — One generic `DragController` per handle

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** The legacy drag classes receive the parent `ToDo` and read and write its internals (B3), handle mouse
  and touch separately, and have no cancel path (A4).
- **Decision:** `DragController` takes a handle, the element to translate and callbacks (`canStart`, `onStart`,
  `onMove(offsetY)`, `onEnd(offsetY)`, `onCancel`). It uses Pointer Events with pointer capture, accepts only the
  primary pointer with the main button, and cancels on `pointercancel`, lost capture or `Escape`. Its only DOM write is
  the `transform` of the dragged element; drag classes (`--dragging`) are set by the view through the callbacks.
  `offsetY` is the pointer movement since the start, so the caller adds it to positions it measured at start.
  There is one controller per handle, created by the list view (step 5.3).
- **Consequences:** The controller is reusable and testable without todos. Its state exists only during a drag and
  is cleared at the end (A2). `destroy()` stops a drag silently, without callbacks.

## ADR-017 — Drag visuals: placeholder in the flow, dragged item absolute

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** The legacy drag sets `position: fixed` with cached page coordinates and pads neighbors by hand, which
  breaks on scroll (A9) and leaves stale state (A2).
- **Decision:** At drag start `TodoListView` measures the active items once, relative to the active list, inserts a
  placeholder with the item's height in its slot, and takes the item out of the flow (`position: absolute` inside the
  active list, from CSS; only `top` and the drag `transform` are set from JS). The drop index uses the middle of the
  dragged item, not the pointer, because the handle is near the top of the item. On drop the DOM is restored and the
  view reports `onMove(id, toIndex)`; the store applies it and the next render reorders the nodes. A `render()` during
  a drag (e.g. a pending text edit applied) cancels the drag, so the DOM never drifts from the store.
- **Consequences:** Scrolling the page before a drag doesn't matter. Scrolling during a drag and autoscroll near the
  edges are not handled yet.

## ADR-018 — Keyboard reordering with arrows on the handle

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** Reordering was mouse/touch only (C1). Options considered: arrows on the focused handle, a
  "grab with Space, move, drop with Space" mode (dnd-kit / WAI-ARIA pattern), and `Alt+↑/↓`.
- **Decision:** With the focus on an active item's handle, `↑` / `↓` move it by one position and `Home` / `End` to the
  first / last one; keys with modifiers are ignored. The move is applied at once through `onMove`, like a drop. After
  any re-render `TodoListView` gives the focus back to the element that had it if moving its node dropped it (this
  also keeps the focus on the toggle of an item that changes list). The new position is announced in a
  `role="status"` live region, with the new `moved` label (`{position}` / `{total}` placeholders).
- **Consequences:** No intermediate state to manage or cancel. Arrow keys are consumed on the handle even at the
  edges, so they never scroll the page from there.

## ADR-019 — `TodoList` facade: thin wiring, validated arguments

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** The legacy public API is only `on()` (B11), and the main class holds everything (B2).
- **Decision:** `TodoList` only validates input and wires units: it resolves the target (`parseTarget`), parses the
  options, merges icons and labels with the defaults, creates the store and the view, maps view intents to store
  mutations, and re-renders on `change`. Its methods delegate to the store, return the resulting item, and check
  their string arguments at runtime (`parseString`). Events are the store's (`TodoListEvents`). Only `TodoList` and
  the public types are exported; defaults, store and views stay internal.
- **Consequences:** All behavior stays in units that are tested on their own; `TodoList` tests are integration tests.
  Internal units can change without breaking consumers.

## ADR-020 — Library build: ES module, separate stylesheet, `tsc` declarations

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** There is no library build (D1). The stylesheet must reach consumers, and the types must ship with the
  package. Options considered: CSS injected by the JS vs a separate file; ES only vs ES + UMD; `vite-plugin-dts` vs
  plain `tsc` for declarations.
- **Decision:** Vite library mode builds one ES module (`dist/badfennec-todo.js`) and extracts the default theme into
  `dist/badfennec-todo.css`, exported as `badfennec-todo/style.css`; consumers import it on their own. Declarations
  come from `tsc -p tsconfig.build.json` (no extra dependency). The Vite entry is `src/lib/buildEntry.ts`, which
  imports the stylesheet and re-exports `index.ts`: this keeps CSS imports out of `index.d.ts`, where they would point
  to a file that doesn't exist in `dist/` (an error with `noUncheckedSideEffectImports`, on by default in TS 6).
- **Consequences:** Works with any bundler and with `<script type="module">` / `<link>` without one. No UMD build for
  classic `<script>` users. The package stays `private` until a release is decided. `npm run build` no longer builds
  the legacy demo; the demo build comes back in step 6.3.

## ADR-021 — Drag offsets relative to the list, updated on scroll

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** `DragController` measured `offsetY` as a viewport `clientY` delta (ADR-016), while the dragged item is
  positioned inside the active list and the drop spans are list-relative (ADR-017). When the page scrolled during a
  drag (wheel, trackpad, keyboard), the item drifted away from the pointer and the drop index was off (A9).
- **Decision:** `DragController` takes an optional `getReferenceTop()` (the viewport top of the box the element moves
  with) and measures `offsetY` as the change of the pointer position relative to it. During a drag it also listens to
  `scroll` (captured on the document, passive) and recomputes the offset with the last pointer position.
  `TodoListView` passes the active list's top. Without the option the reference is the viewport, as before.
- **Consequences:** Item and drop index stay in sync with the pointer whatever scrolls. Each move reads the list rect
  once. Autoscroll near the edges is still missing (step 7.2); this supersedes the "scrolling during a drag is not
  handled" consequence of ADR-017.

## ADR-022 — Autoscroll while dragging

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** Dragging to a position outside the visible area required scrolling with the wheel, which is impossible
  on touch screens, where the handle has `touch-action: none` (A9).
- **Decision:** While dragging, when the pointer is within 48 px of the top or bottom edge of the visible part of the
  closest scrolling ancestor (or of the viewport, when the page scrolls), that container scrolls every animation frame,
  up to 16 px per frame and faster closer to the edge. The zones shrink to a third of small containers. The math is in
  pure functions (`autoScroll.ts`); `AutoScroller` runs the frame loop for one drag. `DragController` uses it behind
  an `autoScroll` option, which `TodoListView` turns on. Positions stay in sync through the scroll handling of
  ADR-021.
- **Consequences:** Every position is reachable with mouse, touch and pen. The speed is per frame, so it is faster on
  high refresh rate screens; acceptable for now. The scroll container is found once per drag.

## ADR-023 — `DragSession`: one object per drag, out of `TodoListView`

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** A review for SRP found `TodoListView` with four responsibilities: containers, reconciling item views,
  the visual state of a drag (measures, placeholder, drop index) and keyboard reordering. The drag state was a
  long-lived field that only made sense during a drag, and `render()` and the keyboard handler had to check it.
  `TodoList` was reviewed too and kept as is: it only validates and delegates (ADR-019).
- **Decision:** The visual drag state moves to `view/DragSession.ts`. `TodoListView` creates a session in the drag
  controller's `onStart`, forwards `onMove` to it, and calls `finish()` on end or cancel, reading `fromIndex` and
  `index` to report the move. Keyboard reordering is extracted in a following step (7.8).
- **Consequences:** No drag state outlives the drag by construction. `TodoListView` goes from 339 to about 290
  lines, and the drag visuals are unit-tested without pointer events.

## ADR-024 — Tests next to the source

- **Date:** 2026-10-05 · **Status:** accepted
- **Context:** Moving all tests into a `tests/` folder mirroring `src/lib` was considered, to keep `src/` for shipped
  code only.
- **Decision:** Keep each test next to the file it tests, as `*.test.ts` (the Vite / Vitest convention).
- **Consequences:** Short imports, tests move and get renamed with their module, and a module without tests is easy to
  spot. Tests never reach the package: `tsconfig.build.json` excludes them and Vite builds from `buildEntry.ts` only.

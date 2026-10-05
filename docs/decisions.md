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

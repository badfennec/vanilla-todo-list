# Refactor progress

Read this first in every session. Do **only** the first unchecked step, then stop: report the changes and a
suggested commit message, and wait for the user to commit (see `CLAUDE.md`).

When a step is done:

- check it here (`[x]`);
- update the `Status` of the audit findings it resolves in `docs/audit.md`;
- record any design decision in `docs/decisions.md`.

`Install` lists the command **the user** runs before the step. Claude never runs it.

## Phase 1 — Claude setup and documentation

| Done | Step | Content                                                     | Suggested commit                              |
| ---- | ---- | ----------------------------------------------------------- | --------------------------------------------- |
| [x]  | 1.1  | `CLAUDE.md`                                                 | `docs: add claude project guide`              |
| [x]  | 1.2  | `.claude/settings.json` (deny git / installs / npx)         | `chore: add claude permissions settings`      |
| [x]  | 1.3  | `docs/audit.md`                                             | `docs: add codebase audit`                    |
| [x]  | 1.4  | `docs/architecture.md`, `docs/decisions.md`                 | `docs: add target architecture and decisions` |
| [x]  | 1.5  | `docs/progress.md` (this file)                              | `docs: add refactor progress tracker`         |
| [x]  | 1.6  | `.claude/skills/`: `verify`, `step-done`, `refactor-module` | `chore: add claude project skills`            |

## Phase 2 — Tooling

| Done | Step | Install                                                                                                          | Content                                                                         | Resolves | Suggested commit                              |
| ---- | ---- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| [x]  | 2.1  | `npm i -D typescript`                                                                                            | `tsconfig.json` (strict) + `typecheck` script                                   | D3       | `chore: add typescript config`                |
| [x]  | 2.2  | —                                                                                                                | `.nvmrc` + `engines` in `package.json`                                          | —        | `chore: add nvmrc and node engines`           |
| [x]  | 2.3  | —                                                                                                                | `vite.config.ts`, remove `vite.config.js` from `.gitignore`, fix package `name` | D1       | `chore: add vite config and fix package name` |
| [x]  | 2.4  | `npm i -D typescript@~6.0.3` then `npm i -D eslint @eslint/js typescript-eslint prettier eslint-config-prettier` | `eslint.config.js`, `.prettierrc`, `.editorconfig`, `lint` / `format` scripts   | D3       | `chore: add lint and format tooling`          |
| [x]  | 2.5  | —                                                                                                                | Run `npm run format` on the existing docs and config files (formatting only)    | —        | `style: format files with prettier`           |
| [x]  | 2.6  | `npm i -D vitest happy-dom`                                                                                      | Vitest config, `test` script, one smoke test                                    | D3       | `test: add vitest setup`                      |

## Phase 3 — Model (no DOM)

| Done | Step | Content                                                                       | Resolves   | Suggested commit                        |
| ---- | ---- | ----------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| [x]  | 3.1  | `model/types.ts`: `TodoItem`, `TodoItemInput`, `TodoOptions`, icons, labels   | B9         | `feat: add todo model types`            |
| [x]  | 3.2  | `model/validation.ts` + tests                                                 | B12, A8    | `feat: add input validation`            |
| [x]  | 3.3  | `events/TypedEmitter.ts` + tests                                              | B5         | `feat: add typed event emitter`         |
| [x]  | 3.4  | `TodoStore`: `add`, `remove`, `toggle`, `edit`, `getItems` + tests            | B1, B4, A6 | `feat: add todo store`                  |
| [x]  | 3.5  | Generated ids never clash with existing ones (`createId`), ADR-010            | —          | `fix: ensure generated ids are unique`  |
| [x]  | 3.6  | `TodoStore`: `move`, `setItems` + tests (decide `move` index semantics first) | B6         | `feat: add move and set items to store` |

## Phase 4 — Views

| Done | Step | Content                                                                        | Resolves       | Suggested commit                      |
| ---- | ---- | ------------------------------------------------------------------------------ | -------------- | ------------------------------------- |
| [ ]  | 4.1  | `view/icons.ts` (consistent names) + `styles/todo.css` with `--bf-*` variables | C3, C4, D2     | `feat: add icons and themable styles` |
| [ ]  | 4.2  | `TodoItemView`: real buttons, aria, text editing, debounce with `destroy()`    | A3, C1, C2, B8 | `feat: add todo item view`            |
| [ ]  | 4.3  | `TodoListView`: containers + reconcile item views from store state             | B2, B7, A1     | `feat: add todo list view`            |
| [ ]  | 4.4  | Add-item input (focus, emits `add`, empty items handled)                       | A7             | `feat: add new item input`            |

## Phase 5 — Drag & drop

| Done | Step | Content                                                                                  | Resolves   | Suggested commit                    |
| ---- | ---- | ---------------------------------------------------------------------------------------- | ---------- | ----------------------------------- |
| [ ]  | 5.1  | `drag/resolveDropIndex.ts` (pure) + tests                                                | B10        | `feat: add drop index resolver`     |
| [ ]  | 5.2  | `drag/DragController.ts` (Pointer Events, capture, cancel, primary button only)          | A4, A5, B3 | `feat: add pointer drag controller` |
| [ ]  | 5.3  | Placeholder in `TodoListView` + wire drag to `store.move()`, rects relative to container | A2, A9     | `feat: wire drag and drop to store` |
| [ ]  | 5.4  | Keyboard reordering (decide the keys first)                                              | C1         | `feat: add keyboard reordering`     |

## Phase 6 — Public API, demo, cleanup

| Done | Step | Content                                                              | Resolves | Suggested commit                         |
| ---- | ---- | -------------------------------------------------------------------- | -------- | ---------------------------------------- |
| [ ]  | 6.1  | `TodoList` facade + `index.ts` exports                               | B11      | `feat: add todo list public api`         |
| [ ]  | 6.2  | Library build (Vite lib mode) + `package.json` exports               | D1       | `chore: configure library build`         |
| [ ]  | 6.3  | `src/demo/main.ts` (imports the font), new `index.html`, favicon fix | C6, A10  | `feat: add new demo app`                 |
| [ ]  | 6.4  | README rewrite + migration notes                                     | D4, C5   | `docs: rewrite readme for new api`       |
| [ ]  | 6.5  | Remove legacy `badfennec-todo/` and `assets/js/`                     | D2       | `refactor: remove legacy implementation` |

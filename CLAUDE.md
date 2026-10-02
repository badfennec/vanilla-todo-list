# BadFennec Todo

A dependency-light todo list library with a custom drag & drop engine (mouse + touch), plus a small demo app.
The project is being **refactored** from the legacy vanilla JS code (`badfennec-todo/`, `assets/js/`) into a
TypeScript library under `src/` with a redesigned public API.

## Working rules (mandatory)

- **Never run git.** No `git status`, `diff`, `log`, `branch`, `commit` or any other git command. The user handles all git operations.
- **Never install or download anything.** If a dependency is needed, tell the user the exact command (e.g. `npm i -D vitest`) and wait for them to run it.
- **One small step at a time.** Do only the current step from `docs/progress.md`, then stop and report:
  1. feedback on the changes: files touched, what changed and why, verification results;
  2. a suggested commit message in Conventional Commits style, lowercase and short: `feat: add todo store`.
     Allowed types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`.
     Wait for the user's ok (they commit) before starting the next step.
- **Languages:** talk to the user in Italian. Everything written in the repo (code, comments, docs, skills) is in English.
- **All project knowledge lives in the repo** (`CLAUDE.md`, `.claude/`, `docs/`). Update `docs/progress.md` when a step is done
  and `docs/decisions.md` when a design decision is made.

## Commands

| Command                | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start the Vite dev server with the demo          |
| `npm run build`        | Production build                                 |
| `npm run preview`      | Preview the production build                     |
| `npm run typecheck`    | `tsc --noEmit` (added in step 2.1)               |
| `npm run lint`         | ESLint (type-aware typescript-eslint)            |
| `npm run format`       | Prettier, write                                  |
| `npm run format:check` | Prettier, check only                             |
| `npm run test`         | Vitest, watch mode (`-- --run` for a single run) |

## Repository layout

- `badfennec-todo/`: **legacy** library (vanilla JS). Use it as a reference only, never extend it. It is removed in the last phase.
- `assets/js/app.js`: **legacy** demo entry.
- `src/lib/`: new TypeScript library (target).
- `src/demo/`: new demo app (target).
- `docs/`: audit, architecture, decisions, progress.
- `.claude/`: Claude settings and project skills.

## Design principles

- **SRP**: one responsibility per class. Store = data, views = DOM, drag controller = pointer input, resolver = drop math.
- **KISS**: no premature abstractions, no stateless classes (use plain functions), no patterns without a concrete need.
- **Unidirectional flow**: view emits intent → store updates state → store emits event → view re-renders.
- **Dependency injection**: pass collaborators and callbacks in. Children never hold a reference to their parent.
- **The store is the single source of truth.** Never derive data (e.g. order) from the DOM.

## Code conventions

- TypeScript `strict`. No `any` (use `unknown` + narrowing). No non-null assertions without a comment explaining why.
- **Hand-written validators** in `src/lib/model/validation.ts` check every public boundary (constructor options, items
  passed in by consumers): pure functions from `unknown` to a valid type, throwing a clear `TypeError` otherwise.
  Types are declared by hand in `src/lib/model/types.ts`. The library has **no runtime dependencies**.
- Use `#private` fields and methods. Expose only what the public API needs. Prefer `readonly`.
- One class per file. Filenames are PascalCase for classes (`TodoStore.ts`) and camelCase for modules of functions (`icons.ts`).
- Every class that adds listeners, timers or DOM exposes `destroy()` and cleans up all of it.
- No inline styles from JS except dynamic geometry (e.g. drag `transform`). Styling uses CSS classes + custom properties (`--bf-*`).
- Accessibility is required: real `<button>`s, `aria-*` attributes, keyboard support.
- Never check numbers with `||` for "missing" values (0 is valid). Use `??` or explicit checks.
- BEM class names with the `badfennec-todo` block (`badfennec-todo__item--completed`).
- Pure logic (store, drop resolver) is covered by unit tests (Vitest + happy-dom).

## Docs

- `docs/audit.md`: issues found in the legacy code, with IDs (A1, B3…) to reference in steps.
- `docs/architecture.md`: target structure and data flow.
- `docs/decisions.md`: lightweight ADR log.
- `docs/progress.md`: step checklist. **Read it first to know what to do next.**

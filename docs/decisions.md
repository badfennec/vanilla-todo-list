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

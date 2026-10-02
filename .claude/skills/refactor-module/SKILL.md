---
name: refactor-module
description: Checklist for porting a piece of the legacy vanilla JS code (badfennec-todo/) into the new TypeScript architecture under src/lib/. Use when a step creates a new class or module that replaces legacy behavior.
---

# Refactor a module

The legacy code is a **reference for behavior**, not a template. Don't port its structure.

## Before writing code

1. Read the current step in `docs/progress.md` and the audit findings it resolves (`docs/audit.md`).
2. Read the legacy files involved. Write down the behavior to keep (what the user sees) and the bugs not to carry over.
3. Check `docs/architecture.md` for the unit's responsibility. If the step needs something that table doesn't allow,
   stop and ask the user instead of bending the design.

## While writing code

- **SRP**: the unit does one thing. If you need "and" to describe it, split it.
- **KISS**: no state → a function, not a class. No pattern, option or abstraction without a current use.
- No back-references to a parent. Inject data and callbacks through a single typed options object.
- `#private` by default. Public members are only what the caller needs.
- No `any`, no `||` for numeric defaults (use `??`), no inline styles except drag geometry.
- If the unit adds listeners, timers or DOM, give it `destroy()` and remove all of them there.
- Keep the change inside the step's scope. Note other problems you find for later steps; don't fix them now.

## Tests

- Pure logic (validation, store, emitter, drop resolver) gets unit tests next to the source as `*.test.ts`.
- Test behavior through the public methods, not private state.
- Add a regression test for each audit bug the step fixes (e.g. "move to index 0 works", for A5).

## Done

- The legacy code stays untouched until step 6.5.
- Close the step with the `step-done` skill.

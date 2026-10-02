---
name: step-done
description: Close the current refactor step - update progress and audit docs, run verification, then report changes and a suggested commit message to the user. Use at the end of every step from docs/progress.md.
---

# Step done

Every step ends with this procedure. Never start the next step in the same turn.

## 1. Update the docs (part of the same commit)

- `docs/progress.md`: check the step (`[x]`).
- `docs/audit.md`: for each finding in the step's `Resolves` column that is actually fixed, set its status to
  `resolved (step X.Y)`. If it is only partly fixed, leave it `open` and say so in the report.
- `docs/decisions.md`: if the step involved a design decision, add a new `ADR-NNN` entry. Never rewrite a committed
  entry; supersede it with a new one.

## 2. Verify

Run the `verify` skill.

## 3. Report to the user (in Italian)

````markdown
Passo X.Y fatto: <one line summary>

**Cosa ho cambiato e perché:**

- `path/to/file`: what changed and why (reference audit IDs, e.g. "risolve A3")

**Verifica:** <results from the verify skill>

**Note:** <deviations from the plan, open questions, things the user must do — omit if none>

**Commit suggerito:**

```
type: short lowercase message
```

Quando hai committato, passo all'X.Y+1 (<next step title>).
````

## Commit message rules

- Conventional Commits, lowercase, short, imperative, no trailing period: `feat: add todo store`.
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`.
- Use the message from `docs/progress.md` unless the actual content of the step differs.

## Never

- Run git (it is denied in `.claude/settings.json`; the user commits).
- Install packages. If the next step needs some, list the exact `npm i` command in the report.

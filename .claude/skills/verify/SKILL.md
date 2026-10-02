---
name: verify
description: Run the project's checks (typecheck, lint, test) and report the results. Use before closing any step, or when the user asks to verify the code.
---

# Verify

Run the checks that exist **right now** and report the outcome honestly.

1. Read `package.json` → `scripts`. Run only the scripts that exist, in this order:
   1. `npm run typecheck`
   2. `npm run lint`
   3. `npm run test -- --run` (single run, no watch mode)
2. If a script doesn't exist yet (tooling is added in phase 2), say so in the report. Don't treat it as a failure, and
   don't replace it with `npx` (it is denied, because it can download packages).
3. If the step touched the UI or drag & drop, tell the user what to check by hand with `npm run dev`. You cannot click
   in the browser, so list the exact actions to try (e.g. "drag the 2nd item below the 4th with mouse and touch emulation").
4. Never "fix" a failure by weakening a check (disabling a lint rule, `// @ts-ignore`, skipping a test) unless the user
   agrees.

## Report format

```
Verification
- typecheck: ✅ / ❌ (<short error>) / n/a (script not yet added)
- lint:      ✅ / ❌ / n/a
- test:      ✅ N passed / ❌ N failed / n/a
- manual:    <what the user should check in the browser, or "not needed">
```

If something fails, show the relevant part of the output and propose the fix. Don't apply it if it is outside the
current step.

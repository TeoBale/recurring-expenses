# Plan 001: Establish a real test baseline for recurring-expenses

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5a03707..HEAD -- package.json bun.lock vite.config.ts src`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `5a03707`, 2026-07-07

## Why this matters

The repository has working `build`, `lint`, and `typecheck` commands, but no
test runner, no `test` script, and no test files. That means every behavior
change in date math, local storage, or rendering is currently verified only by
manual inspection. A small, reliable baseline is the prerequisite for the
date-fix and performance plans that follow.

## Current state

- `package.json` — scripts stop at `dev`, `build`, `lint`, `format`,
  `typecheck`, and `preview`; there is no `test` command (`package.json:6-12`).
- The repo uses Bun + Vite + React 19 + TypeScript strict mode
  (`README.md:20-27`, `README.md:53-59`, `package.json:14-47`).
- There are no committed test files: `rg --files -g '*test*' -g '*.spec.*' -g '*.test.*' src .`
  returned no matches during recon on 2026-07-07.
- Existing domain logic worth locking down first:
  - `src/lib/subscriptions.ts:3-37` — monthly normalization, month progress,
    currency formatting, renewal-date formatting.
  - `src/lib/subscription-storage.ts:34-72` — localStorage load/save with
    schema filtering and graceful failure handling.
- Style and repo conventions:
  - Files use TypeScript, no semicolons, double quotes, 2-space indent.
  - Recent commits use short imperative subjects such as
    `Improve dashboard transitions and add mobile drawer dialog`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install deps | `bun install` | exit 0 |
| Typecheck | `bun run typecheck` | exit 0, no errors |
| Lint | `bun run lint` | exit 0 |
| Build | `bun run build` | exit 0 |
| Test | `bun run test` | exit 0; all tests pass |

## Scope

**In scope**:
- `package.json`
- `bun.lock`
- `vite.config.ts` or `vitest.config.ts` if a dedicated config is cleaner
- `src/test/**` or equivalent setup file
- `src/lib/**/*.test.ts`

**Out of scope**:
- Product behavior changes in `App.tsx`, dialog components, or the table
- CSS or design-system changes
- Replacing Bun with another package manager

## Git workflow

- Work on the current branch.
- Keep the change as one logical commit with a concise imperative or
  conventional subject. Example style from history:
  `Add subscriptions table with bulk delete and improve README`.
- Do not push until the operator asks for the batch push at the end.

## Steps

### Step 1: Add a test runner and script without disturbing the build

Add the minimal dev dependencies and configuration for Vitest in a Vite/React
project. Prefer a dedicated `vitest.config.ts` if it keeps `vite.config.ts`
small; otherwise extend the existing Vite config cleanly. Add a `test` script
to `package.json`.

**Verify**: `bun run test` -> exits 0 after placeholder tests exist.

### Step 2: Add test setup for browser APIs used by the repo

Configure the test environment so utility tests can exercise `window`,
`localStorage`, and DOM-based rendering safely. If React Testing Library is
added, keep the setup file tiny and reusable.

**Verify**: `bun run test` -> environment boots with no setup errors.

### Step 3: Cover the critical domain helpers already in the repo

Add focused tests for:
- `totalMonthlyCost` and `monthlyCost`
- `monthProgress` on a representative date within a month
- `formatCurrency` and `formatRenewalDate`
- `loadSubscriptions` happy-path filtering and malformed-storage fallback
- `saveSubscriptions` persistence shape and silent-failure behavior

Keep the tests narrow and deterministic; do not pull UI components into this
plan.

**Verify**: `bun run test` -> new utility/storage tests all pass.

### Step 4: Make the baseline part of the regular verification flow

Confirm the new test command coexists cleanly with the existing repo checks.
Update the README scripts table only if the test command would otherwise remain
undocumented.

**Verify**: `bun run typecheck && bun run lint && bun run test && bun run build`
-> all commands exit 0.

## Test plan

- New tests:
  - `src/lib/subscriptions.test.ts`
  - `src/lib/subscription-storage.test.ts`
- Cases to cover:
  - monthly vs yearly normalization
  - stable currency/date formatting
  - localStorage parse failures returning `[]`
  - invalid stored items being filtered out
  - saved subscriptions omitting non-serializable UI-only fields
- Structural pattern: there is no existing test suite; keep files flat and
  explicit rather than abstract.
- Verification: `bun run test` -> all new tests pass.

## Done criteria

- [ ] `bun run test` exists and exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `bun run build` exits 0
- [ ] At least the utility and storage modules above have meaningful automated
      tests
- [ ] No product code behavior changed outside the baseline setup
- [ ] `plans/README.md` status row updated

## STOP conditions

- `bun add -d ...` fails or the environment cannot install new dev
  dependencies.
- The chosen test runner requires touching unrelated product files outside
  scope.
- Existing repo checks fail before any test-related change is made.

## Maintenance notes

- Future plans should extend this baseline instead of introducing a second test
  runner.
- Reviewers should scrutinize whether the tests assert real behavior rather than
  implementation details.
- If end-to-end coverage is desired later, add it separately; this plan is only
  for a fast, deterministic unit/integration baseline.

# Plan 002: Fix date-only subscription logic across the app

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5a03707..HEAD -- src/components/add-subscription-dialog.tsx src/components/date-picker.tsx src/components/subscriptions-table.tsx src/App.tsx src/lib src/types`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-establish-test-baseline.md`
- **Category**: bug
- **Planned at**: commit `5a03707`, 2026-07-07

## Why this matters

Subscription dates are the backbone of the product: they drive defaults,
sorting, renewal filters, and the dashboard narrative. The current code mixes
UTC serialization, local date math, and direct `Date` parsing of `YYYY-MM-DD`
strings. That combination already reproduces wrong defaults near midnight in
Europe/Rome and wrong month jumps at end-of-month boundaries, so this is a
real correctness bug, not a speculative cleanup.

## Current state

- `src/components/add-subscription-dialog.tsx:88-101` computes both
  `nextRenewalDate` and `todayDate` from `new Date()` and returns
  `toISOString().slice(0, 10)`.
- Recon reproduction:
  - `TZ=Europe/Rome node -e 'const d=new Date(2026,6,7,0,30); console.log(d.toISOString().slice(0,10))'`
    returned `2026-07-06`, one day early.
  - `node -e 'const d=new Date(2024,0,31); d.setMonth(d.getMonth()+1); console.log(d.toISOString())'`
    returned `2024-03-01T23:00:00.000Z`, showing month rollover past February.
- `src/components/add-subscription-dialog.tsx:166-179` seeds `startDate` and
  `renewalDate` from those helpers.
- `src/components/add-subscription-dialog.tsx:299-303` updates `billingCycle`
  without adjusting `renewalDate`, so switching monthly/yearly can persist an
  inconsistent renewal date.
- `src/App.tsx:49-55` sorts by `new Date(a.renewalDate).getTime()`.
- `src/components/subscriptions-table.tsx:122-131` calculates renewal windows
  via a synthetic noon timestamp string.
- Existing conventions:
  - date formatting already uses `date-fns` in `src/components/date-picker.tsx`
    and `Intl.DateTimeFormat` in utility functions
  - type-safe helpers live in `src/lib/*`

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `bun run typecheck` | exit 0 |
| Lint | `bun run lint` | exit 0 |
| Tests | `bun run test` | exit 0; date-focused tests pass |
| Build | `bun run build` | exit 0 |

## Scope

**In scope**:
- `src/components/add-subscription-dialog.tsx`
- `src/components/date-picker.tsx`
- `src/components/subscriptions-table.tsx`
- `src/App.tsx`
- `src/lib/subscriptions.ts`
- new helper(s) under `src/lib/` if needed
- new tests for date-only behavior

**Out of scope**:
- Changing the product’s copy or layout
- Adding time-of-day support to subscriptions
- Reworking the live spend formula beyond date correctness

## Git workflow

- Work on the current branch.
- Keep the date fixes and their tests together in one logical commit.
- Do not push until the operator asks for the final batch push.

## Steps

### Step 1: Introduce explicit date-only helpers in `src/lib`

Create helpers that treat subscription dates as local calendar dates rather
than timestamps. The helper set should cover:
- current local date serialized as `yyyy-MM-dd`
- parsing a stored date-only string safely
- adding one billing cycle with end-of-month clamping
- comparing two stored date strings without relying on UTC parsing
- computing days until renewal from date-only values

Prefer `date-fns` functions that already exist in the repo dependency set.

**Verify**: `bun run test -- --runInBand` or the equivalent targeted command ->
new helper tests pass.

### Step 2: Rewire the add-subscription dialog to use the helpers

Replace `todayDate()` and `nextRenewalDate()` with the new shared helpers.
When the billing cycle changes manually, update `renewalDate` in a predictable
way based on the current start date or current local date so the form cannot
silently keep a stale monthly/yearly renewal.

**Verify**: `bun run test` -> dialog/date helper tests pass.

### Step 3: Remove timestamp parsing from sorting and filtering

Update `App.tsx` sorting and `subscriptions-table.tsx` renewal filtering to use
the shared date-only helpers. Sorting by ISO date strings is acceptable if the
helper makes that intent explicit and keeps the logic centralized.

**Verify**: `bun run test` -> coverage includes sorting/filtering edge cases.

### Step 4: Keep the date picker aligned with the new contract

Review `src/components/date-picker.tsx` and any formatting helpers so that the
component still receives and emits `yyyy-MM-dd` strings consistently after the
new utilities land.

**Verify**: `bun run typecheck && bun run lint && bun run test && bun run build`
-> all commands exit 0.

## Test plan

- Add tests for:
  - Europe/Rome near-midnight serialization
  - Jan 31 monthly rollover to Feb 29 / Feb 28 as appropriate
  - Feb 29 yearly rollover to Feb 28 in non-leap years
  - billing-cycle changes updating renewal defaults consistently
  - renewal filter bucket boundaries (`overdue`, `7-days`, `30-days`, `90-days`)
- Keep tests deterministic by injecting specific reference dates into helpers
  rather than stubbing global time if possible.
- Reuse the baseline from plan 001; extend it rather than adding ad-hoc scripts.

## Done criteria

- [ ] No use of `toISOString().slice(0, 10)` remains in product code
- [ ] No sorting/filtering logic relies on `new Date(<yyyy-mm-dd>)`
- [ ] Billing-cycle changes cannot leave a stale default renewal date
- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `bun run test` exits 0 with date-focused coverage
- [ ] `bun run build` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- The existing UI contract depends on timestamp semantics instead of date-only
  strings.
- Fixing the bug requires touching unrelated animation or layout code.
- A clean helper-based fix still leaves ambiguous product behavior for how
  renewal dates should respond to manual cycle changes.

## Maintenance notes

- Any future import/export feature should reuse the new date-only helpers rather
  than rolling its own parsing.
- Reviewers should pay attention to end-of-month behavior and leap-year cases,
  not just ordinary dates.
- If later work introduces time zones explicitly, treat that as a separate
  schema change rather than extending this plan piecemeal.

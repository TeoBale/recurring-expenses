# Plan 004: Lazy-load subscription management surfaces to shrink initial JS

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5a03707..HEAD -- src/App.tsx src/components/add-subscription-dialog.tsx src/components/subscriptions-table.tsx src/components/subscriptions-empty-state.tsx src/components/live-spend-counter.tsx src/components/subscription-card.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-establish-test-baseline.md`
- **Category**: perf
- **Planned at**: commit `5a03707`, 2026-07-07

## Why this matters

The production build currently emits a single main JS chunk of 756.24 kB and
Vite warns that chunks exceed 500 kB after minification. The landing view is
the dashboard, but the app eagerly imports subscription-management surfaces and
the full provider catalog anyway. Code-splitting the non-critical paths should
reduce first-load cost without changing product behavior.

## Current state

- Build observation from recon on 2026-07-07:
  - `bun run build` succeeded, but Vite reported `dist/assets/index-BJlmVemM.js`
    at `756.24 kB` and warned about large chunks.
- `src/App.tsx:10-17` eagerly imports:
  - `AddSubscriptionDialog`
  - `LiveSpendCounter`
  - `SubscriptionCard`
  - `SubscriptionsEmptyState`
  - `SubscriptionsTable`
- `src/App.tsx:232-264` renders the subscriptions archive only on the second
  tab, but the code is already in the initial bundle.
- `src/components/add-subscription-dialog.tsx:5` eagerly imports the full
  provider catalog from `src/data/subscription-providers.json`, which is only
  needed when adding a subscription.
- UI conventions to preserve:
  - Motion transitions in `App.tsx` and `live-spend-counter.tsx`
  - Existing mobile/desktop dialog behavior
  - Existing tab semantics and local-state ownership in `App.tsx`

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `bun run typecheck` | exit 0 |
| Lint | `bun run lint` | exit 0 |
| Tests | `bun run test` | exit 0 |
| Build | `bun run build` | exit 0; chunk warning should improve or disappear |

## Scope

**In scope**:
- `src/App.tsx`
- `src/components/add-subscription-dialog.tsx`
- `src/components/subscriptions-table.tsx`
- new tiny wrapper components if needed for lazy boundaries
- minimal tests or smoke coverage added through the baseline

**Out of scope**:
- Redesigning the dashboard or tab UX
- Changing the provider catalog contents
- Micro-optimizing individual utility functions

## Git workflow

- Work on the current branch.
- Keep code-splitting changes in one logical commit.
- Do not push until the operator asks for the final batch push.

## Steps

### Step 1: Create clear lazy boundaries around non-critical surfaces

Use `React.lazy` and `Suspense` (or an equivalent Vite-friendly pattern) to
defer code that is not needed for the first dashboard paint. Strong candidates:
- the subscriptions archive table/tab body
- the add-subscription dialog implementation

Keep the fallback UI lightweight and consistent with the current design.

**Verify**: `bun run typecheck` -> exits 0.

### Step 2: Preserve interaction and accessibility behavior

The lazy boundary must not break:
- tab switching
- mobile/desktop add flow
- button focus behavior
- reduced-motion behavior and existing transitions

If you introduce wrapper components, keep state ownership in `App.tsx` unless a
move is clearly required for the lazy import to work.

**Verify**: `bun run test` -> smoke tests for lazy surfaces pass if added.

### Step 3: Measure the build result again

Re-run the production build and compare the emitted chunks. Success means the
main entry chunk is materially smaller or the large-chunk warning disappears.
Record the before/after numbers in the executor notes for the reviewer.

**Verify**: `bun run build` -> exits 0 with improved chunking.

### Step 4: Run the full regression pass

Confirm the code-splitting change does not disturb the rest of the repo.

**Verify**: `bun run lint && bun run typecheck && bun run test && bun run build`
-> all commands exit 0.

## Test plan

- Add at least one smoke-level render or interaction test that proves the lazy
  boundary resolves correctly when:
  - opening the add-subscription flow
  - switching to the subscriptions tab
- Avoid brittle timing assertions; prefer awaiting visible text or controls.
- Keep tests focused on lazy loading behavior, not styling.

## Done criteria

- [ ] Non-critical subscription-management code is no longer eagerly bundled
      into the first paint path
- [ ] `bun run build` exits 0 and shows a smaller main entry chunk than the
      756.24 kB baseline
- [ ] Tab switching and add-subscription UX still work
- [ ] `bun run lint` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- Achieving real code splitting requires rewriting the app architecture beyond
  the files listed in scope.
- The lazy boundary causes hydration/runtime errors or breaks focus/keyboard
  navigation in a way that is not quickly fixable.
- The build size does not improve after a reasonable implementation attempt.

## Maintenance notes

- Future heavy secondary surfaces should follow the same lazy-loading pattern
  instead of adding more eager imports to `App.tsx`.
- Reviewers should compare the before/after build output, not just the code.
- If more bundle work is needed later, reach for measurement first rather than
  indiscriminately memoizing components.

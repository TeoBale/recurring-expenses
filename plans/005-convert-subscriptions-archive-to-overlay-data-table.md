# Plan 005: Convert the subscriptions archive to an overlay-based data table

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fc059e7..HEAD -- package.json bun.lock src/components/subscriptions-table.tsx src/components/ui/data-table.tsx src/components/ui/toggle.tsx src/components/ui/toggle-group.tsx src/App.lazy.test.tsx src/test/setup.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-establish-test-baseline.md, plans/004-lazy-load-subscription-surfaces.md
- **Category**: tech-debt
- **Planned at**: commit `fc059e7`, 2026-07-07

## Why this matters

The archive currently mixes table state, filtering, sorting, and row selection
inside one manual component. It also reveals filters and sorting controls by
inserting full-width cards into the page flow, which shifts the archive
content downward every time the user opens them. Converting the surface to a
real data-table model and moving those controls into anchored overlays improves
maintainability, keeps the layout stable, and gives the project a better base
for future table features.

## Current state

- `src/components/subscriptions-table.tsx` owns all filtering, sorting,
  selection, and manual table markup in one file.
- `src/App.lazy.test.tsx` only verifies that the lazy-loaded archive appears
  after switching tabs; it does not exercise filter/sort interactions.
- The project already follows a `src/components/ui/*` pattern for shared UI
  primitives. Reuse that pattern instead of embedding one-off table markup.

Relevant excerpts at commit `fc059e7`:

- `src/components/subscriptions-table.tsx:125-154` computes the visible rows
  with a single `useMemo`, so sorting/filtering state is coupled to the render
  output rather than a reusable table model:

  ```tsx
  const visibleSubscriptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("it-IT")
    const filteredSubscriptions = subscriptions.filter(
      (subscription) =>
        subscription.name
          .toLocaleLowerCase("it-IT")
          .includes(normalizedQuery) &&
        (cycleFilter === "all" || subscription.billingCycle === cycleFilter) &&
        matchesRenewalFilter(subscription.renewalDate, renewalFilter)
    )

    return filteredSubscriptions.toSorted((a, b) => {
      if (sortOption === "name-asc")
        return a.name.localeCompare(b.name, "it-IT")
      if (sortOption === "price-asc") return a.price - b.price
      if (sortOption === "price-desc") return b.price - a.price
      if (sortOption === "start-desc")
        return compareDateOnly(b.startDate, a.startDate)
      return compareDateOnly(a.renewalDate, b.renewalDate)
    })
  }, [cycleFilter, query, renewalFilter, sortOption, subscriptions])
  ```

- `src/components/subscriptions-table.tsx:277-373` injects filters and sorting
  cards directly between the search bar and the table:

  ```tsx
  {filtersOpen && (
    <div className="rounded-xl border bg-muted/20 p-3">
      <FieldGroup className="grid gap-3 sm:grid-cols-2">
        ...
      </FieldGroup>
    </div>
  )}

  {sortingOpen && (
    <div className="rounded-xl border bg-muted/20 p-3">
      <Field>
        ...
      </Field>
    </div>
  )}
  ```

- `src/components/subscriptions-table.tsx:375-458` renders a hand-built table,
  so any future feature has to re-thread header/cell/empty-state behavior in
  the same file:

  ```tsx
  <div className="overflow-hidden rounded-xl border">
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10">
            <Checkbox ... />
          </TableHead>
          ...
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibleSubscriptions.map((subscription) => {
          ...
        })}
      </TableBody>
    </Table>
  </div>
  ```

- `src/App.lazy.test.tsx:127-155` shows the current integration-test pattern
  for the lazy archive surface. New interaction coverage should follow this
  style instead of introducing a different test harness:

  ```tsx
  it("renders the subscriptions archive after switching tabs", async () => {
    const { cleanup } = await renderApp([...])
    const subscriptionsTab = findButton("Abbonamenti")
    ...
    const searchInput = await waitFor(() =>
      document.querySelector(
        'input[aria-label="Cerca abbonamento"]'
      ) as HTMLInputElement | null
    )
    ...
  })
  ```

Repo conventions to preserve:

- Shared UI primitives live in `src/components/ui/` and are imported through
  `@/components/ui/...`.
- Commit messages use concise conventional prefixes such as
  `fix: normalize subscription date handling` and
  `docs: record automated improvement plans`.
- Verification commands come from `package.json`: `bun run lint`,
  `bun run typecheck`, `bun run test`, and `bun run build`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install dependency and generated primitives | `bun add @tanstack/react-table` and `npx shadcn@latest add toggle-group --yes` | exit 0 |
| Lint | `bun run lint` | exit 0 |
| Typecheck | `bun run typecheck` | exit 0 |
| Tests | `bun run test` | all tests pass |
| Build | `bun run build` | exit 0 |

## Suggested executor toolkit

- Use the repo's `shadcn` skill if available for the data-table and overlay
  primitives.
- Reference docs:
  - `https://ui.shadcn.com/docs/components/base/data-table`
  - `https://ui.shadcn.com/docs/components/base/popover`

## Scope

**In scope**:
- `package.json`
- `bun.lock`
- `src/components/subscriptions-table.tsx`
- `src/components/ui/data-table.tsx` (create)
- `src/components/ui/toggle.tsx` (create)
- `src/components/ui/toggle-group.tsx` (create)
- `src/App.lazy.test.tsx`
- `src/test/setup.ts`

**Out of scope**:
- `src/App.tsx` overall tab shell and page transitions
- Dashboard cards and live counter surfaces
- Add/edit subscription dialogs or storage logic
- Any new pagination, column resizing, or server-backed table features

## Git workflow

- Stay on the current working branch unless the operator requested otherwise.
- Commit in conventional-commit style, matching recent history.
- Do not push until lint, typecheck, tests, and build all pass.

## Steps

### Step 1: Introduce a reusable data-table foundation

Add `@tanstack/react-table` to dependencies and create a shared
`src/components/ui/data-table.tsx` wrapper around the existing table atoms.
The wrapper should accept a TanStack table instance, render headers/cells via
`flexRender`, preserve the current empty-state treatment, and allow optional
row click handling. Generate the `toggle` and `toggle-group` primitives with
shadcn so the archive can use button-like option lists without custom one-off
styling.

**Verify**: `bun run typecheck` -> exit 0

### Step 2: Move archive state to TanStack table columns and row selection

Refactor `src/components/subscriptions-table.tsx` so column definitions,
filtering, sorting, and row selection flow through `useReactTable` instead of
the current `visibleSubscriptions` memo plus `Set<string>` selection state.
Preserve existing behaviors: search, billing-cycle filtering, renewal-window
filtering, renewal-date default sort, row selection, bulk delete, and the
mobile/desktop cell content split. Keep the archive copy and visual language
aligned with the existing screen rather than redesigning the entire page.

**Verify**: `bun run lint` -> exit 0

### Step 3: Replace inline cards with anchored overlay controls

Swap the `filtersOpen && <div ...>` and `sortingOpen && <div ...>` blocks for
`Popover` overlays anchored to the existing search-bar icon buttons. The
controls should open under the button, remain hidden when closed, and not
insert extra layout height into the page. Use the new `ToggleGroup` primitives
for filter and sort choices so the overlay content stays compact and tap-friendly.
When one overlay opens, close the other to avoid overlapping panels.

**Verify**: `bun run test src/App.lazy.test.tsx` -> all tests pass

### Step 4: Add regression coverage for overlay behavior

Extend `src/App.lazy.test.tsx` with an archive interaction test that:
- switches to the subscriptions tab,
- opens the filter overlay,
- proves the overlay content renders outside the main app container,
- applies a frequency filter and verifies the visible rows shrink,
- resets filters,
- opens the sorting overlay,
- applies descending price sort and verifies row order changes.

If React 19 warns about `act(...)` in this environment, set the standard
`IS_REACT_ACT_ENVIRONMENT` flag in `src/test/setup.ts` instead of ignoring the
warnings.

**Verify**: `bun run test` -> all tests pass

### Step 5: Run the full repository verification sweep

After the refactor and tests land, run the full quality gate so the archive
changes do not regress the lazy surface or production build.

**Verify**: `bun run lint && bun run typecheck && bun run test && bun run build` -> all commands exit 0

## Test plan

- Extend `src/App.lazy.test.tsx`.
- Keep using the existing `renderApp` helper and direct DOM queries; do not
  introduce a separate testing stack just for this change.
- Cover:
  - archive still loads after tab switch,
  - filter overlay is hidden by default and appears on demand,
  - overlay content is not rendered inside the main app container,
  - selecting "Annuali" reduces the visible rows,
  - resetting filters restores all rows,
  - choosing "Prezzo decrescente" changes the row order.

## Done criteria

- [ ] `bun run lint` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run test` exits 0 with an archive overlay regression test added
- [ ] `bun run build` exits 0
- [ ] The archive uses an extracted `DataTable` wrapper backed by TanStack Table
- [ ] Filter and sort controls render in anchored overlays instead of inline cards
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- `src/components/subscriptions-table.tsx` has already been partially migrated
  to TanStack Table and the live code no longer matches the excerpts above.
- The generated shadcn toggle primitives conflict with existing local custom
  primitives of the same name.
- Overlay rendering requires changing the app shell in `src/App.tsx` or other
  out-of-scope layout containers.
- The integration test cannot observe overlay placement without introducing a
  new testing library or large test harness change.

## Maintenance notes

- Future archive features such as pagination, faceted filters, or column
  visibility should extend the TanStack table model rather than reintroducing
  bespoke `useMemo` sorting/filtering state.
- Reviewers should check that row selection still lines up with the filtered
  row model and that the delete actions cannot toggle selection accidentally.
- The overlay test intentionally verifies DOM placement rather than pixel
  layout; if a later UI review needs visual regression coverage, add that as a
  separate follow-up instead of broadening this plan.

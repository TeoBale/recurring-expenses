# Plan 003: Vendor provider logos locally and remove third-party fetches

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5a03707..HEAD -- README.md src/data/subscription-providers.json src/components/add-subscription-dialog.tsx src/components/subscriptions-table.tsx src/components/subscription-card.tsx src/assets public`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-establish-test-baseline.md`
- **Category**: security
- **Planned at**: commit `5a03707`, 2026-07-07

## Why this matters

The README promises a privacy-first app where data never leaves the browser and
there is "no tracking". In reality, provider logos are loaded from `svgl.app`,
which creates third-party network requests whenever preset logos or saved
subscription logos are rendered. That is both a privacy mismatch and an
availability dependency: the app should keep working with zero third-party
requests.

## Current state

- `README.md:3` describes the app as "privacy-first".
- `README.md:12` says "No accounts, no servers, no tracking."
- `src/data/subscription-providers.json:5-8`, `41-44`, and similar entries for
  29 providers point `logoSvg.light` / `logoSvg.dark` to
  `https://svgl.app/library/...`.
- Render sites:
  - `src/components/add-subscription-dialog.tsx:141-155`
  - `src/components/subscriptions-table.tsx:91-113`
  - `src/components/subscription-card.tsx:48-64`
- Recon counted 29 distinct providers and 29 distinct external logo URLs.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `bun run typecheck` | exit 0 |
| Lint | `bun run lint` | exit 0 |
| Tests | `bun run test` | exit 0 |
| Build | `bun run build` | exit 0 |
| URL check | `rg -n "https://svgl.app" src README.md` | no matches in app code or README claims that depend on third-party logos |

## Scope

**In scope**:
- `src/data/subscription-providers.json`
- a new local asset directory under `src/assets/` or `public/`
- the three logo render sites listed above
- `README.md` if wording needs a small clarification after the fix
- targeted tests or smoke checks if the baseline makes them practical

**Out of scope**:
- Rebranding or redesigning provider marks
- Changing the provider catalog itself
- Introducing a runtime image proxy service

## Git workflow

- Work on the current branch.
- Keep the asset migration and any tiny README correction together.
- Do not push until the operator asks for the final batch push.

## Steps

### Step 1: Choose a local asset strategy and apply it consistently

Store each provider logo in the repo so the browser resolves it from the app
origin only. Either of these is acceptable:
- checked-in SVG assets under `src/assets/provider-logos/` imported by Vite
- checked-in SVG assets under `public/provider-logos/` referenced by stable
  local paths

Prefer the option that keeps `subscription-providers.json` simple and avoids
duplicated import glue across components.

**Verify**: `rg -n "https://svgl.app" src/data src/components` -> no matches.

### Step 2: Update data and renderers without changing the visual contract

Preserve the existing `logoSvg.light` / `logoSvg.dark` structure so saved
subscriptions continue to render correctly. If a provider only needs one asset,
it may point both `light` and `dark` to the same local file.

**Verify**: `bun run typecheck` -> exits 0.

### Step 3: Keep the privacy claim honest

If the README’s privacy statement needed the logo fix to become true, leave the
copy in place. If the implementation still has any remaining third-party asset
loads after this plan, tighten the README wording instead of overstating the
guarantee.

**Verify**: `rg -n "https://svgl.app|no tracking|privacy-first" README.md src`
-> review results are consistent with the shipped behavior.

### Step 4: Run the full verification pass

Confirm the repo still builds cleanly and the selected assets are bundled or
copied correctly.

**Verify**: `bun run lint && bun run typecheck && bun run test && bun run build`
-> all commands exit 0.

## Test plan

- Add a focused assertion where it is cheap, for example a utility/data test
  that ensures every provider logo path is local and non-empty.
- If UI tests already exist after plan 001, add one smoke render for a provider
  logo in either the dialog list or a subscription card.
- Manual review aid: search the built code or source for `svgl.app` after the
  change.

## Done criteria

- [ ] No app code or provider data references `https://svgl.app`
- [ ] Provider logos still render via the existing light/dark contract
- [ ] README privacy claims are accurate after the change
- [ ] `bun run lint` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run test` exits 0
- [ ] `bun run build` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- A required provider logo cannot be vendored locally because of licensing or
  provenance concerns discovered during the migration.
- The chosen asset strategy forces a broad refactor of unrelated UI code.
- Saved subscription data would become unreadable without a migration path.

## Maintenance notes

- Future provider additions should add local assets by default; do not reintroduce
  external logo URLs.
- Reviewers should spot-check both light and dark theme variants for providers
  that currently use distinct assets.
- If the catalog grows much further, consider documenting the asset sourcing
  workflow in the repo.

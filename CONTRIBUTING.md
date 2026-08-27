<!-- SPDX-FileCopyrightText: 2026 Bastian Rang and contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Contributing to pwa-template

Thanks for your interest in improving **pwa-template**! This repository is the
shared starting point for new client-only Progressive Web Apps: the toolchain,
the PWA plumbing and the CI/release automation, already wired together.
Contributions — code, docs, or bug reports — are welcome.

> **All changes are reviewed by the maintainer.** Every pull request, regardless
> of size or area, requires a review and approval from
> [@justb81](https://github.com/justb81) before it can be merged. This is
> enforced via [`CODEOWNERS`](CODEOWNERS) and branch protection. Please open an
> issue to discuss anything substantial before investing time in a PR.

Because this is a template, one extra question applies to every change: **does it
belong in the base every app inherits, or in one app built on it?** App-specific
features do not belong here.

## Ways to contribute

- **Report a bug** — open a [Bug report](.github/ISSUE_TEMPLATE/bug_report.yml).
- **Request a feature** — open a [Feature request](.github/ISSUE_TEMPLATE/feature_request.yml).
- **Open a pull request** — see [Development setup](#development-setup) and
  [Submitting a pull request](#submitting-a-pull-request).

## Development setup

Prerequisites: **Node.js** as pinned in [`.nvmrc`](.nvmrc) and **pnpm 10+**.
With [Corepack](https://nodejs.org/api/corepack.html) enabled
(`corepack enable`), the pinned pnpm version from `packageManager` is used
automatically.

```bash
pnpm install        # install dependencies and the Git hooks
pnpm dev            # dev server
pnpm build          # production build into build/
pnpm lint           # eslint
pnpm format:check   # prettier (pnpm format writes)
pnpm typecheck      # svelte-check
pnpm test           # vitest
pnpm test:e2e       # build + playwright
```

Installing also sets up the Git hooks (Husky): `pre-commit` runs
`eslint --fix` + `prettier --write` on staged files, and `commit-msg` runs
commitlint. Set `HUSKY=0` to skip hook installation (that is what CI does).

## Where documentation goes

[`docs/architecture.md`](docs/architecture.md) is the single source of truth for
the architecture. It follows the twelve [arc42](https://arc42.org/) chapters, and
that structure is the point: **put new content in the chapter it belongs to** — a
runtime flow in chapter 6, a cross-cutting concept in chapter 8, a decision with
its reasoning in chapter 9 — rather than appending it wherever it fits. A term the
project relies on goes in the glossary (chapter 12).

Two rules keep it from drifting apart:

- **One content, one place.** If something is already documented, link to it
  instead of restating it. Duplicated prose diverges.
- **References use the chapter number**, e.g. `docs/architecture.md §8.3`.
  `pnpm docs:check` verifies that every such reference resolves, and runs in CI on
  every change — including docs-only ones, which the main pipeline skips.

[`README.md`](README.md) is the entry point for someone using the template, and
[`CLAUDE.md`](CLAUDE.md) is the working brief for coding agents. Keep both in
sync with what the code actually does.

## Branch & commit conventions

- **Branch off `main`.** Use a descriptive branch name, e.g.
  `feat/offline-fallback`, `fix/update-banner`, `docs/contributing`.
- **Conventional Commits** for commit messages and PR titles:
  `type(scope): summary`, e.g. `feat(pwa): add offline fallback page`. Common
  types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `build`,
  `style`. The subject stays lowercase and is not a sentence
  (`feat: add offline page`, not `feat: Add offline page`).
  This is enforced by commitlint (`commit-msg` hook) and drives the automated
  changelog and version bump via release-please.
- Keep commits focused and the history readable; rebase rather than merge `main`
  into your branch when it drifts.

## Quality bar

Before opening a PR, make sure the following pass locally — CI runs the same
checks and a PR will not be merged while they are red:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

- **Tests** — add or update tests for any behavior change. Pure logic lives in
  `src/lib/utils/` and is held to a 90% coverage threshold; co-locate a
  `.spec.ts` next to every new util. Anything that needs a real browser belongs
  in `e2e/`.
- **Docs** — update affected docs in the same change. Don't leave stale
  references behind (see the change policy in [`CLAUDE.md`](CLAUDE.md)).
- **License headers** — source files name both their copyright holder and their
  license, as two adjacent SPDX lines at the top (use the comment syntax of the
  respective language):

  ```ts
  // SPDX-FileCopyrightText: 2026 Bastian Rang and contributors
  // SPDX-License-Identifier: Apache-2.0
  ```

  `pnpm headers:check` verifies this (and `--fix` inserts what is missing); CI
  runs it on every change. Vendored, generated and comment-less files are
  excluded with a documented reason in
  [`scripts/check-spdx-headers.mjs`](scripts/check-spdx-headers.mjs) — never
  widen that list without one. Contributing does not require adding your own
  copyright line: `and contributors` covers it.

## Project constraints (non-negotiable)

These are what make the template what it is (see
[`docs/architecture.md`](docs/architecture.md) §2). PRs that violate them will
not be merged:

- **No backend.** `adapter-static` emits a prerendered shell that runs entirely
  in the browser.
- **No third-party runtime dependencies** — no analytics, no external CDN
  loading, no external calls from the running page.
- **Permissive licenses only** for production dependencies
  (`pnpm licenses:check`).
- **Supply-chain cooldown**: a dependency version is only adopted once it is at
  least seven days old. If a bump PR fails with
  `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, redo the bump locally
  (`pnpm install --lockfile-only`) rather than extending
  `minimumReleaseAgeExclude` — see [`CLAUDE.md`](CLAUDE.md).

## Submitting a pull request

1. Fork the repo (or branch, if you have access) and push your branch.
2. Open a PR against `main`, filling in the
   [pull request template](.github/pull_request_template.md).
3. Make sure CI is green.
4. A maintainer review from [@justb81](https://github.com/justb81) is
   **required** before merge — please be patient and responsive to feedback.

## Code of Conduct

By participating you agree to abide by our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please report security vulnerabilities privately — see
[`SECURITY.md`](SECURITY.md). Do **not** open a public issue for them.

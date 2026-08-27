<!-- SPDX-FileCopyrightText: 2026 Bastian Rang and contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

## Summary

<!-- What does this PR change, and why? Link any related issue, e.g. "Closes #7". -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Docs only
- [ ] Tooling / CI / chore

## Checklist

- [ ] `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass locally
- [ ] `pnpm test:e2e` passes (or the change cannot affect it)
- [ ] Added/updated tests for the change — `src/lib/utils/**` must stay above the coverage threshold
- [ ] Updated affected docs — no stale references left behind (README,
      [CLAUDE.md](../CLAUDE.md), [docs/architecture.md](../docs/architecture.md) as applicable)
- [ ] Source files carry the SPDX copyright + license header (`pnpm headers:check`)

## Constraint impact

<!-- Required. State "none" if not applicable. The constraints below are non-negotiable
     for this template — see docs/architecture.md §2. -->

- [ ] No backend or server-side runtime was introduced
- [ ] No third-party runtime dependency / external CDN / analytics was added
- [ ] The production build still works offline after the first visit

## Reviewer note

> This repository requires a review and approval from the maintainer
> (@justb81) before merge — see [CODEOWNERS](../CODEOWNERS). Thanks for your
> patience!

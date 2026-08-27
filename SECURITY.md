<!-- SPDX-FileCopyrightText: 2026 Bastian Rang and contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Security Policy

This repository is a Progressive Web App template. It has no backend and stores
nothing server-side, but the code it ships is the starting point for other apps —
so a flaw here propagates. Responsible disclosure is appreciated.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
discussions, or pull requests.**

Instead, report privately via GitHub's
[private vulnerability reporting](https://github.com/justb81/pwa_template/security/advisories/new)
("Report a vulnerability" under the repository's **Security** tab). If that is
unavailable to you, contact the maintainer [@justb81](https://github.com/justb81)
privately to arrange a disclosure channel.

Please include:

- A description of the vulnerability and its impact.
- Steps to reproduce, or a proof of concept.
- Affected version / commit, and the browser or deployment setup if relevant.

## What to expect

- We aim to acknowledge a report within a few days.
- We'll keep you informed about the fix and coordinate a disclosure timeline.
- With your consent, we're happy to credit you once the issue is resolved.

## Automated security tooling

Several automated checks guard the codebase and its supply chain. They run on
pull requests and pushes to `main`, plus a weekly schedule:

- **CodeQL** static analysis for JavaScript/TypeScript
  ([`.github/workflows/codeql.yml`](.github/workflows/codeql.yml)) — findings
  surface under **Security → Code scanning**.
- **Dependency audit** (`pnpm audit`, production deps) — fails on any
  high/critical advisory.
- **License compliance** — production dependencies must use an OSI-compatible
  license ([`scripts/check-licenses.mjs`](scripts/check-licenses.mjs)).
- **SBOM** — a CycloneDX software bill of materials is produced per run and
  retained as a downloadable artifact.
- **Dependabot** ([`.github/dependabot.yml`](.github/dependabot.yml)) — grouped,
  cooldown-gated updates for npm packages and GitHub Actions.

On top of that, `minimumReleaseAge` in [`pnpm-workspace.yaml`](pnpm-workspace.yaml)
holds every install — including `--frozen-lockfile` in CI — to the same seven-day
cooldown, so a freshly published compromised version cannot be pulled in by a
manual `pnpm add` either. See [`docs/architecture.md`](docs/architecture.md) §8.3.

**Secret scanning** and **push protection** are expected to be enabled for the
repository (**Settings → Code security**) so that credentials cannot be committed
or pushed.

## Scope

The app is client-only: `adapter-static` emits a prerendered shell that runs
entirely in the browser. The security-relevant areas are therefore:

- The **service worker** ([`src/service-worker.ts`](src/service-worker.ts)) and
  what it caches and serves — a cache-poisoning or stale-content issue here
  survives a reload.
- The **update flow**, which deliberately keeps a newly installed worker in the
  waiting state until the user accepts it.
- The **build and release pipeline** in [`.github/workflows/`](.github/workflows/),
  which has write access to the repository and publishes to GitHub Pages.
- The **dependency graph**, since everything shipped is bundled client-side.

There is no server-side place to keep a secret in an app built on this template:
anything included in the build is public. Reports that depend on that being
misunderstood are out of scope, but feel free to ask if you're unsure.

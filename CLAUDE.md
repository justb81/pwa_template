<!-- SPDX-FileCopyrightText: 2026 Bastian Rang and contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A **client-only Progressive Web App template** (SvelteKit + Svelte 5 + Tailwind 4). It is the base
setup for spinning up a new PWA: the toolchain, PWA plumbing (installable manifest, offline service
worker, opt-in update flow), and CI are already wired together, so a new project starts from a green
build. There is **no backend** — adapter-static emits a prerendered shell that hydrates and then runs
entirely in the browser.

When a real app is built on top of this template, extend this file to describe that app's own
architecture — the sections below document the base the app inherits.

## Commands

| Task                  | Command                                                        |
| --------------------- | -------------------------------------------------------------- |
| Dev server            | `pnpm dev`                                                     |
| Production build      | `pnpm build` → static site in `build/` (adapter-static)        |
| Preview build         | `pnpm preview`                                                 |
| Type-check            | `pnpm typecheck` (runs `svelte-kit sync` + `svelte-check`)     |
| Unit tests (once)     | `pnpm test`                                                    |
| Unit tests (watch)    | `pnpm test:watch`                                              |
| Unit tests + coverage | `pnpm test:coverage`                                           |
| Single test file      | `pnpm exec vitest run src/lib/utils/greeting.spec.ts`          |
| Single test by name   | `pnpm exec vitest run -t "greets a given name"`                |
| End-to-end tests      | `pnpm test:e2e` (`vite build`, then Playwright)                |
| Lint                  | `pnpm lint` (eslint only)                                      |
| Format                | `pnpm format` / `pnpm format:check`                            |
| CI gates (no install) | `pnpm headers:check`, `pnpm docs:check`, `pnpm licenses:check` |

The package manager is **pnpm** (pinned via `packageManager`); `corepack enable` picks up the
right version. `pnpm install` also installs the Husky hooks.

Tests run under Vitest's `server` (Node) project, which only matches `src/**/*.{test,spec}.{js,ts}`
(not `*.svelte.{test,spec}.*`). `requireAssertions` is enabled — every test must make at least one
assertion. Anything that needs a real browser goes in `e2e/` instead: the `chromium` Playwright
project runs against the dev server, `pwa` against `vite preview` of the build (the service worker
only exists there).

## Architecture

The template is deliberately thin. Three areas:

1. **App shell** — `src/app.html`, `src/routes/+layout.svelte`, `src/routes/+layout.ts`,
   `src/routes/+page.svelte`, `src/routes/layout.css`.
   `+layout.ts` sets `ssr = false` + `prerender = true` (client-only static site). `+layout.svelte`
   registers the service worker in production (and sheds any stale worker in dev), renders the
   update banner, and mounts the global `<Toast />`. `+page.svelte` is a placeholder starter page —
   replace it. `layout.css` holds the Tailwind import plus **semantic design tokens** (color / type /
   radius aliases onto Tailwind's palette, e.g. `bg-accent-strong`, `text-danger`) — retune the
   palette there for a new app.

2. **PWA infrastructure** — `src/service-worker.ts` and `src/lib/state/*.svelte.ts`.
   - `service-worker.ts` — cache-first precache of the app shell (`build` + `files` from
     `$service-worker`) for offline use. A newly installed worker deliberately sits in the "waiting"
     state instead of calling `skipWaiting()` itself, so the open page keeps running the version it
     loaded until the user opts in.
   - `state/update.svelte.ts` — `updateStatus` singleton: detects a waiting worker and flips
     `available`, driving the reload banner in `+layout.svelte`; `reload()` posts `SKIP_WAITING`.
   - `state/toast.svelte.ts` — `toast` singleton: transient success/error/info notifications with
     auto-dismiss, `persistent`, and `dedupeKey` de-duplication. Rendered by
     `src/lib/components/ui/Toast.svelte`.
   - `state/windowChrome.svelte.ts` — `windowChrome` singleton: live Window Controls Overlay state
     (installed Chromium-desktop only) for drawing the app header into the OS titlebar; paired with
     the `.app-header[data-wco='true']` block in `layout.css`. Inert everywhere else.

3. **Example pure logic** — `src/lib/utils/greeting.{ts,spec.ts}`.
   A trivial pure helper + its Vitest spec, showing the Node-testable pattern: pure, framework-free
   logic lives in plain `.ts` files (matched by the `server` test project), while anything touching
   the DOM/browser APIs stays in `.svelte.ts` / components. Delete both once you have real code.

### State (Svelte 5 runes singletons)

App-wide state lives in `src/lib/state/*.svelte.ts` as plain classes exported as singletons, using
`$state` runes. Anything touching browser APIs is guarded so it stays inert during SSR/prerender and
in non-supporting environments (`browser` from `$app/environment`, plus feature detection).

## PWA / rendering

- **Client-only.** `+layout.ts` sets `ssr = false` + `prerender = true`; adapter-static emits a
  prerendered shell that hydrates and runs entirely in the browser.
- **Offline.** `service-worker.ts` is registered **manually** from `+layout.svelte` in production;
  SvelteKit's own registration is switched off (`serviceWorker: { register: false }` in
  `vite.config.ts`) so that dev mode registers no worker at all and a cache-first worker from an
  earlier build can never mask fresh dev output. It precaches the shell and static assets
  cache-first.
  The manifest link and `theme-color` are in `src/app.html`; assets are `static/manifest.webmanifest`
  and `static/pwa-icon*`.
- **Installable.** `static/manifest.webmanifest` declares name/icons/display; the icons are
  **placeholders** — replace the SVG + maskable PNGs (192/512) for a real app.

## CI / release

`.github/` is preconfigured:

- **CI** (`ci.yml`) — one `Lint · Typecheck · Test · Build` job plus `E2E (Playwright)`. Skips
  docs-only changes via `paths-ignore`.
- **Docs & license gate** (`headers.yml`) — `check-spdx-headers.mjs` + `check-doc-refs.mjs`,
  deliberately **without** `paths-ignore` so it covers exactly what `ci.yml` skips. Both scripts
  are dependency-free, so this job runs without `pnpm install`.
- **CodeQL** (`codeql.yml`) and **Security** (`security.yml`: `pnpm audit`, license allowlist,
  CycloneDX SBOM) — on relevant changes plus weekly.
- **Dependabot** (`dependabot.yml`) — weekly grouped PRs with a 7-day cooldown.
- **release-please** (`release-please.yml` + `release-please-config.json` +
  `.release-please-manifest.json`) — raises the version/changelog PR from Conventional Commits,
  reformats its own output to satisfy `format:check`, and calls `deploy.yml` once a release is
  created.
- **deploy** (`deploy.yml`) — `workflow_call`/`workflow_dispatch` only. Builds with `BASE_PATH` set
  to the Pages subpath and publishes to GitHub Pages. No PAT required; `RELEASE_PLEASE_TOKEN` is
  optional and only makes CI run on the release PR itself.

## Conventions & gotchas

- **There is no `svelte.config.js`.** SvelteKit config (the static adapter and the forced-runes
  `compilerOptions`) lives inside the `sveltekit()` plugin call in `vite.config.ts`. Change SvelteKit
  options there.
- **Runes are forced on** for all app code (everything outside `node_modules`). Use `$state` /
  `$derived` / `$props`; stores are plain classes in `.svelte.ts` files exported as singletons.
- **Relative imports use explicit `.js` extensions** (tsconfig `rewriteRelativeImportExtensions`).
  Use the `$lib` alias for `src/lib`.
- **Nothing touching the DOM may run at module top-level or during SSR/prerender.** Guard with
  `browser` from `$app/environment` and feature-detect optional browser APIs.
- **Renaming for a new app:** `name` in `package.json`, `package-name` in `release-please-config.json`,
  `name`/`short_name`/`description` in `static/manifest.webmanifest`, the `theme-color` in
  `src/app.html` + manifest, the design tokens in `src/routes/layout.css`, and the cache prefix /
  build-log tag (`pwa-` / `[pwa]`) in `service-worker.ts` / `+layout.svelte`. Also swap the SPDX
  copyright holder (see below), `NOTICE`, `CODEOWNERS` and the URLs in `SECURITY.md` /
  `.github/ISSUE_TEMPLATE/config.yml`.
- **Commits**: commitlint enforces Conventional Commits with a **lowercase, non-sentence-case
  subject** (`feat(pwa): add offline page`, not `feat: Add offline page`). Husky runs
  `eslint --fix` + `prettier --write` on staged files at commit time; `HUSKY=0` disables both
  (that is the CI path).
- **SPDX headers are gated in CI** — every first-party file opens with
  `SPDX-FileCopyrightText: 2026 Bastian Rang and contributors` followed by
  `SPDX-License-Identifier: Apache-2.0`, in the comment syntax of its language.
  `pnpm headers:check` verifies it (`--fix` inserts what is missing) and
  `.github/workflows/headers.yml` runs it on **every** change. A file type absent from
  `STYLE_BY_EXTENSION` in `scripts/check-spdx-headers.mjs` is not checked at all — that is how
  JSON, the web app manifest and the icons stay out without an exclude. Real excludes carry a
  per-entry reason; never widen that list without one, and never put our copyright on
  third-party code.
- **`docs/architecture.md` is the single source of truth** (arc42, twelve chapters). Cite it as
  `docs/architecture.md §N`; `pnpm docs:check` verifies that every such reference resolves, so a
  renumbered chapter fails CI rather than rotting silently. Put new architecture content in the
  chapter it belongs to rather than appending it.
- **Coverage gate**: `src/lib/utils/**` must stay ≥ 90 % (statements/branches/functions/lines) —
  co-locate a `.spec.ts` for every new util. Components and `src/lib/state/**` are excluded from
  coverage on purpose: the Vitest `server` project is Node-only and never runs them, so they are
  covered by the Playwright suite in `e2e/` instead.
- **`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` on a Dependabot PR = resolver drift, not a stale
  lockfile.** pnpm verifies every lockfile entry against `minimumReleaseAge` (7 days) on **every**
  install, `--frozen-lockfile` included, so all install-dependent jobs go red at once. Dependabot
  regenerates the lockfile with its own resolver, which ignores the policy. Fix: redo the bump
  locally — edit the manifest, then `pnpm install --lockfile-only`, where pnpm applies the cooldown
  _during_ resolution; confirm `git diff pnpm-lock.yaml` touches only the intended package. Do
  **not** extend `minimumReleaseAgeExclude` — that allowlist is for deliberate exceptions, not for
  laundering drift.
- **e2e in a sandbox without the pinned browser**: run
  `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium pnpm exec playwright test --project=chromium`.

## Repository hygiene & change policy

- **No outdated content in the repo.** Code, docs, comments, examples, and configuration must
  always reflect the current state. When you change something, update everything it touches in the
  same change — never leave stale references, dead code, obsolete docs, or superseded files behind.
  If you find existing content that is out of date, fix or remove it.
- **No backward-compatibility guarantee by default.** When changing an interface, API, schema, data
  format, or config, prefer the clean, correct result over preserving the old shape. Do not add
  compatibility shims, deprecation layers, dual-path handling, or migration fallbacks unless
  backward compatibility is explicitly requested. Update all call sites and consumers directly
  instead.

## Issue & PR workflow

- **Tick off completed checkboxes.** When a change completes task checkboxes in the issue(s) it
  addresses, update the issue body to mark those boxes `- [x]` as part of the same work — don't
  leave finished tasks unchecked.
- **Auto-close issues from the PR.** When a PR fully resolves an issue, add a `Closes #<n>` line to
  the PR body so GitHub closes it on merge. List one `Closes #<n>` per fully-resolved issue. Use
  `Refs #<n>` (not `Closes`) for issues the PR only touches partially.

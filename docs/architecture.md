<!-- SPDX-FileCopyrightText: 2026 Bastian Rang and contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Architecture

The single source of truth for this project's architecture, structured along the twelve
[arc42](https://arc42.org/) chapters. Put new architecture content in the chapter it belongs to
rather than appending it, and cite it from code and docs as `docs/architecture.md §N` — those
references are verified by `pnpm docs:check`.

As shipped, this repository is a **template**: the chapters below describe the base that an app
built on it inherits. Replace the content with the real app's architecture as it grows; keep the
chapter numbering, because the references point at it.

## 1. Introduction and Goals

A client-only Progressive Web App template (SvelteKit + Svelte 5 + Tailwind 4). It exists so a new
PWA starts from a green build with the toolchain, the PWA plumbing and the CI/release automation
already wired together, rather than from an empty directory.

### 1.1 Quality goals

Installable and offline-capable out of the box; no server to operate; a change is either green
across every gate in §10 or it does not merge.

### 1.2 Stakeholders

The maintainer (see `CODEOWNERS`), and anyone starting a new app from this template.

## 2. Constraints

- **No backend.** `adapter-static` emits a prerendered shell that hydrates and then runs entirely
  in the browser. Anything requiring a server is out of scope for the template itself.
- **No third-party runtime dependencies.** No analytics, no CDN loading, no external calls from the
  running page — everything the app needs is part of the build output.
- **Permissive licenses only.** Production dependencies must carry an OSI-approved permissive
  license; `pnpm licenses:check` enforces the allowlist in `scripts/check-licenses.mjs`.
- **Apache-2.0 with per-file SPDX headers.** See §8.4.

## 3. Context and Scope

The app is delivered as static files over HTTPS and runs in the user's browser. It has no external
system it talks to; the only outward interfaces are the browser platform APIs (service worker,
web app manifest, storage) and the hosting origin that serves the build output.

## 4. Solution Strategy

Client-only rendering with a prerendered shell, a hand-written service worker for offline use, and
app-wide state as Svelte 5 runes singletons. Every architectural decision that constrains later
work is recorded in §9.

## 5. Building Block View

### 5.1 App shell

`src/app.html`, `src/routes/+layout.svelte`, `src/routes/+layout.ts`, `src/routes/+page.svelte`,
`src/routes/layout.css`. `+layout.ts` sets `ssr = false` + `prerender = true`. `+layout.svelte`
registers the service worker in production (and sheds a stale worker in dev), renders the update
banner and mounts the global toast host. `layout.css` holds the Tailwind import plus the semantic
design tokens.

### 5.2 PWA infrastructure

`src/service-worker.ts` precaches the app shell cache-first. `src/lib/state/update.svelte.ts`
detects a waiting worker and drives the reload banner; `state/toast.svelte.ts` is the notification
singleton; `state/windowChrome.svelte.ts` tracks Window Controls Overlay state.

### 5.3 Pure logic

`src/lib/utils/` holds framework-free logic in plain `.ts` files — the only tree the coverage gate
in §10 holds to a hard threshold.

## 6. Runtime View

First visit: the prerendered shell loads, hydrates, and the service worker installs and precaches.
Return visit: the shell is served from cache, so the app starts offline. When a new worker is
installed it deliberately stays in the "waiting" state rather than calling `skipWaiting()` itself;
the open page keeps running the version it loaded until the user accepts the update banner, which
posts `SKIP_WAITING` and reloads.

## 7. Deployment View

`npm`-free, pnpm-based build producing a static `build/` directory. `.github/workflows/deploy.yml`
is called by the release workflow, builds with `BASE_PATH` set to the GitHub Pages subpath and
publishes the artifact to Pages. Any static host works equally well.

## 8. Cross-cutting Concepts

### 8.1 State

App-wide state lives in `src/lib/state/*.svelte.ts` as plain classes exported as singletons, using
`$state` runes. Anything touching browser APIs is guarded so it stays inert during prerender and in
non-supporting environments.

### 8.2 Offline and caching

The service worker precaches the build output and static assets cache-first. It is the only place
caching policy is expressed.

### 8.3 Supply-chain hygiene

A newly published dependency version may only be adopted once it is at least seven days old. This
is enforced twice: `cooldown` in `.github/dependabot.yml` for bump PRs, and `minimumReleaseAge` in
`pnpm-workspace.yaml` at install time — including on `pnpm install --frozen-lockfile`, which
re-verifies every entry already in the lockfile.

### 8.4 Licensing

Apache-2.0. Every first-party file opens with an SPDX copyright line followed by the license
identifier, in the comment syntax of its language; `pnpm headers:check` verifies it and
`--fix` inserts what is missing. Vendored, generated and comment-less files are excluded with a
per-entry reason in `scripts/check-spdx-headers.mjs`.

## 9. Architecture Decisions

- **Client-only over SSR.** No server to run, host or secure; the cost is no server-rendered HTML
  for crawlers and no request-time data.
- **Opt-in service-worker updates.** A silently swapped worker can replace the app mid-interaction;
  the waiting-worker + banner flow (§6) trades one extra click for that guarantee.
- **Runes singletons over stores.** Runes are the forward-looking Svelte 5 API and keep state
  classes plain and unit-testable.
- **SPDX headers over REUSE.** Full REUSE conformance would need a `REUSE.toml` asserting copyright
  over JSON and binary files, some of which are generated or vendored — a claim this project will
  not make. See the rationale at the top of `scripts/check-spdx-headers.mjs`.
- **pnpm over npm.** npm has no install-time equivalent of `minimumReleaseAge` (§8.3).

## 10. Quality Requirements

Every change passes, locally and in CI: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`,
`pnpm test` (with the coverage threshold on `src/lib/utils/**`), `pnpm build` and the Playwright
end-to-end suite. Independently of those, and without the `paths-ignore` the CI pipeline uses,
`pnpm headers:check` and `pnpm docs:check` run on **every** change. CodeQL, `pnpm audit`, the
license allowlist and an SBOM run on dependency changes and weekly.

## 11. Risks and Technical Debt

- The PWA icons in `static/` are placeholders and must be replaced before a real release.
- `src/lib/utils/greeting.ts` and its spec are illustrative and meant to be deleted once real code
  exists — the coverage threshold is scoped to that directory and needs a real inhabitant.
- Being client-only, there is no server-side place to keep a secret; anything shipped is public.

## 12. Glossary

| Term      | Meaning                                                                                    |
| --------- | ------------------------------------------------------------------------------------------ |
| App shell | The prerendered HTML/CSS/JS skeleton cached for offline start-up.                          |
| BASE_PATH | Build-time subpath prefix, set by the deploy workflow for GitHub Pages project sites.      |
| Cooldown  | Minimum age a published dependency version must reach before adoption (§8.3).              |
| SPDX      | Machine-readable license/copyright metadata carried in each file header (§8.4).            |
| WCO       | Window Controls Overlay — the installed-desktop mode that draws the app into the titlebar. |

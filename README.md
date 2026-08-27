<!-- SPDX-FileCopyrightText: 2026 Bastian Rang and contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# pwa_template

A Svelte-based **Progressive Web App** template — the base setup for spinning up a new
client-only PWA. It ships with the toolchain, PWA plumbing, and CI already wired together,
so a new project starts from a green build instead of a blank folder.

## Stack

- **[SvelteKit](https://svelte.dev/docs/kit)** + **[Svelte 5](https://svelte.dev/docs/svelte)** (forced runes mode)
- **[Tailwind CSS 4](https://tailwindcss.com)** with `@tailwindcss/forms` and semantic design tokens
- **[adapter-static](https://svelte.dev/docs/kit/adapter-static)** — a fully client-only, prerendered site (no server)
- **[Vitest](https://vitest.dev)** for unit tests (with a coverage gate) and
  **[Playwright](https://playwright.dev)** for end-to-end tests, **ESLint** + **Prettier** for
  lint/format, **commitlint** + **Husky** for commit hygiene
- **TypeScript** throughout

## What's included

- **Installable PWA** — web manifest, standalone display, maskable icons, `theme-color`.
- **Offline support** — a cache-first service worker (`src/service-worker.ts`) that precaches
  the app shell, with an **opt-in update banner** (`$lib/state/update.svelte.ts`) instead of a
  silent mid-session takeover.
- **App-wide toasts** — `$lib/state/toast.svelte.ts` + `Toast.svelte`.
- **Window Controls Overlay** support for installed desktop apps (`$lib/state/windowChrome.svelte.ts`).
- **Semantic design tokens** — color / type / radius aliases onto Tailwind's palette in `layout.css`.
- **CI/CD & supply-chain automation** (under `.github/`) — the full gate on every PR, a docs &
  license gate that runs even on docs-only changes, CodeQL, dependency audit, license allowlist,
  SBOM, cooldown-gated Dependabot, release-please, and deploy-to-GitHub-Pages on release.
- **Editor + agent config** — `.vscode/` recommended extensions and a `.claude/` + `CLAUDE.md` for
  working in the repo with [Claude Code](https://claude.com/claude-code).

## Quick start

```bash
corepack enable   # use the pnpm version pinned in package.json
pnpm install      # install dependencies and the Git hooks
pnpm dev          # start the dev server (http://localhost:5173)
pnpm build        # produce the static site in build/
pnpm preview      # serve the production build locally
```

Requires Node 22+ and pnpm 10+; `.nvmrc` pins the version CI uses.

## Project structure

```
src/
  app.html                  # HTML shell: manifest link, theme-color, viewport
  app.d.ts                  # ambient types (incl. Window Controls Overlay)
  service-worker.ts         # cache-first offline precache + update handshake
  routes/
    +layout.svelte          # SW registration, update banner, global <Toast/>
    +layout.ts              # ssr = false, prerender = true (client-only static)
    +page.svelte            # placeholder starter page — replace this
    layout.css              # Tailwind import + semantic design tokens
  lib/
    components/ui/Toast.svelte
    state/                  # Svelte 5 runes singletons (browser-guarded)
      toast.svelte.ts       #   transient notifications
      update.svelte.ts      #   service-worker update detection
      windowChrome.svelte.ts#   Window Controls Overlay state
    utils/greeting.{ts,spec.ts}  # example pure logic + test — delete when real code lands
e2e/                        # Playwright specs (smoke + PWA against the built output)
scripts/                    # dependency-free CI gates (SPDX headers, licenses, doc refs)
docs/architecture.md        # arc42 single source of truth — cited as §N, verified in CI
static/                     # manifest.webmanifest, placeholder icons, robots.txt
.github/                    # CI, docs & license gate, CodeQL, security, release, Pages deploy
```

## Commands

| Task                  | Command                                              |
| --------------------- | ---------------------------------------------------- |
| Dev server            | `pnpm dev`                                           |
| Production build      | `pnpm build` → static site in `build/`               |
| Preview build         | `pnpm preview`                                       |
| Type-check            | `pnpm typecheck`                                     |
| Unit tests            | `pnpm test` (once) / `pnpm test:watch` (watch)       |
| Unit tests + coverage | `pnpm test:coverage`                                 |
| End-to-end tests      | `pnpm test:e2e` (builds first, then runs Playwright) |
| Lint                  | `pnpm lint` (`pnpm lint:fix` writes)                 |
| Format                | `pnpm format` (`pnpm format:check` verifies)         |
| SPDX headers          | `pnpm headers:check` (`--fix` inserts)               |
| Doc references        | `pnpm docs:check`                                    |
| Dependency licenses   | `pnpm licenses:check`                                |
| Dependency audit      | `pnpm audit`                                         |

Tests run under Vitest's `server` (Node) project, which matches `src/**/*.{test,spec}.{js,ts}`
(not `*.svelte.{test,spec}.*`). `requireAssertions` is on — every test must assert at least once.
`src/lib/utils/**` carries a 90% coverage threshold. Browser-dependent behaviour is covered by
Playwright in `e2e/`: the `chromium` project runs against the dev server, `pwa` against
`vite preview` of the production build, because the service worker is not registered in dev.

## Using this template

1. **Create a repo from this template** (or clone it), then `corepack enable && pnpm install`.
2. **Rename the project** — update `name` in `package.json`, `package-name` in
   `release-please-config.json`, the `name`/`short_name`/`description` in
   `static/manifest.webmanifest`, and the cache prefix / build-log tag (`pwa-` / `[pwa]`) in
   `src/service-worker.ts` and `src/routes/+layout.svelte`.
3. **Replace the placeholder icons** in `static/` (`pwa-icon*.svg` / `pwa-icon*.png`) and the
   `theme-color` in `src/app.html` + the manifest with your brand.
4. **Retune the design tokens** at the top of `src/routes/layout.css` for your palette.
5. **Claim the copyright** — replace `COPYRIGHT_HOLDER` in
   `scripts/check-spdx-headers.mjs`, then the SPDX line across the repo
   (`git grep -l SPDX-FileCopyrightText | xargs sed -i 's/old/new/'`), and update `NOTICE`.
   `pnpm headers:check` verifies the result.
6. **Point the governance files at your repo** — `CODEOWNERS`, the contact links in
   `.github/ISSUE_TEMPLATE/config.yml`, and the advisory URL in `SECURITY.md`.
7. **Start building** in `src/routes/+page.svelte` and `src/lib/`. Delete the example
   `src/lib/utils/greeting.*` and the placeholder specs in `e2e/`.
8. **Rewrite `docs/architecture.md`** for your app, keeping the arc42 chapter numbering — code
   comments cite it as `docs/architecture.md §N` and `pnpm docs:check` verifies those references.
9. **Update `CLAUDE.md`** to describe your app's own architecture as it grows.

### Git hooks

`pnpm install` installs the Husky hooks: `pre-commit` runs `eslint --fix` +
`prettier --write` over staged files (lint-staged), and `commit-msg` runs commitlint. Commit
subjects must be lowercase Conventional Commits (`feat: add offline page`, not
`feat: Add offline page`) — release-please derives the version and changelog from them. Set
`HUSKY=0` to skip hook installation; that is what CI does.

### Continuous integration & branch protection

Three workflows gate a pull request:

| Workflow      | Required status check                        | Runs on                                |
| ------------- | -------------------------------------------- | -------------------------------------- |
| `ci.yml`      | `Lint · Typecheck · Test · Build`            | code/config changes (docs are skipped) |
| `ci.yml`      | `E2E (Playwright)`                           | same                                   |
| `headers.yml` | `SPDX headers + architecture-doc references` | **every** change, including docs-only  |

Set all three as required status checks under **Settings → Branches**, and enable **Require review
from Code Owners** so `CODEOWNERS` takes effect. The names above are exactly what the checks report;
keep them stable — a matrix job would append its value to the name (`… Build (26)`) and the
required check would silently stop matching the next time that value changed, leaving the branch
ungated. That is why the Node version lives only in `.nvmrc`. The split is deliberate: `ci.yml` skips
documentation changes because they cannot affect lint or the build, so the header and
doc-reference checks — which are plain Node with no install — run separately without that
exclusion.

### Dependency hygiene (supply-chain cooldown)

A newly published version is only adopted once it is at least seven days old. This is enforced
twice: `cooldown` in `.github/dependabot.yml` for bump PRs, and `minimumReleaseAge` in
`pnpm-workspace.yaml` at install time — including on `pnpm install --frozen-lockfile`, which
re-verifies every entry already in the lockfile.

That second half is what makes a Dependabot PR occasionally fail with
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`: Dependabot regenerates the lockfile with its own
resolver, which ignores the policy. Fix it by redoing the bump locally — edit the manifest, run
`pnpm install --lockfile-only`, and confirm the lockfile diff touches only the intended package.
Do not extend `minimumReleaseAgeExclude`; that allowlist is for deliberate exceptions.

### Security & supply-chain automation

`codeql.yml` and `security.yml` run on relevant changes and weekly: CodeQL static analysis,
`pnpm audit` (production dependencies, fails on high/critical), a license allowlist over
production dependencies (`scripts/check-licenses.mjs`), and a CycloneDX SBOM kept as an artifact.
Enable **secret scanning** and **push protection** under **Settings → Code security**, plus private
vulnerability reporting so the link in `SECURITY.md` works.

### License headers

Every first-party file opens with two adjacent SPDX lines naming the copyright holder and the
license, in the comment syntax of its language. `pnpm headers:check` verifies this and `--fix`
inserts what is missing. A file type absent from `STYLE_BY_EXTENSION` in
`scripts/check-spdx-headers.mjs` is not checked at all — that is how JSON, the web app manifest
and the icons stay out without an exclude. Real excludes each state their reason; never widen the
list without one.

### GitHub Pages / release flow

release-please raises the version/changelog PR from
[Conventional Commits](https://www.conventionalcommits.org); merging it tags a release and, in the
same run, calls `deploy.yml`, which builds with `BASE_PATH` set to the repo's Pages subpath and
publishes. The deploy is invoked from the release-please workflow rather than by a
`release: published` event on purpose — a release event runs in tag context, where the
`github-pages` environment's default-branch protection rejects the deployment.

No PAT is required. `RELEASE_PLEASE_TOKEN` is optional and only buys one thing: CI running on the
release PR itself, which pushes made with the default `GITHUB_TOKEN` cannot trigger. Pages is
enabled by the workflow token (`configure-pages` with `enablement: true`), so no manual visit to
**Settings → Pages** is needed either.

## Conventions & gotchas

- **There is no `svelte.config.js`.** SvelteKit config (the static adapter and the forced-runes
  `compilerOptions`) lives inside the `sveltekit()` call in `vite.config.ts`.
- **Runes are forced on** for all app code. Use `$state` / `$derived` / `$props`; stores are plain
  classes in `.svelte.ts` files exported as singletons.
- **Relative imports use explicit `.js` extensions** (tsconfig `rewriteRelativeImportExtensions`).
  Use the `$lib` alias for `src/lib`.
- **Nothing touching the DOM may run at module top-level during SSR/prerender.** Guard with
  `browser` from `$app/environment` and feature-detect optional browser APIs.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the development setup, the commit convention and the
quality bar, and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Every pull request needs a maintainer
review — see [`CODEOWNERS`](CODEOWNERS).

## Security

Report vulnerabilities privately, never as a public issue — see [`SECURITY.md`](SECURITY.md).

## License

Apache-2.0 — see [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE).

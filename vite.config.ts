// SPDX-FileCopyrightText: 2026 Bastian Rang and contributors
// SPDX-License-Identifier: Apache-2.0
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
      },
      adapter: adapter(),
      // Register manually instead (see +layout.svelte): dev mode never registers one at
      // all, so a cache-first worker from a previous build can never mask fresh dev output.
      serviceWorker: { register: false },
      // GitHub Pages serves project sites from a /<repo-name> subpath. The deploy
      // workflow sets BASE_PATH accordingly; local dev/build defaults to root.
      paths: { base: (process.env.BASE_PATH ?? '') as '' | `/${string}` },
    }),
  ],
  test: {
    expect: { requireAssertions: true },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Only the framework-free logic under src/lib is measured. Components and
      // the browser-API state singletons are exercised by the Playwright suite,
      // not by the Node test project, so counting them here would report a floor
      // no unit test can raise.
      include: ['src/lib/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.svelte', 'src/lib/state/**'],
      thresholds: {
        // Pure logic lives here and must stay well covered — co-locate a
        // .spec.ts for every new util.
        'src/lib/utils/**': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
        },
      },
    ],
  },
});

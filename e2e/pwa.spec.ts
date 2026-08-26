// SPDX-FileCopyrightText: 2026 Bastian Rang and contributors
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

// These run against `vite preview` of the production build (see playwright.config.ts):
// the service worker is not registered in dev, so a dev-server run would prove nothing.

test('the web app manifest is served and installable', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();

  const response = await request.get(new URL(href!, page.url()).toString());
  expect(response.ok()).toBe(true);

  const manifest = JSON.parse(await response.text());
  expect(manifest.name).toBeTruthy();
  expect(manifest.start_url).toBeTruthy();
  expect(manifest.display).toBe('standalone');
  // A maskable icon is what keeps the installed launcher icon from being letterboxed.
  expect(
    manifest.icons.some((icon: { purpose?: string }) => icon.purpose?.includes('maskable')),
  ).toBe(true);
});

test('the service worker registers and takes control', async ({ page }) => {
  await page.goto('/');
  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.scope;
  });
  expect(scope).toContain('localhost');
});

// SPDX-FileCopyrightText: 2026 Bastian Rang and contributors
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

// Smoke coverage for the app shell: it hydrates, and the global toast host that
// every app built on this template inherits actually renders a notification.
// Replace these with the real app's flows; keep at least one that proves
// hydration, because a client-only build fails silently without it.

test('the shell renders and hydrates', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('PWA Template');
  // Only an interactive (hydrated) page exposes a working button.
  await expect(page.getByRole('button', { name: 'Show a toast' })).toBeEnabled();
});

test('the toast host shows and dismisses a notification', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Show a toast' }).click();

  const toast = page.getByText('It works! Toasts are wired up.');
  await expect(toast).toBeVisible();
  await expect(toast).toBeHidden({ timeout: 15_000 });
});

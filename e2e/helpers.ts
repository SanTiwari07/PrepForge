import { expect, type Page } from '@playwright/test';
import type { PersistedState } from '../src/store/types';

export const STORAGE_KEY = 'prepforge:v1';

/** Reads the persisted store (zustand persist format: { state, version }). */
export async function readState(page: Page): Promise<PersistedState> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{"state":{}}').state, STORAGE_KEY);
}

/** Skips onboarding so pages render their normal state. */
export async function onboard(page: Page) {
  await page.goto('/');
  const skip = page.getByRole('button', { name: 'Skip for now' });
  if (await skip.isVisible()) await skip.click();
  await expect(page.getByRole('heading', { name: 'Set up your plan (30 seconds)' })).toHaveCount(0);
}

export async function noHorizontalOverflow(page: Page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw, `scrollWidth ${sw} > innerWidth ${iw} on ${page.url()}`).toBeLessThanOrEqual(iw);
}

/** Fails the test on any console error or uncaught page error. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  return errors;
}

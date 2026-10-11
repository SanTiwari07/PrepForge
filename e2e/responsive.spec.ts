// Visual pass (what_to_do.md Section 14): key screens at 7 widths. Each must render without
// errors or horizontal overflow; screenshots land in test-results/screens for review.
import { expect, test } from '@playwright/test';
import { noHorizontalOverflow, onboard, trackErrors } from './helpers';

const WIDTHS = [320, 375, 768, 1024, 1440, 1920, 2560];
const ROUTES = [
  { name: 'dashboard', path: '/', ready: '1. What should I study today?' },
  { name: 'topic', path: '/learn/dsa/dsa.sliding-window', ready: 'Sliding Window' },
  { name: 'coach', path: '/problems/two-sum', ready: 'Two Sum' },
  { name: 'sql-lab', path: '/sql/lab', ready: 'SQL' },
  { name: 'analytics', path: '/analytics', ready: 'Readiness' },
  { name: 'oa', path: '/oa', ready: 'Presets' },
];

for (const width of WIDTHS) {
  test(`screens render without overflow at ${width}px`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width, height: 900 });
    await onboard(page);
    for (const r of ROUTES) {
      await page.goto(r.path);
      await expect(page.getByRole('heading', { name: r.ready }).first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      await noHorizontalOverflow(page);
      await page.screenshot({ path: `test-results/screens/${r.name}-${width}.png`, fullPage: false });
    }
    // The OA runner is a full-screen layout of its own.
    await page.goto('/oa');
    await page.locator('.card', { hasText: 'DSA concepts sprint' }).getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText('Question 1 of 15')).toBeVisible();
    await noHorizontalOverflow(page);
    await page.screenshot({ path: `test-results/screens/oa-runner-${width}.png` });
    expect(errors).toEqual([]);
  });
}

test('touch targets in the mobile bottom bar are at least 44px tall', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await onboard(page);
  const heights = await page.locator('.bottombar a').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  expect(heights.length).toBeGreaterThan(0);
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
});

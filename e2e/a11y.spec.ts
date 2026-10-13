// Accessibility pass: axe-core on the main screens. Fails on serious or critical violations.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { onboard } from './helpers';

const ROUTES = ['/', '/learn', '/learn/dsa/dsa.sliding-window', '/learn/dsa/dsa.sliding-window?tab=mcqs', '/problems', '/problems/two-sum', '/practice/patterns', '/sql/lab', '/sql/exercises/sql-manager-names', '/oa', '/revision', '/analytics', '/companies', '/tools', '/settings'];

for (const path of ROUTES) {
  test(`no serious axe violations on ${path}`, async ({ page }) => {
    await onboard(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main h1').first()).toBeVisible();
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
  });
}

test('keyboard: skip link moves focus to the main content', async ({ page }) => {
  await onboard(page);
  await page.goto('/learn');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

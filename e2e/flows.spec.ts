// Core flows from what_to_do.md Section 14, run against the production build.
import { expect, test } from '@playwright/test';
import { MCQ_BY_ID } from '../src/content/all';
import { onboard, readState, trackErrors } from './helpers';

test.describe.configure({ mode: 'parallel' });

test('first run: onboarding, then the dashboard shows honest empty states', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Set up your plan (30 seconds)' })).toBeVisible();
  await page.getByLabel('Your first name (optional)').fill('Asha');
  await page.getByRole('button', { name: 'Java' }).click();
  await page.getByRole('button', { name: 'Save and build my plan' }).click();
  await expect(page.getByRole('heading', { name: '1. What should I study today?' })).toBeVisible();
  await expect(page.getByText('Nothing due')).toBeVisible();
  await expect(page.getByText('No weak spots detected yet')).toBeVisible();
  const s = await readState(page);
  expect(s.profile).toMatchObject({ name: 'Asha', preferredLang: 'java', onboarded: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Set up your plan (30 seconds)' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('topic: read a section and answer an MCQ; both persist across a reload', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/learn/dsa/dsa.heaps');
  await page.getByLabel('Mark this section as read').first().check();
  await page.getByRole('tab', { name: /MCQs/ }).click();
  await expect(page.getByText('Question 1 of 7')).toBeVisible();
  await page.getByRole('radiogroup', { name: 'Options' }).getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText(/Only your first attempt/)).toBeVisible();

  await page.reload();
  const s = await readState(page);
  expect(s.mcqAttempts).toHaveLength(1);
  expect(s.mcqAttempts[0]).toMatchObject({ firstSeen: true });
  expect(s.topicProgress['dsa.heaps'].sectionsRead).toHaveLength(1);
  const correct = s.mcqAttempts[0].correct ? 1 : 0;
  await expect(page.getByText(`First-try MCQs: ${correct}/1 correct`)).toBeVisible();
  await expect(page.getByText('Reading completion').locator('..')).not.toContainText(' 0%');
  expect(errors).toEqual([]);
});

test('coach: hints, then logging the outcome creates a revision card due tomorrow', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/problems/two-sum');
  await expect(page.getByText('Progressive hints')).toBeVisible();
  await page.getByRole('button', { name: 'Reveal' }).first().click();
  await page.getByRole('button', { name: 'Log outcome' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Yes, it passed' }).click();
  await expect(dialog.getByText('This will be recorded as solved with hints.', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Save attempt' }).click();
  await expect(page.getByText(/Added to your revision queue/)).toBeVisible();

  const s = await readState(page);
  const attempts = s.problemProgress['two-sum'].attempts;
  expect(attempts).toHaveLength(1);
  expect(attempts[0]).toMatchObject({ outcome: 'with-hints', hintsUsed: 1, solutionViewed: false });
  const card = Object.values(s.reviewCards).find((c) => c.kind === 'problem' && c.refId === 'two-sum');
  const tomorrow = await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  expect(card?.due).toBe(tomorrow);
  expect(errors).toEqual([]);
});

test('OA: mark for review, reload mid-test, auto-submit at time-out, exact score', async ({ page }) => {
  const errors = trackErrors(page);
  await page.clock.install();
  await onboard(page);
  await page.goto('/oa');
  await page.locator('.card', { hasText: 'DSA concepts sprint' }).getByRole('button', { name: 'Start' }).click();
  await expect(page).toHaveURL(/\/oa\/run\//);
  await expect(page.getByText('Question 1 of 15')).toBeVisible();

  // Answer the first 5 questions with the first option and mark question 2.
  for (let k = 0; k < 5; k++) {
    await page.locator('.mcq__options button').first().click();
    if (k === 1) await page.getByRole('button', { name: 'Mark for review' }).click();
    await page.getByRole('button', { name: 'Save and next' }).click();
  }
  await expect(page.getByText('Question 6 of 15')).toBeVisible();

  // Reload mid-test: answers, marks and position survive.
  await page.reload();
  await expect(page.getByText('Question 6 of 15')).toBeVisible();
  await expect(page.getByRole('button', { name: /Question 2, answered, marked for review/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Question 5, answered/ })).toBeVisible();

  // Let the 20-minute timer run out: the runner submits by itself.
  await page.clock.fastForward('20:05');
  await expect(page).toHaveURL(/\/oa\/results\//, { timeout: 15_000 });

  const s = await readState(page);
  const a = s.assessments[s.assessments.length - 1];
  let expected = 0;
  for (const it of a.items) {
    const sel: string[] = a.answers[it.id]?.selected ?? [];
    const q = MCQ_BY_ID.get(it.refId)!;
    if (sel.length && [...sel].sort().join() === [...q.correct].sort().join()) expected += 1;
  }
  expect(Object.keys(a.answers)).toHaveLength(5);
  expect(a.result?.score).toBe(expected);
  expect(a.result?.autoTotal).toBe(15);
  await expect(page.getByText(`${expected}/15`, { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('SQL: a wrong query fails on hidden data, the correct one passes', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/sql/exercises/sql-manager-names');
  const editor = page.locator('textarea.sql-editor');
  await editor.fill('SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id;');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText(/Not correct yet|wrong on a hidden edge case/)).toBeVisible();
  await editor.fill('SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id;');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Correct on every dataset')).toBeVisible();
  const s = await readState(page);
  expect(s.sqlAttempts.map((x) => x.passedAll)).toEqual([false, true]);
  expect(errors).toEqual([]);
});

test('settings: export, reset, then import restores the data', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/settings');
  await page.getByLabel('Name').fill('Backup Tester');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export backup/ }).click();
  const file = await (await download).path();

  await page.getByLabel('Type RESET to confirm').fill('RESET');
  await page.getByRole('button', { name: 'Reset all data' }).click();
  expect((await readState(page)).profile.name).toBe('');

  await page.locator('input[type=file]').setInputFiles(file);
  await page.getByRole('button', { name: 'Replace my data with this backup' }).click();
  await expect(page.getByText('Backup imported.')).toBeVisible();
  expect((await readState(page)).profile.name).toBe('Backup Tester');
  await page.reload();
  await expect(page.getByLabel('Name')).toHaveValue('Backup Tester');
  expect(errors).toEqual([]);
});

test('mobile: the drawer opens, navigates and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await onboard(page);
  await page.getByRole('button', { name: 'Open menu' }).click();
  const drawer = page.getByRole('dialog', { name: 'Menu' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('link', { name: 'Revision' }).click();
  await expect(page).toHaveURL(/\/revision$/);
  await expect(drawer).toHaveCount(0);
});

test('search: Ctrl+K finds a topic and Enter opens it', async ({ page }) => {
  await onboard(page);
  await page.keyboard.press('Control+k');
  await page.getByLabel('Search query').fill('sliding window');
  await expect(page.locator('#search-results a[data-active=true]')).toContainText('Sliding Window');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/learn\/dsa\/dsa\.sliding-window$/);
  await expect(page.getByRole('heading', { name: 'Sliding Window', level: 1 })).toBeVisible();
});

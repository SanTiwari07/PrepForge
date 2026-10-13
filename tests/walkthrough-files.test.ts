// The app fetches public/walkthroughs/<slug>.json per problem; these files are generated from the
// authored walkthroughs (npm run build:index). Fail if they are stale, missing or extra.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WALKTHROUGHS } from '@/content/all';

describe('walkthrough JSON files', () => {
  const dir = resolve(process.cwd(), 'public/walkthroughs');
  it('has exactly one file per authored walkthrough', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
    expect(files).toEqual(Object.keys(WALKTHROUGHS).sort());
  });
  it('every file matches its source (run npm run build:index if this fails)', () => {
    for (const [slug, w] of Object.entries(WALKTHROUGHS)) {
      expect(readFileSync(resolve(dir, `${slug}.json`), 'utf8'), slug).toBe(JSON.stringify(w));
    }
  });
});

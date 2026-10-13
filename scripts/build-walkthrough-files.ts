// Writes one JSON file per authored coach walkthrough to public/walkthroughs/<slug>.json so a problem
// page downloads only its own walkthrough (a few KB) instead of every walkthrough in one chunk.
// Usage: npm run build:index (also runs before `npm run build`); a test fails if the files are stale.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { WALKTHROUGHS } from '../src/content/all';

const dir = new URL('../public/walkthroughs/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const f of readdirSync(dir)) if (f.endsWith('.json')) rmSync(new URL(f, dir));
for (const [slug, w] of Object.entries(WALKTHROUGHS)) writeFileSync(new URL(`${slug}.json`, dir), JSON.stringify(w));
console.log(`wrote ${Object.keys(WALKTHROUGHS).length} files to public/walkthroughs/`);

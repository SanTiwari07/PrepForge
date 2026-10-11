import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderContentIndex } from '../scripts/lib/content-index';

describe('content index', () => {
  it('is up to date with the module packs (run `npm run build:index`)', () => {
    const committed = readFileSync(resolve(process.cwd(), 'src/content/index.generated.ts'), 'utf8').replace(/\r\n/g, '\n');
    expect(committed === renderContentIndex(), 'src/content/index.generated.ts is stale: run `npm run build:index`').toBe(true);
  });
});

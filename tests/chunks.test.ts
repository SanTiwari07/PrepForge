// Guards the production chunk split (see chunking.ts). The eager entry (registry.ts) must not
// statically reach any module that is placed in a lazy pack chunk; otherwise the eager chunk
// and the pack chunk import each other and the deployed app crashes on load.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { packChunkFor } from '../chunking';

function resolveImport(from: string, spec: string): string | null {
  if (!spec.startsWith('.') && !spec.startsWith('@/')) return null;
  const base = spec.startsWith('@/') ? resolve(process.cwd(), 'src', spec.slice(2)) : resolve(dirname(from), spec);
  for (const c of [base, `${base}.ts`, `${base}.tsx`, resolve(base, 'index.ts')]) if (existsSync(c) && c.match(/\.tsx?$/)) return c;
  return null;
}

function staticClosure(entry: string): Set<string> {
  const seen = new Set<string>();
  const stack = [entry];
  while (stack.length) {
    const f = stack.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    const src = readFileSync(f, 'utf8');
    // Static imports and re-exports only (import type is erased; dynamic import() is a lazy edge).
    for (const m of src.matchAll(/^\s*(?:import|export)\s+(?!type\b)[^'"]*?from\s+['"]([^'"]+)['"]/gm)) {
      const r = resolveImport(f, m[1]);
      if (r) stack.push(r);
    }
  }
  return seen;
}

describe('production chunking', () => {
  it('the eager content registry never statically imports a lazy pack module', () => {
    const closure = staticClosure(resolve(process.cwd(), 'src/content/registry.ts'));
    const leaks = [...closure].filter((f) => packChunkFor(f)).map((f) => f.replace(process.cwd(), ''));
    expect(leaks).toEqual([]);
  });
  it('packs are assigned as intended', () => {
    expect(packChunkFor('/x/src/content/sql/topics2.ts')).toBe('pack-sql');
    expect(packChunkFor('/x/src/content/sql/exercises2.ts')).toBeUndefined();
    expect(packChunkFor(['C:', 'x', 'src', 'content', 'dsa', 'heaps.ts'].join(String.fromCharCode(92)))).toBe('pack-dsa');
  });
});

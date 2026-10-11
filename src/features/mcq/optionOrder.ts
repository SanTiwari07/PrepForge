import type { MCQ } from '@/content/schema';

// Display order of options, shuffled deterministically per question id so the correct answer
// is not always in the same position, while the order stays stable across reloads and
// sessions. Stored attempts keep using option ids, so this never affects saved data.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function displayOptions(q: MCQ): MCQ['options'] {
  let seed = hash(q.id) || 1;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const out = [...q.options];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

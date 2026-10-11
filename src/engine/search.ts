// Small in-memory search: token prefix matching with field weights.
export interface SearchDoc {
  id: string;
  kind: 'topic' | 'problem' | 'mcq' | 'sql' | 'note' | 'page';
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string;
}

function tokens(s: string): string[] {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9+#]+/g, ' ').split(' ').filter(Boolean);
}

export function search(docs: SearchDoc[], query: string, limit = 20): SearchDoc[] {
  const q = tokens(query);
  if (!q.length) return [];
  const scored: { d: SearchDoc; s: number }[] = [];
  for (const d of docs) {
    const title = tokens(d.title);
    const rest = tokens(`${d.subtitle ?? ''} ${d.keywords ?? ''}`);
    let s = 0;
    let all = true;
    for (const t of q) {
      let best = 0;
      for (const w of title) if (w === t) best = Math.max(best, 6); else if (w.startsWith(t)) best = Math.max(best, 4);
      for (const w of rest) if (w === t) best = Math.max(best, 2); else if (w.startsWith(t)) best = Math.max(best, 1);
      if (!best) { all = false; break; }
      s += best;
    }
    if (!all) continue;
    if (d.title.toLowerCase().startsWith(query.toLowerCase())) s += 5;
    if (d.kind === 'topic' || d.kind === 'page') s += 2;
    scored.push({ d, s });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.d);
}

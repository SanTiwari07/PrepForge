import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, Database, FileText, ListChecks, NotebookPen, X } from 'lucide-react';
import { MCQS, PROBLEMS, SQL_EXERCISES, TOPICS, MODULE_BY_ID } from '@/content/registry';
import { search, type SearchDoc } from '@/engine/search';
import { useStore } from '@/store/store';
import { NAV } from '@/app/nav';

const ICON = { topic: BookOpen, problem: ListChecks, mcq: ClipboardList, sql: Database, note: NotebookPen, page: FileText };

export function SearchDialog({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const notes = useStore((s) => s.notes);

  const docs = useMemo<SearchDoc[]>(() => [
    ...NAV.flatMap((g) => g.items.map((i) => ({ id: `page:${i.to}`, kind: 'page' as const, title: i.label, subtitle: g.title, href: i.to }))),
    ...TOPICS.map((t) => ({ id: t.id, kind: 'topic' as const, title: t.title, subtitle: `${MODULE_BY_ID.get(t.moduleId)?.shortTitle} · ${t.status === 'planned' ? 'Planned' : 'Topic'}`, href: `/learn/${t.moduleId}/${t.id}`, keywords: `${t.summary} ${(t.subtopics ?? []).join(' ')}` })),
    ...PROBLEMS.map((p) => ({ id: p.slug, kind: 'problem' as const, title: p.title, subtitle: `Problem · ${p.difficulty} · #${p.leetcodeId}`, href: `/problems/${p.slug}`, keywords: `${p.patterns.join(' ')} ${p.leetcodeId}` })),
    ...SQL_EXERCISES.map((e) => ({ id: e.id, kind: 'sql' as const, title: e.title, subtitle: `SQL exercise · ${e.difficulty}`, href: `/sql/exercises/${e.id}` })),
    ...MCQS.map((m) => ({ id: m.id, kind: 'mcq' as const, title: m.title, subtitle: `MCQ · ${m.type}`, href: `/practice/mcq?ids=${encodeURIComponent(m.id)}` })),
    ...notes.map((n) => ({ id: n.id, kind: 'note' as const, title: n.title || 'Untitled note', subtitle: 'Note', href: '/notes', keywords: n.body.slice(0, 200) })),
  ], [notes]);

  const results = useMemo(() => search(docs, q, 25), [docs, q]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const go = (d: SearchDoc) => { navigate(d.href); onClose(); };

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Search">
        <div className="row" style={{ borderBottom: '1px solid var(--hairline)', gap: 0 }}>
          <input
            ref={inputRef}
            className="search-input"
            style={{ borderBottom: 0 }}
            placeholder="Search topics, problems, MCQs, notes…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              if (e.key === 'Enter' && results[active]) go(results[active]);
            }}
            aria-label="Search query"
            aria-controls="search-results"
          />
          <button className="icon-btn" onClick={onClose} aria-label="Close search" style={{ marginRight: 8 }}><X /></button>
        </div>
        {q && results.length === 0 && <p className="muted small" style={{ padding: 20 }}>No matches for “{q}”.</p>}
        {!q && <p className="muted small" style={{ padding: 20 }}>Type to search {TOPICS.length} topics, {PROBLEMS.length} problems, {MCQS.length} MCQs and your notes. Use ↑ ↓ and Enter.</p>}
        <ul className="search-results" id="search-results">
          {results.map((d, i) => {
            const Icon = ICON[d.kind];
            return (
              <li key={`${d.kind}:${d.id}`}>
                <a href={d.href} data-active={i === active} onClick={(e) => { e.preventDefault(); go(d); }} onMouseEnter={() => setActive(i)}>
                  <Icon size={16} aria-hidden style={{ flex: 'none', color: 'var(--body-mid)' }} />
                  <span className="grow">
                    <span className="truncate" style={{ display: 'block', color: 'var(--ink)' }}>{d.title}</span>
                    {d.subtitle && <span className="xsmall muted">{d.subtitle}</span>}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

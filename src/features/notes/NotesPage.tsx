import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/store';
import { EmptyState, PageHeader, Badge } from '@/components/ui';

function bookmarkHref(refType: string, refId: string): string {
  if (refType === 'topic') return `/learn/${refId.split('.')[0] === 'dsa' ? 'dsa' : refId.startsWith('sql.') ? 'sql' : refId.startsWith('dbms.') ? 'dbms' : refId.startsWith('cpp.') ? 'oop-cpp' : refId.startsWith('java.') ? 'oop-java' : refId.startsWith('cn.') ? 'cn' : refId.startsWith('os.') ? 'os' : refId.startsWith('sd.') ? 'system-design' : refId.startsWith('devops.') ? 'devops' : 'core-cs'}/${refId}`;
  if (refType === 'problem') return `/problems/${refId}`;
  if (refType === 'sql') return `/sql/exercises/${refId}`;
  return `/practice/mcq?ids=${encodeURIComponent(refId)}`;
}

export default function NotesPage() {
  const notes = useStore((s) => s.notes);
  const bookmarks = useStore((s) => s.bookmarks);
  const upsert = useStore((s) => s.upsertNote);
  const del = useStore((s) => s.deleteNote);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const [draft, setDraft] = useState({ title: '', body: '' });

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Retain" title="Notes and bookmarks" lead="Your own notes (stored only in this browser) and everything you bookmarked." />
      <div className="grid-12">
        <section className="card span-7 stack">
          <h2 className="card__title">Notes</h2>
          <form className="stack-sm" onSubmit={(e) => { e.preventDefault(); if (!draft.body.trim()) return; upsert({ id: `general:${Date.now()}`, refType: 'general', refId: '', title: draft.title.trim() || 'Untitled', body: draft.body }); setDraft({ title: '', body: '' }); }}>
            <input className="input" placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} aria-label="Note title" />
            <textarea className="textarea" placeholder="Write a note…" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} aria-label="Note body" />
            <button className="btn btn--primary" type="submit" style={{ alignSelf: 'flex-start' }}><Plus /> Add note</button>
          </form>
          {notes.length === 0 ? <EmptyState title="No notes yet">Notes you write on topic and problem pages also appear here.</EmptyState> : (
            <ul className="list-plain stack">
              {notes.map((n) => (
                <li key={n.id} className="card card--compact">
                  <div className="row-between">
                    <span className="strong small">{n.title}</span>
                    <span className="row" style={{ gap: 4 }}>
                      {n.refType !== 'general' && <Link to={bookmarkHref(n.refType, n.refId)} className="xsmall">Open {n.refType}</Link>}
                      <button className="icon-btn" aria-label="Delete note" onClick={() => { if (window.confirm('Delete this note?')) del(n.id); }}><Trash2 size={16} /></button>
                    </span>
                  </div>
                  <p className="small" style={{ whiteSpace: 'pre-wrap' }}>{n.body}</p>
                  <span className="xsmall muted">Updated {new Date(n.updatedAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card span-5 stack">
          <h2 className="card__title">Bookmarks</h2>
          {bookmarks.length === 0 ? <EmptyState title="No bookmarks">Bookmark topics, problems and questions to find them here.</EmptyState> : (
            <ul className="list-plain stack-sm">
              {bookmarks.map((b) => (
                <li key={b.id} className="row-between">
                  <Link to={bookmarkHref(b.refType, b.refId)} className="small truncate grow">{b.title}</Link>
                  <Badge tone="outline">{b.refType}</Badge>
                  <button className="icon-btn" aria-label="Remove bookmark" onClick={() => toggleBookmark({ refType: b.refType, refId: b.refId, title: b.title })}><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

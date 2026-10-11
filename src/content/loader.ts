// Loads module packs (full lessons, MCQs, walkthroughs) on demand, one chunk per module.
import { useEffect, useSyncExternalStore } from 'react';
import type { CoachWalkthrough, MCQ, ModuleId, Topic } from './schema';
import { PACK_LOADERS } from './packs';
import { TOPIC_BY_ID } from './registry';

const loaded = new Set<ModuleId>();
const failed = new Set<ModuleId>();
const inflight = new Map<ModuleId, Promise<void>>();
const mcqs = new Map<string, MCQ>();
const bodies = new Map<string, Topic>();
const walkthroughs = new Map<string, CoachWalkthrough>();

let version = 0;
const listeners = new Set<() => void>();
const notify = () => { version += 1; for (const l of listeners) l(); };

function loadOne(id: ModuleId): Promise<void> {
  if (loaded.has(id)) return Promise.resolve();
  const existing = inflight.get(id);
  if (existing) return existing;
  failed.delete(id);
  const p = PACK_LOADERS[id]()
    .then((pack) => {
      for (const q of pack.mcqs) mcqs.set(q.id, q);
      for (const t of pack.topics) bodies.set(t.id, t);
      for (const [slug, w] of Object.entries(pack.walkthroughs ?? {})) walkthroughs.set(slug, w);
      loaded.add(id);
    })
    .catch(() => { failed.add(id); })
    .finally(() => { inflight.delete(id); notify(); });
  inflight.set(id, p);
  return p;
}

/** Resolves when every requested pack has loaded (or failed; check with `isLoaded`). */
export function loadModules(ids: Iterable<ModuleId>): Promise<void> {
  return Promise.all([...new Set(ids)].map(loadOne)).then(() => undefined);
}

export const isLoaded = (id: ModuleId) => loaded.has(id);

export type LoadState = 'loading' | 'ready' | 'error';

/** Loads the packs for these modules and re-renders when they arrive. */
export function useModules(ids: ModuleId[]): LoadState {
  const key = [...new Set(ids)].sort().join(',');
  useEffect(() => { if (key) void loadModules(key.split(',') as ModuleId[]); }, [key]);
  useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => version);
  if (ids.every((id) => loaded.has(id))) return 'ready';
  if (ids.some((id) => failed.has(id))) return 'error';
  return 'loading';
}

/** Retry failed packs (e.g. after the network comes back). */
export function retry(ids: ModuleId[]): void { void loadModules(ids); }

export const getMcq = (id: string): MCQ | undefined => mcqs.get(id);
/** All loaded MCQ bodies, keyed by id. */
export const loadedMcqs = (): Map<string, MCQ> => mcqs;
export const getWalkthrough = (slug: string): CoachWalkthrough | undefined => walkthroughs.get(slug);

/** The full topic: catalog metadata (with tagged MCQs and bank problems) plus the loaded lesson body. */
export function getFullTopic(id: string): Topic | undefined {
  const meta = TOPIC_BY_ID.get(id);
  if (!meta) return undefined;
  const body = bodies.get(id);
  const { sectionIds: _s, counts: _c, ...rest } = meta;
  void _s; void _c;
  return {
    ...rest,
    sections: body?.sections ?? [],
    interviewQuestions: body?.interviewQuestions ?? [],
    revision: body?.revision ?? { notesMd: '', flashcards: [] },
    resources: body?.resources ?? [],
    recognition: body?.recognition,
  };
}

// Page replacement simulator: FIFO, LRU and Optimal (Belady's MIN).
export type PageAlgo = 'fifo' | 'lru' | 'optimal';
export interface PageStep { page: number; frames: (number | null)[]; hit: boolean; evicted: number | null }
export interface PageResult { steps: PageStep[]; faults: number; hits: number }

export function simulatePaging(refs: number[], frameCount: number, algo: PageAlgo): PageResult {
  const frames: (number | null)[] = new Array(frameCount).fill(null);
  const loadedAt = new Map<number, number>();   // FIFO: time loaded
  const lastUsed = new Map<number, number>();   // LRU: last access time
  const steps: PageStep[] = [];
  let faults = 0;
  refs.forEach((page, t) => {
    const idx = frames.indexOf(page);
    if (idx >= 0) {
      lastUsed.set(page, t);
      steps.push({ page, frames: [...frames], hit: true, evicted: null });
      return;
    }
    faults += 1;
    let slot = frames.indexOf(null);
    let evicted: number | null = null;
    if (slot < 0) {
      const resident = frames as number[];
      let victim: number;
      if (algo === 'fifo') victim = resident.reduce((a, b) => (loadedAt.get(a)! <= loadedAt.get(b)! ? a : b));
      else if (algo === 'lru') victim = resident.reduce((a, b) => (lastUsed.get(a)! <= lastUsed.get(b)! ? a : b));
      else {
        // Optimal: evict the page used farthest in the future (or never again); ties by frame order.
        let best = resident[0];
        let bestDist = -1;
        for (const p of resident) {
          const next = refs.indexOf(p, t + 1);
          const dist = next < 0 ? Infinity : next;
          if (dist > bestDist) { best = p; bestDist = dist; }
        }
        victim = best;
      }
      slot = frames.indexOf(victim);
      evicted = victim;
      loadedAt.delete(victim);
      lastUsed.delete(victim);
    }
    frames[slot] = page;
    loadedAt.set(page, t);
    lastUsed.set(page, t);
    steps.push({ page, frames: [...frames], hit: false, evicted });
  });
  return { steps, faults, hits: refs.length - faults };
}

export function parseRefString(s: string): number[] {
  return s.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isInteger(n) && n >= 0);
}

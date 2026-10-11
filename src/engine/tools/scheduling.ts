// CPU scheduling simulator. Times are integers. Lower priority number = higher priority.
export interface Proc { id: string; arrival: number; burst: number; priority?: number }
export interface Slice { id: string | null; start: number; end: number }   // id null = CPU idle
export interface ProcStats { id: string; arrival: number; burst: number; completion: number; turnaround: number; waiting: number; response: number }
export interface ScheduleResult { gantt: Slice[]; stats: ProcStats[]; avgWaiting: number; avgTurnaround: number; avgResponse: number }
export type Algorithm = 'fcfs' | 'sjf' | 'srtf' | 'priority' | 'priority-preemptive' | 'rr';

function pushSlice(g: Slice[], id: string | null, start: number, end: number) {
  if (end <= start) return;
  const last = g[g.length - 1];
  if (last && last.id === id && last.end === start) last.end = end;
  else g.push({ id, start, end });
}

export function schedule(procs: Proc[], algo: Algorithm, quantum = 2): ScheduleResult {
  const ps = procs.map((p, i) => ({ ...p, idx: i, remaining: p.burst, firstStart: -1, completion: -1 }));
  const gantt: Slice[] = [];
  let t = Math.min(...ps.map((p) => p.arrival));
  if (t > 0) pushSlice(gantt, null, 0, t);
  const done = () => ps.every((p) => p.remaining === 0);
  const tie = (a: (typeof ps)[number], b: (typeof ps)[number]) => a.arrival - b.arrival || a.idx - b.idx;

  if (algo === 'rr') {
    const queue: (typeof ps)[number][] = [];
    const admitted = new Set<number>();
    const admit = (upTo: number) => {
      for (const p of [...ps].sort(tie)) if (!admitted.has(p.idx) && p.arrival <= upTo) { queue.push(p); admitted.add(p.idx); }
    };
    admit(t);
    while (!done()) {
      if (!queue.length) {
        const next = Math.min(...ps.filter((p) => !admitted.has(p.idx)).map((p) => p.arrival));
        pushSlice(gantt, null, t, next);
        t = next;
        admit(t);
        continue;
      }
      const p = queue.shift()!;
      if (p.firstStart < 0) p.firstStart = t;
      const run = Math.min(quantum, p.remaining);
      pushSlice(gantt, p.id, t, t + run);
      t += run;
      p.remaining -= run;
      admit(t);                      // new arrivals join before the preempted process (common textbook convention)
      if (p.remaining > 0) queue.push(p);
      else p.completion = t;
    }
  } else {
    const preemptive = algo === 'srtf' || algo === 'priority-preemptive';
    while (!done()) {
      const ready = ps.filter((p) => p.arrival <= t && p.remaining > 0);
      if (!ready.length) {
        const next = Math.min(...ps.filter((p) => p.remaining > 0).map((p) => p.arrival));
        pushSlice(gantt, null, t, next);
        t = next;
        continue;
      }
      let key: (p: (typeof ps)[number]) => number;
      if (algo === 'fcfs') key = (p) => p.arrival;
      else if (algo === 'sjf') key = (p) => p.burst;
      else if (algo === 'srtf') key = (p) => p.remaining;
      else key = (p) => p.priority ?? 0;
      ready.sort((a, b) => key(a) - key(b) || tie(a, b));
      const p = ready[0];
      if (p.firstStart < 0) p.firstStart = t;
      let run = p.remaining;
      if (preemptive) {
        const nextArrival = Math.min(...ps.filter((q) => q.arrival > t && q.remaining > 0).map((q) => q.arrival), Infinity);
        run = Math.min(run, nextArrival - t);
      }
      pushSlice(gantt, p.id, t, t + run);
      t += run;
      p.remaining -= run;
      if (p.remaining === 0) p.completion = t;
    }
  }

  const stats = ps.map((p) => ({
    id: p.id, arrival: p.arrival, burst: p.burst, completion: p.completion,
    turnaround: p.completion - p.arrival, waiting: p.completion - p.arrival - p.burst, response: p.firstStart - p.arrival,
  }));
  const avg = (f: (s: ProcStats) => number) => Math.round((stats.reduce((a, s) => a + f(s), 0) / stats.length) * 100) / 100;
  return { gantt, stats, avgWaiting: avg((s) => s.waiting), avgTurnaround: avg((s) => s.turnaround), avgResponse: avg((s) => s.response) };
}

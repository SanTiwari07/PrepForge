import type { CodeSample, Resource, Topic } from '../schema';

export const MASTERY = { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
export const HPBN: Resource = { title: 'High Performance Browser Networking (free online book)', url: 'https://hpbn.co/', kind: 'book' };
export const MDN_HTTP: Resource = { title: 'MDN: HTTP', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', kind: 'official-docs' };
export const RFC = (n: number, title: string): Resource => ({ title: `RFC ${n}: ${title}`, url: `https://www.rfc-editor.org/rfc/rfc${n}`, kind: 'official-docs' });
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
export const cnTopic = (t: TopicInput): Topic => ({ moduleId: 'cn', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
export const q = (topic: string) => ({ topics: [topic], module: 'cn' as const });
export const sh = (code: string, label = 'Shell'): CodeSample => ({ lang: 'bash', code, label });

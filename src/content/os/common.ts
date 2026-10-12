import type { Resource, Topic } from '../schema';

export const MASTERY = { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
export const OSTEP: Resource = { title: 'Operating Systems: Three Easy Pieces (free book)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', kind: 'book' };
export const manpage = (name: string, section = 2): Resource => ({ title: `${name}(${section}) manual page`, url: `https://man.archlinux.org/man/${name}.${section}`, kind: 'official-docs' });
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
export const osTopic = (t: TopicInput): Topic => ({ moduleId: 'os', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
export const q = (topic: string) => ({ topics: [topic], module: 'os' as const });

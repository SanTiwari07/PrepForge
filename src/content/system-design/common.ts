import type { Resource, Topic } from '../schema';

export const MASTERY = { testSize: 6, testMinutes: 12, passPct: 75, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 10 };
export const PRIMER: Resource = { title: 'The System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer', kind: 'article' };
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
export const sdTopic = (t: TopicInput): Topic => ({ moduleId: 'system-design', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
export const q = (topic: string) => ({ topics: [topic], module: 'system-design' as const });

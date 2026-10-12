import type { Resource, Topic } from '../schema';

export const MASTERY = { testSize: 6, testMinutes: 12, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
export const CPPREF = (title: string, path: string): Resource => ({ title: `${title} (cppreference)`, url: `https://en.cppreference.com/w/cpp/${path}`, kind: 'official-docs' });
export const ISOCPP: Resource = { title: 'C++ Super-FAQ (isocpp.org)', url: 'https://isocpp.org/faq', kind: 'article' };
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
export const cppTopic = (t: TopicInput): Topic => ({ moduleId: 'oop-cpp', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
export const q = (topic: string) => ({ topics: [topic], module: 'oop-cpp' as const });

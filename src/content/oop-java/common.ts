import type { Resource, Topic } from '../schema';

export const MASTERY = { testSize: 6, testMinutes: 12, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
export const JLS: Resource = { title: 'Java Language Specification (SE 21)', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/index.html', kind: 'official-docs' };
export const TUT: Resource = { title: 'The Java Tutorials: Classes and Objects', url: 'https://docs.oracle.com/javase/tutorial/java/javaOO/index.html', kind: 'official-docs' };
export const API = (title: string, path: string): Resource => ({ title: `${title} (Java SE 21 API)`, url: `https://docs.oracle.com/en/java/javase/21/docs/api/java.base/${path}`, kind: 'official-docs' });
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
export const javaTopic = (t: TopicInput): Topic => ({ moduleId: 'oop-java', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
export const q = (topic: string) => ({ topics: [topic], module: 'oop-java' as const });

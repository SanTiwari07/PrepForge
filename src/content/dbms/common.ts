import type { Resource, Topic } from '../schema';

export const MASTERY = { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
export const CMU: Resource = { title: 'CMU 15-445 Database Systems (course site)', url: 'https://15445.courses.cs.cmu.edu/', kind: 'course' };
export const DBBOOK: Resource = { title: 'Database System Concepts (book site)', url: 'https://db-book.com/', kind: 'book' };
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
export const dbmsTopic = (t: TopicInput): Topic => ({ moduleId: 'dbms', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
export const q = (topic: string) => ({ topics: [topic], module: 'dbms' as const });

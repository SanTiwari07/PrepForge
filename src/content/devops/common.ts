import type { CodeSample, Topic } from '../schema';

export const MASTERY = { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
export const dTopic = (t: TopicInput): Topic => ({ moduleId: 'devops', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
export const q = (topic: string) => ({ topics: [topic], module: 'devops' as const });
export const sh = (code: string, label = 'Shell'): CodeSample => ({ lang: 'bash', code, label });
export const yaml = (code: string, label = 'YAML'): CodeSample => ({ lang: 'yaml', code, label });
export const dockerfile = (code: string): CodeSample => ({ lang: 'dockerfile', code, label: 'Dockerfile' });
export const hcl = (code: string, label = 'Terraform (HCL)'): CodeSample => ({ lang: 'text', code, label });

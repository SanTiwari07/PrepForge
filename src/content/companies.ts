import type { DimensionId } from '@/engine/readiness';

// Company preparation tracks. Only facts with a source and verification date are stated as facts.
// Everything else is labelled as PrepForge's recommendation or as unverified.
export interface CompanyFact { text: string; source: string; url: string; verifiedOn: string }

export interface CompanyTrack {
  id: string;
  name: string;
  updatedOn: string;
  summary: string;
  facts: CompanyFact[];
  unverified: string[];
  recommendation: {
    focusTopics: string[];        // topic ids
    notes: string[];
  };
  weights: Partial<Record<DimensionId, number>>;
  behavioural?: { framework: string; principles?: string[]; url?: string };
  resources: { title: string; url: string }[];
}

const V = '2026-10-11';

const DSA_CORE = ['dsa.hashing', 'dsa.two-pointers', 'dsa.sliding-window', 'dsa.binary-search', 'dsa.binary-trees', 'dsa.graphs', 'dsa.dp-1d', 'dsa.heaps'];

export const COMPANIES: CompanyTrack[] = [
  {
    id: 'google',
    name: 'Google',
    updatedOn: V,
    summary: 'Structured interviews with consistent rubrics; strong emphasis on problem solving.',
    facts: [
      { text: 'The process typically takes about 6–8 weeks, though it can differ by role and team.', source: 'Google Careers: How we hire', url: 'https://www.google.com/about/careers/applications/how-we-hire/', verifiedOn: V },
      { text: 'Before interviews, candidates may take the Google Hiring Assessment and, for some roles, a role-related assessment such as a coding exercise.', source: 'Google Careers: How we hire', url: 'https://www.google.com/about/careers/applications/how-we-hire/', verifiedOn: V },
      { text: 'There are usually one or two shorter recruiter conversations before in-depth interviews.', source: 'Google Careers: How we hire', url: 'https://www.google.com/about/careers/applications/how-we-hire/', verifiedOn: V },
      { text: 'Interviews are structured: every candidate for a role is assessed with the same rubrics, and questions are open-ended and role-related. No brainteasers.', source: 'Google Careers: How we hire', url: 'https://www.google.com/about/careers/applications/how-we-hire/', verifiedOn: V },
      { text: 'AI tools are not permitted during interviews.', source: 'Google Careers: How we hire', url: 'https://www.google.com/about/careers/applications/how-we-hire/', verifiedOn: V },
    ],
    unverified: ['The exact number of rounds and their mix for new-grad SWE roles in India can change; confirm with your recruiter.'],
    recommendation: {
      focusTopics: [...DSA_CORE, 'dsa.dp-2d', 'dsa.backtracking', 'dsa.topological-sort', 'dsa.tries'],
      notes: ['Practise explaining your approach aloud before coding; rubrics reward clear reasoning.', 'Expect follow-ups that change constraints. Use the coach to rehearse "what if n were 10⁹?".'],
    },
    weights: { dsa: 0.45, oa: 0.15, consistency: 0.15, communication: 0.1, 'system-design': 0.05, oop: 0.05, 'cn-os': 0.05 },
    resources: [{ title: 'Google Careers: How we hire', url: 'https://www.google.com/about/careers/applications/how-we-hire/' }],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    updatedOn: V,
    summary: 'Online assessment first; interviews combine coding with heavy Leadership Principles evaluation.',
    facts: [
      { text: 'For university SDE roles, the Online Assessment is the first step. The full-time OA includes a Coding Assessment (average 70 min), a Workstyles Assessment (average 15 min), a Work Simulation (average 60 min) and a feedback survey; set aside up to two hours.', source: 'Amazon Jobs: OA prep for SDE roles', url: 'https://amazon.jobs/content/en/how-we-hire/university/sde-oa', verifiedOn: V },
      { text: 'The SDE internship OA takes about 90 minutes: Coding Assessment, Workstyles Assessment and a feedback survey.', source: 'Amazon Jobs: OA prep for SDE roles', url: 'https://amazon.jobs/content/en/how-we-hire/university/sde-oa', verifiedOn: V },
      { text: 'During the Coding Assessment you may use publicly accessible resources such as language documentation, but not sites that need a login; copy-paste is discouraged.', source: 'Amazon Jobs: OA prep for SDE roles', url: 'https://amazon.jobs/content/en/how-we-hire/university/sde-oa', verifiedOn: V },
      { text: 'Amazon lists these SDE interview topics: programming language, data structures, algorithms, coding, object-oriented design, databases, distributed computing, operating systems, internet topics, and general ML/AI.', source: 'Amazon Jobs: Software development topics', url: 'https://amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics', verifiedOn: V },
      { text: 'Interviewers look for the ability to apply knowledge to solve problems efficiently, not memorisation; practising coding outside an IDE is recommended.', source: 'Amazon Jobs: Software development topics', url: 'https://amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics', verifiedOn: V },
      { text: 'For SDE II (experienced) loops, Amazon states syntactically correct code is expected (no pseudocode) and a significant portion focuses on Leadership Principles; no brain teasers.', source: 'Amazon Jobs: SDE II interview prep', url: 'https://www.amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep', verifiedOn: V },
    ],
    unverified: ['The number of interview rounds after the OA for new-grad roles in India varies by team and year.'],
    recommendation: {
      focusTopics: [...DSA_CORE, 'dsa.design-ds', 'dsa.greedy', 'dsa.intervals', 'cpp.solid-patterns', 'java.solid-patterns'],
      notes: ['Prepare 2 STAR stories per Leadership Principle; reuse them across principles.', 'Practise OA-style timed sets: two coding problems in about 70 minutes.', 'Object-oriented design appears in Amazon\'s topic list, so practise LLD.'],
    },
    weights: { dsa: 0.35, oa: 0.25, communication: 0.15, oop: 0.1, consistency: 0.1, 'cn-os': 0.05 },
    behavioural: {
      framework: 'STAR (Situation, Task, Action, Result) mapped to Leadership Principles',
      principles: ['Customer Obsession', 'Ownership', 'Invent and Simplify', 'Are Right, A Lot', 'Learn and Be Curious', 'Hire and Develop the Best', 'Insist on the Highest Standards', 'Think Big', 'Bias for Action', 'Frugality', 'Earn Trust', 'Dive Deep', 'Have Backbone; Disagree and Commit', 'Deliver Results', "Strive to be Earth's Best Employer", 'Success and Scale Bring Broad Responsibility'],
      url: 'https://www.amazon.jobs/content/en/our-workplace/leadership-principles',
    },
    resources: [
      { title: 'Amazon Jobs: OA prep for SDE roles', url: 'https://amazon.jobs/content/en/how-we-hire/university/sde-oa' },
      { title: 'Amazon Jobs: Software development topics', url: 'https://amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics' },
      { title: 'Amazon Leadership Principles', url: 'https://www.amazon.jobs/content/en/our-workplace/leadership-principles' },
    ],
  },
  {
    id: 'meta',
    name: 'Meta',
    updatedOn: V,
    summary: 'Official full-loop prep guide exists; its round details have not been verified in PrepForge yet.',
    facts: [
      { text: 'Meta publishes an official software-engineering full-loop preparation page with a downloadable interview guide.', source: 'Meta Careers: Preparing for your full loop interview', url: 'https://www.metacareers.com/swe-prep-onsite/', verifiedOn: V },
    ],
    unverified: ['Round structure, number of coding questions per interview and timing are described in Meta\'s guide but not yet verified here. Read the official guide.'],
    recommendation: {
      focusTopics: [...DSA_CORE, 'dsa.linked-lists', 'dsa.stacks-queues', 'dsa.intervals'],
      notes: ['Practise solving medium problems quickly and cleanly: speed and correctness both matter in fast-paced coding rounds (our recommendation).'],
    },
    weights: { dsa: 0.5, oa: 0.15, consistency: 0.15, communication: 0.1, 'system-design': 0.1 },
    resources: [{ title: 'Meta Careers: SWE full loop prep', url: 'https://www.metacareers.com/swe-prep-onsite/' }],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    updatedOn: V,
    summary: 'Hiring details not yet verified in PrepForge.',
    facts: [],
    unverified: ['Interview process details have not been verified from an official source yet.'],
    recommendation: { focusTopics: [...DSA_CORE, 'dsa.linked-lists', 'cpp.polymorphism-virtual', 'os.synchronisation', 'dbms.normalisation'], notes: ['Balanced DSA plus CS fundamentals preparation (our recommendation).'] },
    weights: { dsa: 0.4, oa: 0.15, oop: 0.1, 'cn-os': 0.1, sql: 0.05, consistency: 0.1, communication: 0.1 },
    resources: [],
  },
  {
    id: 'apple',
    name: 'Apple',
    updatedOn: V,
    summary: 'Hiring details not yet verified in PrepForge; processes vary heavily by team.',
    facts: [],
    unverified: ['Interview process details have not been verified from an official source yet.'],
    recommendation: { focusTopics: [...DSA_CORE, 'cpp.memory-raii', 'os.virtual-memory', 'os.concurrency-multithreading'], notes: ['Team-specific depth (systems, OS, concurrency) is common for platform teams (our recommendation; confirm with the recruiter).'] },
    weights: { dsa: 0.4, 'cn-os': 0.15, oop: 0.15, oa: 0.1, communication: 0.1, consistency: 0.1 },
    resources: [],
  },
  {
    id: 'netflix',
    name: 'Netflix',
    updatedOn: V,
    summary: 'Hiring details not yet verified in PrepForge. Check current new-grad openings before preparing specifically.',
    facts: [],
    unverified: ['Whether Netflix hires new graduates for your target location and role has not been verified.'],
    recommendation: { focusTopics: [...DSA_CORE, 'sd.caching', 'sd.api-design'], notes: ['Prepare strong fundamentals plus basic system design (our recommendation).'] },
    weights: { dsa: 0.4, 'system-design': 0.2, communication: 0.15, oa: 0.1, consistency: 0.15 },
    resources: [],
  },
  {
    id: 'zscaler',
    name: 'Zscaler',
    updatedOn: V,
    summary: 'Cloud security company: add networking, OS and security fundamentals to DSA. Hiring details not yet verified.',
    facts: [],
    unverified: ['Interview rounds and OA format have not been verified from an official source yet.'],
    recommendation: {
      focusTopics: [...DSA_CORE, 'cn.tcp-lifecycle', 'cn.dns', 'cn.http', 'cn.tls-https', 'cn.proxies-lb', 'cn.nat-firewalls', 'os.processes-threads', 'os.synchronisation', 'core.security-fundamentals', 'devops.linux'],
      notes: ['As a security and networking company, expect deeper CN questions: TCP, DNS, HTTP(S), TLS, proxies and firewalls (our recommendation).', 'Be comfortable with Linux, processes and threads, and C/C++ memory basics.'],
    },
    weights: { dsa: 0.35, 'cn-os': 0.3, oop: 0.1, oa: 0.1, devops: 0.05, communication: 0.1 },
    resources: [{ title: 'Zscaler careers', url: 'https://www.zscaler.com/careers' }],
  },
];

export const COMPANY_BY_ID = new Map(COMPANIES.map((c) => [c.id, c]));

import type { CodeSample, Difficulty, MCQ, McqType, ModuleId } from './schema';

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];

export interface McqInput {
  id: string;
  topics: string[];
  module: ModuleId;
  type: McqType;
  difficulty: Difficulty;
  stem: string;
  code?: CodeSample;
  /** Options in order. Use [text, whyWrong] to explain a distractor. */
  options: (string | [string, string])[];
  /** Index (or indices) of the correct option(s). */
  answer: number | number[];
  explanation: string;
  misconceptions?: string;
  verified?: MCQ['verified'];
}

export function mcq(i: McqInput): MCQ {
  const answers = Array.isArray(i.answer) ? i.answer : [i.answer];
  return {
    id: i.id,
    topicIds: i.topics,
    moduleId: i.module,
    type: i.type,
    difficulty: i.difficulty,
    stemMd: i.stem,
    code: i.code,
    options: i.options.map((o, idx) => {
      const [textMd, whyWrongMd] = Array.isArray(o) ? o : [o, undefined];
      return { id: LETTERS[idx], textMd, ...(whyWrongMd ? { whyWrongMd } : {}) };
    }),
    correct: answers.map((n) => LETTERS[n]),
    explanationMd: i.explanation,
    misconceptionsMd: i.misconceptions,
    provenance: { kind: 'original', source: 'PrepForge' },
    verified: i.verified ?? 'reviewed',
  };
}

export const cpp = (code: string, label?: string): CodeSample => ({ lang: 'cpp', code: code.replace(/^\n/, ''), label });
export const java = (code: string, label?: string): CodeSample => ({ lang: 'java', code: code.replace(/^\n/, ''), label });
export const sqlCode = (code: string, label?: string): CodeSample => ({ lang: 'sql', code: code.replace(/^\n/, ''), label });

import type { ErrorCategory, SqlErrorCategory } from '@/store/types';

export const ERROR_CATEGORIES: { id: ErrorCategory; label: string; help: string; remedy: string; href: string }[] = [
  { id: 'misread-problem', label: 'Did not understand the problem', help: 'Misread the input, output or a constraint.', remedy: 'Spend the first 3 minutes restating the problem and writing 2 examples by hand, including an edge case.', href: '/practice/mcq?type=edge-case' },
  { id: 'pattern-not-identified', label: 'Failed to identify the pattern', help: 'Did not see which technique applies.', remedy: 'Run "which pattern?" drills and read the recognition guide of each topic.', href: '/practice/mcq?type=pattern' },
  { id: 'wrong-data-structure', label: 'Chose the wrong data structure', help: 'Picked a structure with the wrong operation costs.', remedy: 'Review STL / Collections costs and "which structure" questions.', href: '/learn/dsa/dsa.hashing' },
  { id: 'algorithm-not-developed', label: 'Could not develop the algorithm', help: 'Saw the idea but could not turn it into steps.', remedy: 'Write pseudocode before code; compare with the topic templates.', href: '/learn/dsa' },
  { id: 'implementation-bug', label: 'Coding or implementation error', help: 'Off-by-one, wrong update, wrong return.', remedy: 'Review templates; dry-run your code on the smallest example before submitting.', href: '/revision' },
  { id: 'wrong-complexity', label: 'Incorrect complexity analysis', help: 'Misjudged time or space, or chose an approach that was too slow.', remedy: 'Practise complexity MCQs and map constraints to a target complexity first.', href: '/learn/dsa/dsa.complexity' },
  { id: 'missed-edge-case', label: 'Missed edge cases', help: 'Empty input, duplicates, negatives, overflow.', remedy: 'Use the coach edge-case checklist on every problem; practise edge-case MCQs.', href: '/practice/mcq?type=edge-case' },
  { id: 'time-management', label: 'Time-management failure', help: 'Ran out of time or got stuck too long.', remedy: 'Do timed sets; switch to hints after 15 minutes stuck on a medium problem.', href: '/oa' },
];

export const SQL_ERROR_CATEGORIES: { id: SqlErrorCategory; label: string }[] = [
  { id: 'wrong-join-type', label: 'Wrong join type' },
  { id: 'lost-zero-groups', label: 'Lost zero-count groups' },
  { id: 'null-handling', label: 'NULL handling' },
  { id: 'wrong-grouping', label: 'Wrong grouping level' },
  { id: 'row-multiplication', label: 'Join row multiplication' },
  { id: 'date-boundary', label: 'Date boundary error' },
  { id: 'ties-not-handled', label: 'Ties not handled' },
  { id: 'dialect', label: 'SQL dialect difference' },
  { id: 'misread-requirement', label: 'Misread requirement' },
];

export const ERROR_LABEL: Record<string, string> = Object.fromEntries([
  ...ERROR_CATEGORIES.map((e) => [e.id, e.label]),
  ...SQL_ERROR_CATEGORIES.map((e) => [e.id, e.label]),
]);

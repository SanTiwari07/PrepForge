import type { MCQ, Topic } from '../schema';
import * as complexity from './complexity';
import * as hashing from './hashing';
import * as twoPointers from './two-pointers';
import * as slidingWindow from './sliding-window';
import * as binarySearch from './binary-search';
export { walkthroughs } from './walkthroughs';

const parts = [complexity, hashing, twoPointers, slidingWindow, binarySearch];

export const topics: Topic[] = parts.map((p) => p.topic);
export const mcqs: MCQ[] = parts.flatMap((p) => p.mcqs);

import type { MCQ, Topic } from '../schema';
import * as complexity from './complexity';
import * as arraysStrings from './arrays-strings';
import * as hashing from './hashing';
import * as twoPointers from './two-pointers';
import * as slidingWindow from './sliding-window';
import * as prefixSums from './prefix-sums';
import * as binarySearch from './binary-search';
import * as stacksQueues from './stacks-queues';
import * as monotonic from './monotonic-stack';
import * as linkedLists from './linked-lists';
import * as binaryTrees from './binary-trees';
export { walkthroughs } from './walkthroughs';

const parts = [complexity, arraysStrings, hashing, twoPointers, slidingWindow, prefixSums, binarySearch, stacksQueues, monotonic, linkedLists, binaryTrees];

export const topics: Topic[] = parts.map((p) => p.topic);
export const mcqs: MCQ[] = parts.flatMap((p) => p.mcqs);

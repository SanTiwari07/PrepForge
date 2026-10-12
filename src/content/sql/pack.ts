// The SQL module pack (lessons + MCQs), loaded on demand. Exercises and datasets are eager.
import type { MCQ, Topic } from '../schema';
import * as batch1 from './topics';
import * as batch2 from './topics2';
import * as extra from './extra';

export const topics: Topic[] = [...batch1.topics, ...batch2.topics];
export const mcqs: MCQ[] = [...batch1.mcqs, ...batch2.mcqs, ...extra.mcqs];

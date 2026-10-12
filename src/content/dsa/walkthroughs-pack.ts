import type { CoachWalkthrough } from '../schema';
import { walkthroughs as w1 } from './walkthroughs';
import { walkthroughs2 } from './walkthroughs2';
import { walkthroughs3 } from './walkthroughs3';
import { walkthroughs4 } from './walkthroughs4';

// All authored coach walkthroughs. This module is loaded lazily (src/content/loader.ts) in its own
// chunk, separate from the DSA lessons pack, so lessons do not pay for walkthrough code.
export const walkthroughs: Record<string, CoachWalkthrough> = { ...w1, ...walkthroughs2, ...walkthroughs3, ...walkthroughs4 };

import type { ContentPack, ModuleId } from './schema';

// One lazily loaded chunk per module (lessons, MCQs, walkthroughs). See src/content/loader.ts.
export const PACK_LOADERS: Record<ModuleId, () => Promise<ContentPack>> = {
  dsa: () => import('./dsa'),
  sql: () => import('./sql/pack'),
  dbms: () => import('./dbms'),
  'oop-cpp': () => import('./oop-cpp'),
  'oop-java': () => import('./oop-java'),
  cn: () => import('./cn'),
  os: () => import('./os'),
  'system-design': () => import('./system-design'),
  devops: () => import('./devops'),
  'core-cs': () => import('./core-cs'),
};

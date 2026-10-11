// Usage: npm run build:index (also runs before `npm run build`).
import { writeFileSync } from 'node:fs';
import { renderContentIndex } from './lib/content-index';

const out = new URL('../src/content/index.generated.ts', import.meta.url);
writeFileSync(out, renderContentIndex());
console.log('wrote src/content/index.generated.ts');

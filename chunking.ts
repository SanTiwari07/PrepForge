// Which lazy pack chunk a content module belongs to (shared by vite.config.ts and tests).
// Module packs (lessons, MCQs, walkthroughs) load on demand; the metadata index, problem bank,
// SQL exercises and datasets ship eagerly. An eager module must never import a pack module,
// or the two chunks import each other and the app fails at load time.
export function packChunkFor(id: string): string | undefined {
  const p = id.replace(/\\/g, '/');
  const m = p.match(/\/src\/content\/(dsa|sql|dbms|oop-cpp|oop-java|cn|os|system-design|devops|core-cs)\//);
  if (!m || /\/sql\/(datasets|exercises\d*)\.ts$/.test(p)) return undefined;
  return `pack-${m[1]}`;
}

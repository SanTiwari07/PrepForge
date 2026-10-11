// Checks every external link shown in the app: topic resources and company sources.
// LeetCode problem links are verified separately via LeetCode's GraphQL API
// (research/*.verified.json), because leetcode.com pages return 403 to scripts.
// Usage: npm run check:links
import { spawnSync } from 'node:child_process';
import { TOPICS } from '../src/content/registry';
import { COMPANIES } from '../src/content/companies';

type Where = string;
const links = new Map<string, Where[]>();
const add = (url: string | undefined, where: Where) => {
  if (!url || !/^https?:\/\//.test(url)) return;
  links.set(url, [...(links.get(url) ?? []), where]);
};
for (const t of TOPICS) for (const r of t.resources) add(r.url, t.id);
for (const c of COMPANIES) {
  for (const f of c.facts ?? []) add(f.url, `company ${c.id}`);
  for (const r of c.resources) add(r.url, `company ${c.id}`);
  add(c.behavioural?.url, `company ${c.id}`);
}

// Sites that reject non-browser clients; a 403 from them is "unverifiable", not "broken".
// Cloudflare Learning pages were confirmed to load (HTTP 200) in a real browser on 2026-10-11.
const BOT_WALLED = [/(^|\.)leetcode\.com$/, /(^|\.)medium\.com$/, /(^|\.)cloudflare\.com$/];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// A few servers reject Node's fetch or a browser-like user agent from a script; curl with its
// default user agent is the fallback.
function curlStatus(url: string): number | null {
  const r = spawnSync('curl', ['-s', '-o', process.platform === 'win32' ? 'NUL' : '/dev/null', '-w', '%{http_code}', '-L', '--max-time', '20', url], { encoding: 'utf8' });
  const code = Number(r.stdout);
  return r.status === 0 && code > 0 ? code : null;
}

async function check(url: string): Promise<{ status: number | string; finalUrl?: string }> {
  const first = await checkFetch(url);
  if (typeof first.status === 'number' && first.status >= 200 && first.status < 400) return first;
  const viaCurl = curlStatus(url);
  return viaCurl !== null && viaCurl >= 200 && viaCurl < 400 ? { status: viaCurl } : first;
}

async function checkFetch(url: string): Promise<{ status: number | string; finalUrl?: string }> {
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*' }, signal: AbortSignal.timeout(20000) });
      if (method === 'HEAD' && (res.status === 405 || res.status === 403 || res.status === 404 || res.status >= 500)) continue;   // some servers mishandle HEAD
      return { status: res.status, finalUrl: res.url !== url ? res.url : undefined };
    } catch (e) {
      if (method === 'GET') return { status: (e as Error).name === 'TimeoutError' ? 'timeout' : (e as Error).message };
    }
  }
  return { status: 'unknown' };
}

const urls = [...links.keys()];
console.log(`Checking ${urls.length} unique links…`);
const results: { url: string; status: number | string; finalUrl?: string }[] = [];
let i = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (i < urls.length) {
    const url = urls[i++];
    results.push({ url, ...(await check(url)) });
  }
}));

let broken = 0, walled = 0;
for (const r of results.sort((a, b) => a.url.localeCompare(b.url))) {
  const ok = typeof r.status === 'number' && r.status >= 200 && r.status < 400;
  const host = new URL(r.url).hostname;
  if (ok) continue;
  if (r.status === 403 && BOT_WALLED.some((re) => re.test(host))) { walled++; console.log(`WALLED ${r.url} (403 to scripts; check manually)`); continue; }
  broken++;
  console.log(`BROKEN ${r.status} ${r.url}\n   used by: ${links.get(r.url)!.join(', ')}`);
}
const redirected = results.filter((r) => r.finalUrl && new URL(r.finalUrl).hostname !== new URL(r.url).hostname);
for (const r of redirected) console.log(`NOTE cross-host redirect ${r.url} -> ${r.finalUrl}`);
console.log(`\n${urls.length} links: ${urls.length - broken - walled} OK, ${broken} broken, ${walled} unverifiable (bot-walled).`);
process.exit(broken ? 1 : 0);

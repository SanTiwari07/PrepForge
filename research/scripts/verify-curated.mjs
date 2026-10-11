// Verifies the curated topic mapping against LeetCode GraphQL and writes
// research/curated-problems.verified.json. Run: node research/scripts/verify-curated.mjs
// The mapping is PrepForge's own judgement of which topic a problem practises; every slug,
// title, difficulty, premium flag and tag list comes from LeetCode, never from memory.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CURATED = {
  'dsa.stl-collections': ['design-hashset', 'design-hashmap', 'top-k-frequent-elements', 'group-anagrams', 'sort-characters-by-frequency', 'time-based-key-value-store', 'contains-duplicate-iii', 'sliding-window-median', 'my-calendar-i'],
  'dsa.kadane': ['maximum-subarray', 'maximum-product-subarray', 'maximum-sum-circular-subarray', 'best-time-to-buy-and-sell-stock', 'best-time-to-buy-and-sell-stock-ii', 'binary-tree-maximum-path-sum', 'longest-turbulent-subarray'],
  'dsa.fast-slow-pointers': ['linked-list-cycle', 'linked-list-cycle-ii', 'middle-of-the-linked-list', 'happy-number', 'find-the-duplicate-number', 'palindrome-linked-list', 'reorder-list', 'delete-the-middle-node-of-a-linked-list', 'remove-nth-node-from-end-of-list'],
  'dsa.shortest-paths': ['network-delay-time', 'cheapest-flights-within-k-stops', 'path-with-minimum-effort', 'swim-in-rising-water', 'number-of-ways-to-arrive-at-destination', 'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance', 'shortest-path-in-binary-matrix', 'minimum-obstacle-removal-to-reach-corner', 'rotting-oranges', '01-matrix', 'word-ladder'],
  'dsa.mst': ['min-cost-to-connect-all-points', 'connecting-cities-with-minimum-cost', 'find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree', 'remove-max-number-of-edges-to-keep-graph-fully-traversable', 'optimize-water-distribution-in-a-village', 'path-with-minimum-effort', 'swim-in-rising-water'],
  'dsa.fenwick-segment': ['range-sum-query-immutable', 'range-sum-query-mutable', 'count-of-smaller-numbers-after-self', 'reverse-pairs', 'count-of-range-sum', 'create-sorted-array-through-instructions', 'my-calendar-iii'],
  'dsa.dp-advanced': ['burst-balloons', 'minimum-cost-to-cut-a-stick', 'palindrome-partitioning-ii', 'longest-palindromic-subsequence', 'house-robber-iii', 'binary-tree-cameras', 'partition-to-k-equal-sum-subsets', 'shortest-path-visiting-all-nodes'],
  'dsa.advanced-graphs': ['critical-connections-in-a-network', 'reconstruct-itinerary', 'cracking-the-safe', 'valid-arrangement-of-pairs', 'minimum-number-of-days-to-disconnect-island', 'find-eventual-safe-states'],
  'dsa.string-matching': ['find-the-index-of-the-first-occurrence-in-a-string', 'repeated-substring-pattern', 'rotate-string', 'repeated-string-match', 'shortest-palindrome', 'longest-happy-prefix', 'longest-duplicate-substring'],
  'dsa.advanced-patterns': ['partition-array-into-two-arrays-to-minimize-sum-difference', 'closest-subsequence-sum', 'count-of-smaller-numbers-after-self', 'rectangle-area-ii', 'the-skyline-problem', 'car-pooling', 'my-calendar-iii'],
};

const QUERY = 'query q($s: String!) { question(titleSlug: $s) { questionFrontendId title titleSlug difficulty isPaidOnly topicTags { slug } } }';
async function fetchQuestion(slug) {
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', referer: `https://leetcode.com/problems/${slug}/`, 'user-agent': 'Mozilla/5.0 PrepForge-research' },
    body: JSON.stringify({ query: QUERY, variables: { s: slug } }),
  });
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const q = (await res.json()).data?.question;
  if (!q || q.titleSlug !== slug) throw new Error(`${slug}: not found on LeetCode`);
  return q;
}

const bank = new Set(JSON.parse(readFileSync(resolve(here, '../dsa-problems.verified.json'), 'utf8')).map((p) => p.slug));
const records = new Map();
let failed = 0;
for (const [topic, slugs] of Object.entries(CURATED)) {
  for (const slug of slugs) {
    if (!records.has(slug)) {
      try {
        const q = await fetchQuestion(slug);
        records.set(slug, { id: Number(q.questionFrontendId), slug, title: q.title, difficulty: q.difficulty, premium: q.isPaidOnly, url: `https://leetcode.com/problems/${slug}/`, leetcodeTags: q.topicTags.map((t) => t.slug), inMainBank: bank.has(slug), topics: [] });
      } catch (e) { failed += 1; console.error(`FAIL ${e.message}`); continue; }
      await new Promise((r) => setTimeout(r, 250));
    }
    records.get(slug).topics.push(topic);
  }
}
const out = [...records.values()].sort((a, b) => a.id - b.id);
writeFileSync(resolve(here, '../curated-problems.verified.json'), JSON.stringify({ verifiedOn: new Date().toISOString().slice(0, 10), source: 'LeetCode GraphQL question(titleSlug)', problems: out }, null, 1) + '\n');
console.log(`${out.length} verified (${out.filter((p) => !p.inMainBank).length} new to the bank), ${failed} failed`);
process.exit(failed ? 1 : 0);

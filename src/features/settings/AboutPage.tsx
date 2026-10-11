import { MCQS, PROBLEMS, SQL_EXERCISES, TOPICS, WALKTHROUGHS } from '@/content/registry';
import { COMPANIES } from '@/content/companies';
import { PageHeader } from '@/components/ui';

export default function AboutPage() {
  const complete = TOPICS.filter((t) => t.status === 'complete').length;
  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Account" title="About PrepForge and its limits" lead="What is real, what is self-reported, and what is still planned." />
      <section className="card prose" style={{ maxWidth: 'none' }}>
        <h2>Current content (counted live from the app)</h2>
        <ul>
          <li>{TOPICS.length} topics in the curriculum; <strong>{complete}</strong> have complete lessons. The rest are marked “Planned”.</li>
          <li>{PROBLEMS.length} DSA problems verified against LeetCode; {Object.keys(WALKTHROUGHS).length} have authored coach walkthroughs, the rest have pattern-level guidance.</li>
          <li>{MCQS.length} MCQs with explanations; {MCQS.filter((m) => m.verified === 'compiled').length} code-output questions were compiled and run to confirm the answer.</li>
          <li>{SQL_EXERCISES.length} auto-graded SQL exercises.</li>
          <li>{COMPANIES.length} company pages; {COMPANIES.filter((c) => c.facts.length).length} include facts verified from official sources.</li>
        </ul>
        <h2>What is executed, and what is self-reported</h2>
        <ul>
          <li><strong>SQL</strong> runs for real in your browser (SQLite via WebAssembly, sandboxed, with a 3-second limit). Answers are graded by comparing results on the sample data and on hidden edge-case datasets.</li>
          <li><strong>C++ and Java code is not executed in PrepForge.</strong> You solve coding problems on LeetCode and report the outcome yourself. Self-reported results are labelled and excluded from auto-scored assessment totals.</li>
          <li><strong>There is no AI in PrepForge.</strong> The coach is deterministic: authored hints, or pattern guidance derived from the topic.</li>
        </ul>
        <h2>Data and privacy</h2>
        <ul>
          <li>All progress is stored in this browser's local storage under the key <code>prepforge:v1</code>. Nothing is sent to a server. Export a backup from Settings.</li>
        </ul>
        <h2>Scores</h2>
        <ul>
          <li>Mastery and readiness are computed from your own evidence (first attempts, hints used, timed results, delayed recall). They summarise preparation and <strong>do not predict hiring outcomes</strong>.</li>
        </ul>
        <h2>Sources</h2>
        <ul>
          <li>Problem lists: NeetCode 150 and Blind 75 (NeetCode's public site data), LeetCode Top Interview 150, LeetCode 75 and SQL 50 (LeetCode study plans), Striver A2Z (LeetCode-linked items from the public sheet). Problem statements are not copied; each links to the official page.</li>
        </ul>
      </section>
    </div>
  );
}

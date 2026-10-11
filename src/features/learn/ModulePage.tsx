import { Link, useParams } from 'react-router-dom';
import { MODULE_BY_ID, topicsOf, TOPIC_BY_ID, SQL_EXERCISES } from '@/content/registry';
import type { ModuleId } from '@/content/schema';
import { useMasteryMap } from '@/hooks/useDerived';
import { LevelBadge, PageHeader, StatusBadge, Badge } from '@/components/ui';
import NotFound from '@/features/NotFound';

const LEVEL_TITLE = { foundation: 'Foundations', core: 'Core', advanced: 'Advanced track' } as const;

const MODULE_LINKS: Partial<Record<ModuleId, { to: string; label: string }[]>> = {
  dsa: [{ to: '/problems', label: 'Problem bank' }, { to: '/practice/mcq?module=dsa', label: 'DSA MCQs' }],
  sql: [{ to: '/sql/lab', label: 'SQL lab' }, { to: '/practice/mcq?module=sql', label: 'SQL MCQs' }],
  dbms: [{ to: '/tools/fd', label: 'FD toolkit' }, { to: '/practice/mcq?module=dbms', label: 'DBMS MCQs' }],
  os: [{ to: '/tools/cpu-scheduling', label: 'CPU scheduling simulator' }, { to: '/tools/page-replacement', label: 'Page replacement simulator' }],
  cn: [{ to: '/tools/subnet', label: 'Subnet calculator' }],
};

export default function ModulePage() {
  const { moduleId } = useParams();
  const mod = MODULE_BY_ID.get(moduleId as ModuleId);
  const mastery = useMasteryMap();
  if (!mod) return <NotFound />;
  const topics = topicsOf(mod.id);
  const levels = (['foundation', 'core', 'advanced'] as const).filter((l) => topics.some((t) => t.level === l));

  return (
    <div className="stack-lg">
      <PageHeader
        crumbs={[{ to: '/learn', label: 'Learn' }]}
        eyebrow="Subject"
        title={mod.title}
        lead={mod.description}
        actions={(MODULE_LINKS[mod.id] ?? []).map((l) => <Link key={l.to} to={l.to} className="btn btn--secondary">{l.label}</Link>)}
      />
      {levels.map((lvl) => (
        <section key={lvl} aria-labelledby={`lvl-${lvl}`}>
          <h2 id={`lvl-${lvl}`} className="mb-4" style={{ fontSize: 'var(--fs-lg)' }}>{LEVEL_TITLE[lvl]}</h2>
          <div className="topic-list">
            {topics.filter((t) => t.level === lvl).map((t) => {
              const m = mastery.get(t.id)!;
              const practiceCount = mod.id === 'dsa' ? t.problemIds.length : mod.id === 'sql' ? SQL_EXERCISES.filter((e) => e.topicIds.includes(t.id)).length : 0;
              return (
                <Link key={t.id} to={`/learn/${mod.id}/${t.id}`} className="topic-row">
                  <span className="grow">
                    <span className="topic-row__title">{t.title}</span>
                    <span className="small muted" style={{ display: 'block' }}>{t.summary}</span>
                    {t.prerequisites.length > 0 && (
                      <span className="xsmall muted" style={{ display: 'block', marginTop: 2 }}>Needs: {t.prerequisites.map((p) => TOPIC_BY_ID.get(p)?.title ?? p).join(', ')}</span>
                    )}
                  </span>
                  <span className="topic-row__meta">
                    <StatusBadge status={t.status} />
                    {t.mcqIds.length > 0 && <Badge tone="outline">{t.mcqIds.length} MCQs</Badge>}
                    {practiceCount > 0 && <Badge tone="outline">{practiceCount} {mod.id === 'sql' ? 'exercises' : 'problems'}</Badge>}
                    <LevelBadge level={m.level} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

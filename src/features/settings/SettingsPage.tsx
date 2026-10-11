import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportState, STORAGE_KEY, useStore, validateImport } from '@/store/store';
import type { PersistedState } from '@/store/types';
import { COMPANIES } from '@/content/companies';
import { Callout, PageHeader } from '@/components/ui';

export default function SettingsPage() {
  const profile = useStore((s) => s.profile);
  const update = useStore((s) => s.updateProfile);
  const importState = useStore((s) => s.importState);
  const resetAll = useStore((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tone: 'success' | 'danger' | 'info'; text: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<PersistedState | null>(null);
  const [confirmText, setConfirmText] = useState('');

  let bytes = 0;
  try { bytes = (localStorage.getItem(STORAGE_KEY) ?? '').length * 2; } catch { /* storage unavailable */ }

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportState(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prepforge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg({ tone: 'success', text: 'Backup downloaded.' });
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const err = validateImport(data);
      if (err) { setMsg({ tone: 'danger', text: err }); return; }
      setPendingImport(data as PersistedState);
      setMsg({ tone: 'info', text: `Backup contains ${(data.mcqAttempts ?? []).length} MCQ answers, ${Object.keys(data.problemProgress ?? {}).length} problems and ${(data.assessments ?? []).length} assessments. Importing replaces your current data.` });
    } catch {
      setMsg({ tone: 'danger', text: 'That file is not valid JSON.' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Account" title="Settings" />
      <section className="card stack">
        <h2 className="card__title">Profile and plan</h2>
        <div className="grid grid-2">
          <label className="field"><span className="label">Name</span><input className="input" value={profile.name} maxLength={40} onChange={(e) => update({ name: e.target.value })} /></label>
          <label className="field"><span className="label">Study minutes per day</span><input className="input" type="number" min={30} max={600} value={profile.dailyMinutes} onChange={(e) => update({ dailyMinutes: Math.max(30, Math.min(600, Number(e.target.value) || 30)) })} /></label>
          <label className="field"><span className="label">Preferred language</span>
            <select className="select" value={profile.preferredLang} onChange={(e) => update({ preferredLang: e.target.value as 'cpp' | 'java' })}><option value="cpp">C++</option><option value="java">Java</option></select>
          </label>
          <label className="field"><span className="label">Target date (optional)</span><input className="input" type="date" value={profile.targetDate ?? ''} onChange={(e) => update({ targetDate: e.target.value || undefined })} /></label>
        </div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label mb-2">Target companies</legend>
          <div className="row" style={{ gap: 6 }}>
            {COMPANIES.map((c) => (
              <label key={c.id} className="check chip-check">
                <input type="checkbox" checked={profile.targetCompanies.includes(c.id)} onChange={(e) => update({ targetCompanies: e.target.checked ? [...profile.targetCompanies, c.id] : profile.targetCompanies.filter((x) => x !== c.id) })} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
        <h3 className="eyebrow">Weekly goals</h3>
        <div className="grid grid-4">
          {(['independentSolves', 'reviews', 'mcqs', 'assessments'] as const).map((k) => (
            <label key={k} className="field"><span className="label">{{ independentSolves: 'Independent solves', reviews: 'Reviews', mcqs: 'MCQs', assessments: 'Assessments' }[k]}</span>
              <input className="input" type="number" min={0} max={500} value={profile.weeklyGoals[k]} onChange={(e) => update({ weeklyGoals: { ...profile.weeklyGoals, [k]: Math.max(0, Number(e.target.value) || 0) } })} />
            </label>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h2 className="card__title">Your data</h2>
        <Callout tone="warning" title="Progress is stored only in this browser">
          PrepForge has no server. Your progress lives in this browser's local storage (about {(bytes / 1024).toFixed(1)} KB now). Clearing site data or switching device loses it. Export a backup regularly.
        </Callout>
        <div className="row">
          <button className="btn btn--primary" onClick={doExport}><Download /> Export backup (JSON)</button>
          <button className="btn btn--secondary" onClick={() => fileRef.current?.click()}><Upload /> Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        {msg && <Callout tone={msg.tone}>{msg.text}</Callout>}
        {pendingImport && (
          <div className="row">
            <button className="btn btn--danger" onClick={() => { importState(pendingImport); setPendingImport(null); setMsg({ tone: 'success', text: 'Backup imported.' }); }}>Replace my data with this backup</button>
            <button className="btn btn--ghost" onClick={() => { setPendingImport(null); setMsg(null); }}>Cancel</button>
          </div>
        )}
        <hr className="divider" />
        <h3 className="eyebrow">Reset everything</h3>
        <p className="small muted">Permanently deletes all progress in this browser. Type RESET to confirm.</p>
        <div className="row">
          <input className="input" style={{ width: 160 }} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label="Type RESET to confirm" />
          <button className="btn btn--danger" disabled={confirmText !== 'RESET'} onClick={() => { resetAll(); setConfirmText(''); setMsg({ tone: 'success', text: 'All data reset.' }); }}>Reset all data</button>
        </div>
      </section>
    </div>
  );
}

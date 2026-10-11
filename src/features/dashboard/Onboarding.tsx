import { useState } from 'react';
import { useStore } from '@/store/store';
import { COMPANIES } from '@/content/companies';

export function Onboarding() {
  const profile = useStore((s) => s.profile);
  const update = useStore((s) => s.updateProfile);
  const [name, setName] = useState(profile.name);
  const [minutes, setMinutes] = useState(profile.dailyMinutes);
  const [lang, setLang] = useState(profile.preferredLang);
  const [targets, setTargets] = useState<string[]>(profile.targetCompanies);

  return (
    <section className="card" aria-labelledby="onb-h" style={{ borderColor: 'var(--ink)' }}>
      <h2 id="onb-h" className="card__title">Set up your plan (30 seconds)</h2>
      <p className="card__sub mb-4">These settings shape your daily plan and company readiness views. You can change them later in Settings.</p>
      <form
        className="grid grid-2"
        onSubmit={(e) => {
          e.preventDefault();
          update({ name: name.trim(), dailyMinutes: minutes, preferredLang: lang, targetCompanies: targets, onboarded: true });
        }}
      >
        <label className="field">
          <span className="label">Your first name (optional)</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </label>
        <label className="field">
          <span className="label">Study time per day</span>
          <select className="select" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
            {[45, 60, 90, 120, 180, 240, 300].map((m) => <option key={m} value={m}>{m >= 60 ? `${m / 60} hour${m > 60 ? 's' : ''}` : `${m} minutes`}</option>)}
          </select>
        </label>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label mb-2">Preferred language for code</legend>
          <div className="segmented" role="group" aria-label="Preferred language">
            <button type="button" aria-pressed={lang === 'cpp'} onClick={() => setLang('cpp')}>C++</button>
            <button type="button" aria-pressed={lang === 'java'} onClick={() => setLang('java')}>Java</button>
          </div>
        </fieldset>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label mb-2">Target companies</legend>
          <div className="row" style={{ gap: 6 }}>
            {COMPANIES.map((c) => (
              <label key={c.id} className="check chip-check">
                <input type="checkbox" checked={targets.includes(c.id)} onChange={(e) => setTargets((t) => (e.target.checked ? [...t, c.id] : t.filter((x) => x !== c.id)))} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="row" style={{ gridColumn: '1 / -1' }}>
          <button className="btn btn--primary" type="submit">Save and build my plan</button>
          <button className="btn btn--ghost" type="button" onClick={() => update({ onboarded: true })}>Skip for now</button>
        </div>
      </form>
    </section>
  );
}

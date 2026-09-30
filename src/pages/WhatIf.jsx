import { useMemo, useState } from 'react';
import { FlaskConical, Plus, X, Sparkles, RotateCcw, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Notice, PageHeader, Field, FieldError, inputCls } from '../components/ui';
import { simulate, validateChange, KINDS, kindLabel } from '../utils/whatif';
import { HORIZON_DAYS, inr } from '../utils/waste';
import { longDate } from '../utils/medicine';

const MAX_CHANGES = 8;
const daysText = (a) => (a.est.ok ? `about ${a.est.days} days` : 'No estimate');
const leftoverText = (a) => (a.state === 'expired' ? `All ${a.m.qty} (expired)` : a.est.ok ? `${a.leftover}${a.days > HORIZON_DAYS ? ` (expiry is over ${HORIZON_DAYS} days away)` : ''}` : 'Not estimable');
const rowsOf = (a) => [
  ['Quantity on hand', a.m.qty],
  ['Days of supply', daysText(a)],
  ['Runs out about', a.est.ok ? longDate(a.est.date) : 'No estimate'],
  ['Low stock', a.low ? 'Yes' : 'No'],
  ['Left over at expiry', leftoverText(a)],
  ['Recorded value at risk', a.leftoverValue != null ? inr(a.leftoverValue) : 'Not available'],
];

function Panel({ title, sim, a, other }) {
  return (
    <div className={`rounded-xl p-4 ${sim ? 'sim-surface border-2 border-dashed border-teal-500 bg-teal-50/40' : 'bg-white ring-1 ring-slate-200'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-600">{title}</p>
        {sim ? <Badge tone="dark">SIMULATED</Badge> : <Badge tone="green"><ShieldCheck size={12} className="mr-1" aria-hidden="true" />Saved data</Badge>}
      </div>
      <dl className="divide-y divide-slate-100 text-sm">
        {rowsOf(a).map(([k, v], i) => { const changed = sim && String(rowsOf(other)[i][1]) !== String(v); return (
          <div key={k} className="flex items-start justify-between gap-3 py-1.5">
            <dt className="text-slate-500">{k}</dt>
            <dd className={`text-right ${changed ? 'font-extrabold text-teal-700' : 'font-semibold'}`}>{v}{changed && <span className="ml-1.5 rounded bg-teal-600 px-1.5 py-0.5 align-middle text-[11px] font-bold text-white">changed</span>}</dd>
          </div>); })}
      </dl>
    </div>
  );
}

const Metric = ({ label, real, sim }) => (
  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className="mt-1 text-sm"><span className="text-slate-500">Saved:</span> <b className="tabular-nums">{real}</b></p>
    <p className="text-sm"><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-extrabold text-white">SIMULATED</span> <b className="tabular-nums text-teal-700">{sim}</b></p>
  </div>
);

export default function WhatIf() {
  const { medicines, reminders, patients, patient, settings } = useApp();
  const [memberId, setMemberId] = useState(patient.id);
  const [kind, setKind] = useState('refill'); const [medId, setMedId] = useState(''); const [value, setValue] = useState('');
  const [changes, setChanges] = useState([]); const [tried, setTried] = useState(false);

  const isExpired = (m) => m.expiry && new Date(m.expiry) < new Date(new Date().toDateString());
  const options = medicines.filter((m) => m.patientId === memberId && (kind !== 'dispose' || isExpired(m)));
  const med = options.find((m) => m.id === medId) || options[0];
  const err = validateChange(kind, value, med);
  const result = useMemo(() => (changes.length ? simulate(medicines, reminders, changes, settings.refillDays) : null), [medicines, reminders, changes, settings.refillDays]);
  const nameOf = (id) => medicines.find((m) => m.id === id)?.name || 'Removed medicine';

  const add = (e) => {
    e.preventDefault(); setTried(true);
    if (err || changes.length >= MAX_CHANGES) return;
    setChanges([...changes, { id: `c${Date.now()}`, medicineId: med.id, kind, value: kind === 'dispose' ? 0 : Number(value) }]);
    setTried(false); setValue('');
  };
  const example = () => {
    const low = medicines.find((m) => m.qty < m.minQty && reminders.some((r) => r.medicineId === m.id)) || medicines[0]; if (!low) return;
    setMemberId(low.patientId); setKind('refill'); setMedId(low.id); setValue('30'); setChanges([{ id: `c${Date.now()}`, medicineId: low.id, kind: 'refill', value: 30 }]); setTried(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={FlaskConical} title="What-If Inventory Simulator" subtitle="Explore how hypothetical stock changes would look. Nothing here is saved."
        actions={<><button onClick={example} className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-navy-900 ring-1 ring-slate-200 hover:bg-slate-50"><Sparkles size={15} aria-hidden="true" />Try an example</button>
          <button onClick={() => { setChanges([]); setValue(''); setTried(false); }} disabled={!changes.length} className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"><RotateCcw size={15} aria-hidden="true" />Clear simulation</button></>} />

      <div role="note" className="sim-surface rounded-2xl border-2 border-dashed border-teal-500 bg-teal-50 p-4">
        <p className="flex items-center gap-2 text-sm font-extrabold text-teal-800"><FlaskConical size={17} aria-hidden="true" />Simulation only. Your real inventory is not changed by anything on this page.</p>
        <p className="mt-1 text-sm text-teal-900">Results appear in a dashed, labelled "SIMULATED" panel next to your saved data. Leaving this page discards the simulation.</p>
      </div>
      <Notice tone="amber">This tool changes <b>stock</b> only. It reads your medicine schedule from Reminders exactly as it is. It cannot simulate stopping a treatment or changing a prescribed dose, and it gives no medical advice. Decisions about doses and treatment belong to your doctor.</Notice>

      <Card title="Build a hypothetical">
        <form onSubmit={add} noValidate className="grid gap-3 md:grid-cols-2">
          <Field label="Family member"><select className={inputCls} value={memberId} onChange={(e) => { setMemberId(e.target.value); setMedId(''); }}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Medicine">
            <select className={inputCls} value={med?.id || ''} disabled={!options.length} onChange={(e) => setMedId(e.target.value)} aria-invalid={tried && !med}>
              {options.length === 0 ? <option value="">{kind === 'dispose' ? 'No expired medicines' : 'No medicines'}</option> : options.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.qty} on hand)</option>)}</select></Field>
          <fieldset className="md:col-span-2">
            <legend className="mb-1 text-xs font-semibold text-slate-600">What if...</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {KINDS.map((k) => (
                <label key={k.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 bg-white p-3 ${kind === k.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}>
                  <input type="radio" name="kind" className="mt-1 accent-teal-600" checked={kind === k.id} onChange={() => { setKind(k.id); setMedId(''); setTried(false); }} />
                  <span><span className="block text-sm font-bold">{k.label}</span><span className="text-xs text-slate-500">{k.hint}</span></span></label>))}
            </div>
          </fieldset>
          {kind !== 'dispose' && (
            <Field label={KINDS.find((k) => k.id === kind).field}>
              <input type="number" inputMode="numeric" min={kind === 'refill' ? 1 : 0} className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={tried && !!err} placeholder="Whole number" />
              <FieldError show={tried} >{err}</FieldError></Field>)}
          {kind === 'dispose' && tried && err && <div className="md:col-span-2"><FieldError show>{err}</FieldError></div>}
          <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-2">
            <p className="text-xs text-slate-500">{changes.length >= MAX_CHANGES ? `You have reached the limit of ${MAX_CHANGES} changes. Remove one to add another.` : 'Value scales with the same value per unit as your current stock.'}</p>
            <button disabled={changes.length >= MAX_CHANGES} className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-40"><Plus size={16} aria-hidden="true" />Add to simulation</button>
          </div>
        </form>
      </Card>

      {changes.length > 0 && (
        <Card title="Hypothetical changes in this simulation" action={<Badge tone="dark">SIMULATED</Badge>}>
          <ul className="flex flex-wrap gap-2">
            {changes.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-full bg-teal-50 py-1 pl-3 pr-1 text-sm ring-1 ring-teal-500/40">
                <span><b>{kindLabel(c.kind)}</b>{c.kind !== 'dispose' && `: ${c.value}`} for {nameOf(c.medicineId)}</span>
                <button onClick={() => setChanges(changes.filter((x) => x.id !== c.id))} aria-label={`Remove change: ${kindLabel(c.kind)} for ${nameOf(c.medicineId)}`} className="rounded-full p-1.5 text-slate-500 hover:bg-white"><X size={14} /></button></li>))}
          </ul>
        </Card>)}

      <section aria-label="Simulation results" aria-live="polite" className="space-y-4">
        {!result ? (
          <Empty icon={FlaskConical}>No simulation yet. Choose a medicine and a change above, add it, and compare the result with your saved inventory. Or select "Try an example".</Empty>
        ) : (<>
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Low-stock medicines (whole family)" real={result.real.lowCount} sim={result.sim.lowCount} />
            <Metric label="Potential waste value (whole family)" real={inr(result.real.potentialValue)} sim={inr(result.sim.potentialValue)} />
            <Metric label="Medicines changed in this simulation" real="0" sim={result.touched.length} />
          </div>
          {result.touched.map((t) => (
            <Card key={t.id} title={t.real.m.name} action={<span className="text-xs text-slate-500">{patients.find((p) => p.id === t.real.m.patientId)?.name}, {t.real.m.form}</span>}>
              <div className="grid gap-3 md:grid-cols-2"><Panel title="Real inventory now" a={t.real} /><Panel sim title="If this happened" a={t.sim} other={t.real} /></div>
            </Card>))}
          <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">Estimates use the fixed schedule in Reminders and assume doses are taken as scheduled. Left-over stock is projected only to the expiry date. Medicines with no fixed schedule get no estimate. Totals count projected leftover only for medicines expiring within {HORIZON_DAYS} days.</p>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
            <p className="text-sm text-slate-600">Want to record a real refill or a recount? Do it in the Supply and Refill Planner. This page will not do it for you.</p>
            <a href="#/refill" className="flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800">Open Refill Planner<ArrowRight size={15} aria-hidden="true" /></a>
          </div>
        </>)}
        <p className="sr-only">{result ? `Simulation updated with ${changes.length} change${changes.length === 1 ? '' : 's'}.` : ''}</p>
      </section>
    </div>
  );
}

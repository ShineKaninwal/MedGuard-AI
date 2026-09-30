import { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, ChevronDown, AlertTriangle, Loader2, CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Notice, PageBanner, inputCls } from '../components/ui';
import AgentTimeline from '../components/AgentTimeline';
import { PolicyLink } from '../components/AgentPolicy';
import { runAuditPipeline, STEP_META } from '../utils/auditEngine';
import { longDate } from '../utils/medicine';

function Section({ title, count, tone = 'slate', children, open: o = false, empty = 'Nothing found.' }) {
  const [open, setOpen] = useState(o);
  return (
    <div className="rounded-xl ring-1 ring-slate-100">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-bold">{title}<Badge tone={count ? tone : 'green'}>{count}</Badge></span>
        <ChevronDown size={16} aria-hidden="true" className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-slate-100 px-4 py-3 text-sm">{count === 0 ? <p className="text-slate-500">{empty}</p> : children}</div>}
    </div>
  );
}
const Li = ({ children }) => <li className="py-1.5">{children}</li>;
const LEVEL = { high: ['red', 'Higher likelihood'], medium: ['amber', 'Possible'], low: ['slate', 'Similar names only'] };
const PRIORITY = { high: ['red', 'Do first'], medium: ['amber', 'Soon'], low: ['slate', 'When you can'] };

// Progress ring. It fills only as steps really finish (done / total), never on a timer.
function Ring({ done, total, failed }) {
  const r = 26, c = 2 * Math.PI * r, pct = total ? done / total : 0;
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Audit steps finished" className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-mint-100" />
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className={`transition-all duration-300 ${failed ? 'stroke-coral-500' : 'stroke-teal-600'}`} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-extrabold tabular-nums">{done}/{total}</span>
    </div>
  );
}

// Human confirmation. Confirming records that a person reviewed the report. It changes no medicine, dose or schedule and notifies no one.
function ReviewPanel({ r }) {
  const { acknowledgeAudit, navigate } = useApp();
  const acts = (r.actions || []).map((a, i) => (typeof a === 'string' ? { id: `a${i + 1}`, priority: 'medium', text: a } : a));
  const [checked, setChecked] = useState(() => new Set(r.confirmation?.checked || []));
  useEffect(() => { setChecked(new Set(r.confirmation?.checked || [])); }, [r.id]); // eslint-disable-line
  const toggle = (id) => setChecked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const openHigh = acts.filter((a) => a.priority === 'high' && !checked.has(a.id)).length;
  const done = Boolean(r.confirmation);
  return (
    <div className="rounded-xl ring-1 ring-mint-200">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl bg-mint-100 px-4 py-3">
        <h3 className="text-sm font-extrabold">Review and confirm</h3>
        <Badge tone={done ? 'green' : 'amber'}>{done ? 'Reviewed by you' : 'Waiting for your review'}</Badge>
      </div>
      <div className="space-y-3 px-4 py-3 text-sm">
        <p className="text-slate-600">These are things for you to check or ask about. The app changes nothing by itself. Tick each one once you have checked it.</p>
        <ul className="divide-y divide-slate-100">
          {acts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2">
              <input id={`act-${a.id}`} type="checkbox" className="mt-1 h-4 w-4 accent-teal-600" checked={checked.has(a.id)} disabled={done} onChange={() => toggle(a.id)} />
              <label htmlFor={`act-${a.id}`} className={`min-w-0 flex-1 ${checked.has(a.id) ? 'text-slate-500 line-through' : ''}`}>{a.text}</label>
              <span className="flex items-center gap-2">
                <Badge tone={(PRIORITY[a.priority] || PRIORITY.medium)[0]}>{(PRIORITY[a.priority] || PRIORITY.medium)[1]}</Badge>
                {a.page && <button type="button" onClick={() => navigate(a.page)} className="flex items-center gap-1 text-xs font-bold text-teal-700 underline"><ExternalLink size={12} aria-hidden="true" />{a.pageLabel}</button>}
              </span>
            </li>))}
        </ul>
        {done ? (
          <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-900"><CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden="true" />You confirmed this review on {new Date(r.confirmation.reviewedAt).toLocaleString()}: {r.confirmation.checked.length} of {acts.length} actions ticked as checked. This is a note of your review only. Nothing else was changed or sent.</p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600">{checked.size} of {acts.length} ticked{openHigh ? `. ${openHigh} "Do first" item${openHigh > 1 ? 's are' : ' is'} still unticked.` : '.'} Confirming only records that you reviewed this report.</p>
            <button type="button" onClick={() => acknowledgeAudit(r.id, [...checked])} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700">Confirm review</button>
          </div>)}
      </div>
    </div>
  );
}

function Report({ r }) {
  const e = r.expiry, rc = r.recon, low = r.lowStock || [];
  const urgent = e.expired.length + r.duplicates.filter((d) => d.level !== 'low').length;
  const tiles = [['Checked', r.checked, ''], ['Past expiry', e.expired.length, e.expired.length ? 'text-red-700' : ''], ['Expiring soon', e.expiring.length, e.expiring.length ? 'text-amber-700' : ''],
    ['Low stock', low.length, low.length ? 'text-amber-700' : ''], ['Possible duplicates', r.duplicates.length, r.duplicates.length ? 'text-amber-700' : ''], ['Missing info', r.missing.length + e.missing.length, ''], ['Not on inventory', rc ? rc.notFound.length : '-', '']];
  return (
    <Card title="Audit report" action={<span className="text-xs text-slate-500">{new Date(r.ts).toLocaleString()}</span>}>
      <p className="mb-3 text-sm text-slate-600"><b className="text-navy-900">{r.patientName}</b>. Prescription used: {r.rx ? `${r.rx.doctor || 'Unknown'}, ${longDate(r.rx.date)}` : 'none'}. <Badge>Rule-based checks, no AI model</Badge></p>
      {r.incomplete && <Notice tone="red" className="mb-3"><b>This audit is incomplete.</b> These steps failed: {(r.failedSteps || []).join(', ')}. Results that depend on them are missing, not "clear". Run the audit again.</Notice>}
      {!r.incomplete && <Notice tone={urgent ? 'amber' : 'teal'} className="mb-3">{urgent ? `${urgent} item${urgent > 1 ? 's' : ''} to look at first: expired medicine or a likely duplicate. Start with "Do first" below.` : r.findings ? 'No expired medicine or likely duplicate. A few items still need a look.' : 'Nothing was flagged from the data you entered. That does not confirm the medicines are safe.'}</Notice>}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {tiles.map(([l, v, c]) => <div key={l} className="rounded-xl bg-slate-50 p-3 text-center"><p className={`text-xl font-extrabold tabular-nums ${c}`}>{v}</p><p className="text-[11px] leading-tight text-slate-600">{l}</p></div>)}
      </div>
      <div className="space-y-2">
        <Section open title="Expiry (by recorded date)" count={e.expired.length + e.expiring.length + e.missing.length} tone="amber">
          <ul className="divide-y divide-slate-100">
            {e.expired.map((x) => <Li key={x.medicine.id}><Badge tone="red">Past recorded expiry</Badge> <b>{x.medicine.name}</b>, {x.days} days ago ({longDate(x.date)})</Li>)}
            {e.expiring.map((x) => <Li key={x.medicine.id}><Badge tone="amber">Expiring soon</Badge> <b>{x.medicine.name}</b>, in {x.days} days ({longDate(x.date)})</Li>)}
            {e.missing.map((x) => <Li key={x.medicine.id}><Badge>No expiry date</Badge> <b>{x.medicine.name}</b></Li>)}
          </ul>
        </Section>
        <Section open title="Low stock" count={low.length} tone="amber" empty="No medicine is below its minimum or about to run out.">
          <ul className="divide-y divide-slate-100">
            {low.map((x) => <Li key={x.medicine.id}><Badge tone="amber">Low</Badge> <b>{x.medicine.name}</b>: {x.qty} left{x.minQty ? `, minimum ${x.minQty}` : ''}.{' '}
              <span className="text-xs text-slate-600">{x.daysLeft !== null ? `About ${x.daysLeft} days at the schedule you entered.` : `Days left: not estimated. ${x.daysNote}.`}</span></Li>)}
          </ul>
        </Section>
        <Section open title="Possible duplicates (for your review)" count={r.duplicates.length} tone="amber">
          <ul className="divide-y divide-slate-100">
            {r.duplicates.map((d, i) => <Li key={i}><Badge tone={LEVEL[d.level][0]}>{LEVEL[d.level][1]}</Badge> <b>{d.a.name}</b> and <b>{d.b.name}</b><p className="text-xs text-slate-600">{d.reason}</p></Li>)}
          </ul>
          <p className="mt-2 text-xs text-slate-600">A flag is not a diagnosis. Similar medicines are not assumed to be interchangeable, and the app never says how they should be taken.</p>
        </Section>
        <Section title="Missing information" count={r.missing.length + r.unverified.length + (r.rxMissing?.length || 0)} tone="amber">
          <ul className="divide-y divide-slate-100">
            {r.missing.map((x) => <Li key={x.medicine.id}><b>{x.medicine.name}</b> is missing: {x.fields.join(', ')}</Li>)}
            {r.unverified.map((x) => <Li key={`u${x.id}`}><b>{x.name}</b> is unverified</Li>)}
            {r.rxMissing?.map((n) => <Li key={n}>Prescription item <b>{n}</b> has no strength</Li>)}
          </ul>
        </Section>
        <Section title="Prescription comparison" count={rc ? rc.matches.length + rc.uncertain.length + rc.notFound.length : 0} tone="slate" empty={rc ? 'The prescription list has no items.' : 'No prescription list was supplied, so nothing was compared.'}>
          {rc && (
            <div className="grid gap-3 md:grid-cols-2">
              {[['Possible matches (name and strength agree)', rc.matches.map((x) => `${x.item} ${x.strength} matches ${x.medicines.map((m) => m.name).join(', ')}`)],
                ['Uncertain matches: please check the label', rc.uncertain.map((x) => `${x.item} ${x.strength}: ${x.reason} (${x.medicines.map((m) => m.name).join(', ')})`)],
                ['On the list, not found in inventory', rc.notFound.map((x) => `${x.item} ${x.strength}`)],
                ['In inventory, not on the list', rc.extras.map((m) => m.name)]].map(([t, items]) => (
                <div key={t} className="rounded-xl bg-slate-50 p-3"><p className="mb-1 text-xs font-bold">{t} ({items.length})</p>
                  {items.length ? <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="text-xs text-slate-500">None</p>}</div>))}
            </div>
          )}
        </Section>
        <Section open title="What this report is unsure about" count={(r.uncertainty || []).length} tone="slate">
          <ul className="list-disc space-y-1.5 pl-5">{(r.uncertainty || []).map((u, i) => <li key={i}>{u}</li>)}</ul>
        </Section>
        <ReviewPanel r={r} />
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900"><AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />This audit checks the data you entered. It is not a substitute for review by a pharmacist or doctor, and it gives no treatment advice.</p>
    </Card>
  );
}

export default function Audit() {
  const { patient, patients, setPatient, prescriptions, medicines, reminders, settings, audits, saveAudit } = useApp();
  const rxs = prescriptions.filter((p) => p.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const [rxId, setRxId] = useState(rxs[0]?.id || '');
  const [prog, setProg] = useState({}); const [running, setRunning] = useState(false); const [failure, setFailure] = useState('');
  useEffect(() => { setRxId(rxs[0]?.id || ''); setProg({}); setFailure(''); }, [patient.id]); // eslint-disable-line
  const saved = audits.find((a) => a.report.patientId === patient.id);

  const start = async () => {
    setRunning(true); setProg({}); setFailure('');
    try {
      const res = await runAuditPipeline({ medicines, prescriptions, reminders, settings }, patient, rxId, (s) => setProg((p) => ({ ...p, [s.id]: s })));
      saveAudit(res.report, res.steps);
    } catch (e) { setFailure(`The audit could not finish: ${e.message}. No report was saved.`); }
    setRunning(false);
  };
  const steps = STEP_META.map((m) => (running ? prog[m.id] : saved?.steps.find((s) => s.id === m.id)) || { ...m, status: 'pending' });
  const doneCount = steps.filter((s) => !['pending', 'running'].includes(s.status)).length;
  const failed = steps.some((s) => s.status === 'error');

  return (
    <div className="space-y-5">
      <PageBanner icon={ShieldCheck} title="AI Medicine Audit" subtitle="Checks your inventory and prescription list step by step. Every step is ordinary code run on the data you entered."
        actions={<>
          <label className="text-xs font-semibold text-mint-100">Patient<select className={`${inputCls} mt-1`} value={patient.id} disabled={running} onChange={(e) => setPatient(e.target.value)}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="text-xs font-semibold text-mint-100">Prescription list<select className={`${inputCls} mt-1`} value={rxId} disabled={running} onChange={(e) => setRxId(e.target.value)}>
            <option value="">None (skip comparison)</option>{rxs.map((p) => <option key={p.id} value={p.id}>{p.doctor || 'Unknown'}, {longDate(p.date)}</option>)}</select></label>
          <button type="button" onClick={start} disabled={running} className="flex items-center gap-2 self-end rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-extrabold text-navy-900 hover:bg-gold-300 disabled:opacity-60">
            {running ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : saved ? <RefreshCw size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}{running ? 'Running...' : saved ? 'Run again' : 'Run AI Audit'}</button>
        </>} />

      <Notice tone="teal" icon={ShieldCheck}>
        <p><b>How to read this page.</b> The audit can flag expired, low-stock and possibly duplicated medicines and compare a prescription list with your inventory. It cannot diagnose, prescribe, or change a dose or schedule, and it never acts without you. It is not clinically validated and does not replace a pharmacist or doctor. Do not stop or change any medicine because of a flag here. <PolicyLink />.</p>
      </Notice>
      {failure && <Notice tone="red" icon={XCircle}>{failure}</Notice>}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card tone="sage" title="Stages" className="h-fit lg:col-span-1">
          <div className="mb-4 flex items-center gap-4">
            <Ring done={doneCount} total={STEP_META.length} failed={failed} />
            <p className="text-xs text-slate-600" role="status">{running ? 'Working through the steps. The ring fills as each step really finishes.' : saved ? `${doneCount} of ${STEP_META.length} steps finished in the last run${failed ? ', with at least one failure' : ''}.` : 'Not run yet.'}</p>
          </div>
          <AgentTimeline steps={steps} />
          <p className="mt-4 text-[11px] leading-snug text-slate-500">A short pause is added between steps so you can follow along. It does not change any result. Times shown are how long each check really took.</p>
        </Card>
        <div className="lg:col-span-2">
          {!running && saved ? <Report r={saved.report} /> : <Empty icon={ShieldCheck}>{running ? 'The report appears when all steps have finished.' : 'No audit yet for this patient. Choose a prescription list and run the audit.'}</Empty>}
        </div>
      </div>
    </div>
  );
}

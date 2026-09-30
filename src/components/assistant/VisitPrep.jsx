import { useState } from 'react';
import { Copy, Printer, Download, Plus, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, Empty, Field, inputCls } from '../ui';
import { buildNotes, SUGGESTED_QUESTIONS } from '../../utils/visitPrep';
import { todayKey, addDays } from '../../utils/dates';
import { longDate } from '../../utils/medicine';
import { sevLabel } from './SymptomModal';

const RANGES = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['all', 'All entries']];

export default function VisitPrep() {
  const { patient, symptoms, medicines, appointments, visitNotes, saveVisit, navigate } = useApp();
  const v = visitNotes[patient.id] || { questions: [], notes: '' };
  const [range, setRange] = useState('30'); const [off, setOff] = useState({}); const [apptId, setApptId] = useState(''); const [custom, setCustom] = useState(''); const [done, setDone] = useState('');
  const from = range === 'all' ? '0000' : addDays(todayKey(), -Number(range));
  const inRange = symptoms.filter((s) => s.patientId === patient.id && s.date >= from).sort((a, b) => a.date.localeCompare(b.date));
  const entries = inRange.filter((e) => !off[e.id]);
  const meds = medicines.filter((m) => m.patientId === patient.id);
  const upcoming = appointments.filter((a) => a.patientId === patient.id && a.date >= todayKey()).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const appt = upcoming.find((a) => a.id === apptId);
  const text = buildNotes({ patient, entries, meds, questions: v.questions, notes: v.notes, appt });
  const toggleQ = (q) => saveVisit(patient.id, { questions: v.questions.includes(q) ? v.questions.filter((x) => x !== q) : [...v.questions, q] });
  const addQ = () => { const q = custom.trim(); if (q && !v.questions.includes(q)) saveVisit(patient.id, { questions: [...v.questions, q] }); setCustom(''); };
  const flash = (m) => { setDone(m); setTimeout(() => setDone(''), 2000); };
  const copy = async () => { try { await navigator.clipboard.writeText(text); flash('Copied'); } catch { flash('Copy failed. Select the text and copy it manually.'); } };
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = `visit-notes-${patient.name.split(' ')[0].toLowerCase()}-${todayKey()}.txt`; a.click(); URL.revokeObjectURL(a.href); };
  const extra = v.questions.filter((q) => !SUGGESTED_QUESTIONS.includes(q));
  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        <p className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600">This builds a notes sheet from what you entered. It does not book appointments, create treatment plans, or suggest what the doctor should do. To add an appointment, use the <button onClick={() => navigate('appointments')} className="font-bold text-teal-700 underline">Appointments page</button>.</p>
        <Card title="1. Symptoms to include" action={<select aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold">{RANGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}>
          {inRange.length === 0 ? <Empty>No symptom entries for {patient.name.split(' ')[0]} in this period. Add entries in the Symptom history tab.</Empty> : (
            <ul className="divide-y divide-slate-100">{inRange.map((e) => (
              <li key={e.id} className="py-2"><label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={!off[e.id]} onChange={() => setOff({ ...off, [e.id]: !off[e.id] })} className="mt-1 accent-teal-500" />
                <span><b>{e.text}</b><span className="block text-xs text-slate-500">{longDate(e.date)}, {e.duration}, you rated it {e.severity}/10 ({sevLabel(e.severity)}){e.sample ? ', sample entry' : ''}</span></span></label></li>))}</ul>)}
        </Card>
        <Card title="2. Questions to ask">
          <ul className="space-y-1.5">{SUGGESTED_QUESTIONS.map((q) => <li key={q}><label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={v.questions.includes(q)} onChange={() => toggleQ(q)} className="mt-1 accent-teal-500" />{q}</label></li>)}
            {extra.map((q) => <li key={q} className="flex items-start justify-between gap-2 text-sm"><span className="flex gap-3"><Check size={15} className="mt-0.5 text-teal-600" />{q}</span><button aria-label={`Remove question: ${q}`} onClick={() => toggleQ(q)} className="text-slate-500 hover:text-red-600"><X size={15} /></button></li>)}</ul>
          <form onSubmit={(e) => { e.preventDefault(); addQ(); }} className="mt-3 flex gap-2"><input value={custom} onChange={(e) => setCustom(e.target.value)} className={inputCls} placeholder="Add your own question" aria-label="Add your own question" />
            <button disabled={!custom.trim()} className="flex items-center gap-1 rounded-xl bg-navy-900 px-3 text-sm font-bold text-white disabled:opacity-40"><Plus size={15} />Add</button></form>
        </Card>
        <Card title="3. Other notes and appointment">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Refer to an existing appointment (optional)"><select className={inputCls} value={apptId} onChange={(e) => setApptId(e.target.value)}><option value="">None</option>{upcoming.map((a) => <option key={a.id} value={a.id}>{a.doctor}, {longDate(a.date)} {a.time}</option>)}</select></Field>
            <Field label="Anything else to mention" className="sm:col-span-2"><textarea rows={3} className={inputCls} value={v.notes} onChange={(e) => saveVisit(patient.id, { notes: e.target.value })} placeholder="Changes in routine, what you have already tried, worries..." /></Field>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card title="Your notes sheet" className="lg:sticky lg:top-6">
          <pre id="visit-notes" className="max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-navy-900" style={{ fontFamily: 'inherit' }}>{text}</pre>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={copy} className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700"><Copy size={14} />Copy</button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold ring-1 ring-slate-200 hover:bg-slate-50"><Printer size={14} />Print</button>
            <button onClick={download} className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold ring-1 ring-slate-200 hover:bg-slate-50"><Download size={14} />Download .txt</button>
            <span role="status" className="text-xs font-semibold text-teal-700">{done}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Notes are saved in this browser. Check medicines and allergies are correct before sharing.</p>
        </Card>
      </div>
    </div>
  );
}

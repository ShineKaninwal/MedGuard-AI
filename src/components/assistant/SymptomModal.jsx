import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal, Field, Needs, inputCls } from '../ui';
import { todayKey } from '../../utils/dates';
import { checkSafety, EMERGENCY_NUMBERS as N } from '../../utils/safety';

export const sevLabel = (n) => (n <= 3 ? 'Mild' : n <= 6 ? 'Moderate' : n <= 8 ? 'Severe' : 'Very severe');
export const sevTone = (n) => (n <= 3 ? 'green' : n <= 6 ? 'amber' : 'red');

export function SymptomModal({ initial, onClose }) {
  const { patients, patient, role, saveSymptom } = useApp();
  const [f, setF] = useState({ patientId: patient.id, text: '', date: todayKey(), duration: '', severity: 4, notes: '', ...initial });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ok = f.text.trim() && f.date && f.duration.trim();
  const danger = checkSafety(`${f.text} ${f.notes}`).level === 'emergency';
  return (
    <Modal title={initial?.id ? 'Edit symptom entry' : 'Save to symptom history'} onClose={onClose}>
      {danger && <p role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800"><AlertTriangle size={16} className="mt-0.5 shrink-0" />What you wrote may describe an emergency. Call {N.general} now rather than saving notes.</p>}
      <form onSubmit={(e) => { e.preventDefault(); if (ok) { saveSymptom({ ...f, text: f.text.trim(), duration: f.duration.trim(), severity: Number(f.severity), sample: false }); onClose(); } }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Family member" className="sm:col-span-2"><select className={inputCls} value={f.patientId} onChange={set('patientId')} disabled={role === 'patient'}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Symptom description *" className="sm:col-span-2"><textarea rows={3} className={inputCls} value={f.text} onChange={set('text')} autoFocus placeholder="In your own words" /></Field>
        <Field label="Date *"><input type="date" max={todayKey()} className={inputCls} value={f.date} onChange={set('date')} /></Field>
        <Field label="Duration *"><input className={inputCls} value={f.duration} onChange={set('duration')} placeholder="e.g. 3 days" /></Field>
        <Field label={`Severity as reported by you: ${f.severity}/10 (${sevLabel(f.severity)})`} className="sm:col-span-2">
          <input type="range" min="1" max="10" value={f.severity} onChange={set('severity')} className="w-full accent-teal-500" aria-label="Severity from 1 to 10" />
          <div className="flex justify-between text-[10px] text-slate-500"><span>1 mild</span><span>10 worst</span></div></Field>
        <Field label="Notes (optional)" className="sm:col-span-2"><input className={inputCls} value={f.notes} onChange={set('notes')} placeholder="What makes it better or worse, other things you noticed" /></Field>
        <p className="sm:col-span-2 text-[11px] text-slate-500">Saved in this browser only. Severity is your own rating, not a medical assessment.</p>
        <Needs className="sm:col-span-2" list={[[f.text.trim(), 'a description'], [f.date, 'a date'], [f.duration.trim(), 'how long it has lasted']]} />
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button disabled={!ok} className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">Save entry</button></div>
      </form>
    </Modal>
  );
}

import { useState } from 'react';
import { Plus, Pencil, Trash2, Bell, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Modal, Field, Needs, inputCls } from '../components/ui';
import { todayKey, addDays, fmtDate } from '../utils/dates';
import { dosesOn, DAY, ALL_DAYS } from '../utils/schedule';
import { notificationsSupported } from '../utils/notify';
import { useConfirm } from '../components/Feedback';

function Form({ initial, onClose }) {
  const { patients, medicines, patient, saveReminder } = useApp();
  const [f, setF] = useState({ patientId: patient.id, medicineId: '', type: 'fixed', time: '', days: [], units: '', dose: '', active: true, ...initial });
  const meds = medicines.filter((m) => m.patientId === f.patientId);
  const fixed = f.type === 'fixed';
  const ok = f.medicineId && (!fixed || (f.time && f.days.length && Number(f.units) > 0));
  const toggleDay = (d) => setF({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort() });
  const submit = (e) => { e.preventDefault(); if (!ok) return; saveReminder({ ...f, units: fixed ? Number(f.units) : 0, time: fixed ? f.time : '', days: fixed ? f.days : [] }); onClose(); };
  return (
    <Modal title={initial?.id ? 'Edit reminder' : 'Add reminder'} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Family member"><select className={inputCls} value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value, medicineId: '' })}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Medicine *"><select className={inputCls} value={f.medicineId} onChange={(e) => setF({ ...f, medicineId: e.target.value })}><option value="">Select</option>{meds.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <Field label="Schedule type" className="sm:col-span-2"><select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="fixed">Fixed schedule (times you set)</option><option value="as-needed">As needed (no scheduled doses)</option></select></Field>
        {fixed && (<>
          <Field label="Time *"><input type="time" className={inputCls} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
          <Field label="Units per dose *"><input type="number" min="0.5" step="0.5" className={inputCls} value={f.units} onChange={(e) => setF({ ...f, units: e.target.value })} placeholder="From your prescription" /></Field>
          <div className="sm:col-span-2"><p className="mb-1 text-xs font-semibold text-slate-600">Days *</p><div className="flex flex-wrap gap-1.5">
            {DAY.map((d, i) => <button type="button" key={d} aria-pressed={f.days.includes(i)} onClick={() => toggleDay(i)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${f.days.includes(i) ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{d}</button>)}
            <button type="button" onClick={() => setF({ ...f, days: ALL_DAYS })} className="px-2 text-xs font-bold text-teal-600">All days</button></div></div>
        </>)}
        <Field label="Your note (optional)" className="sm:col-span-2"><input className={inputCls} value={f.dose} onChange={(e) => setF({ ...f, dose: e.target.value })} placeholder="As written on your prescription" /></Field>
        <Needs className="sm:col-span-2" list={[[f.medicineId, 'a medicine'], ...(fixed ? [[f.time, 'a time'], [Number(f.units) > 0, 'units per dose (from your prescription)'], [f.days.length, 'at least one day']] : [])]} />
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button disabled={!ok} className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">Save reminder</button></div>
      </form>
    </Modal>
  );
}

export default function Reminders() {
  const { patient, patients, setPatient, reminders, medicines, deleteReminder, saveReminder } = useApp();
  const confirm = useConfirm();
  const [modal, setModal] = useState(null);
  const [perm, setPerm] = useState(notificationsSupported() ? Notification.permission : 'unsupported');
  const mine = reminders.filter((r) => r.patientId === patient.id);
  const medName = (id) => medicines.find((m) => m.id === id)?.name || 'Unknown medicine';
  const upcoming = [1, 2, 3, 4, 5, 6, 7].flatMap((i) => { const k = addDays(todayKey(), i); return dosesOn(mine, k).map((r) => ({ r, k })); }).slice(0, 8);
  const row = (r, k) => <li key={r.id + (k || '')} className="flex items-center gap-3 py-2 text-sm"><span className="w-14 font-bold tabular-nums text-teal-600">{r.time}</span><span className="flex-1 font-semibold">{medName(r.medicineId)}</span>{k && <span className="text-xs text-slate-500">{fmtDate(k)}</span>}</li>;
  const today = dosesOn(mine, todayKey());
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Reminders</h1></div>
        <div className="flex gap-2"><select className={`${inputCls} !w-auto`} value={patient.id} onChange={(e) => setPatient(e.target.value)} aria-label="Patient">{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <button onClick={() => setModal({})} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"><Plus size={16} />Add reminder</button></div>
      </div>
      <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle size={15} className="shrink-0" />Reminders are a prototype feature. Schedules come only from what you enter, and MedGuard never creates dosage schedules. Do not rely on this app for time-critical medicines.</p>
      <Card title="Browser notifications">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          {perm === 'unsupported' ? 'This browser does not support notifications.' : perm === 'granted' ? <Badge tone="green">Enabled. They only appear while this tab is open.</Badge> : perm === 'denied' ? 'Blocked in browser settings.' :
            <button onClick={async () => setPerm(await Notification.requestPermission())} className="flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white"><Bell size={15} />Enable notifications</button>}
        </div>
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Today">{today.length ? <ul className="divide-y divide-slate-100">{today.map((r) => row(r))}</ul> : <Empty>No reminders today.</Empty>}</Card>
        <Card title="Upcoming, next 7 days">{upcoming.length ? <ul className="divide-y divide-slate-100">{upcoming.map(({ r, k }) => row(r, k))}</ul> : <Empty>Nothing upcoming.</Empty>}</Card>
      </div>
      <Card title={`All reminders for ${patient.name}`}>
        {mine.length === 0 ? <Empty>No reminders yet.</Empty> : (
          <ul className="divide-y divide-slate-100">{mine.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <div className="flex-1"><p className="font-semibold">{medName(r.medicineId)} {r.type === 'as-needed' ? <Badge>As needed</Badge> : <span className="font-normal text-slate-500">at {r.time}</span>}</p>
                <p className="text-xs text-slate-500">{r.type === 'fixed' ? `${r.days.length === 7 ? 'Every day' : r.days.map((d) => DAY[d]).join(', ')}. ${r.units} per dose. ` : ''}{r.dose}</p></div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><input type="checkbox" checked={r.active !== false} onChange={() => saveReminder({ ...r, active: r.active === false })} />Active</label>
              <button aria-label="Edit reminder" onClick={() => setModal(r)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>
              <button aria-label="Delete reminder" onClick={async () => (await confirm({ title: 'Delete this reminder?', body: 'Past dose records are kept.', confirmLabel: 'Delete reminder' })) && deleteReminder(r.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
            </li>))}</ul>)}
      </Card>
      {modal && <Form initial={modal.id ? modal : undefined} onClose={() => setModal(null)} />}
    </div>
  );
}

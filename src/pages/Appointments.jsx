import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Modal, Field, Needs, PageBanner, inputCls } from '../components/ui';
import { todayKey } from '../utils/dates';
import { byDT } from '../utils/family';
import { longDate } from '../utils/medicine';
import { useConfirm } from '../components/Feedback';

function Form({ initial, onClose }) {
  const { patients, patient, saveAppointment, role } = useApp();
  const [f, setF] = useState({ patientId: patient.id, doctor: '', specialty: '', date: '', time: '', notes: '', ...initial });
  const ok = f.doctor.trim() && f.date && f.time;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={initial?.id ? 'Edit appointment' : 'Add appointment'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (ok) { saveAppointment({ ...f, doctor: f.doctor.trim() }); onClose(); } }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Family member" className="sm:col-span-2"><select className={inputCls} value={f.patientId} onChange={set('patientId')} disabled={role === 'patient'}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Doctor *"><input className={inputCls} value={f.doctor} onChange={set('doctor')} /></Field>
        <Field label="Specialty"><input className={inputCls} value={f.specialty} onChange={set('specialty')} /></Field>
        <Field label="Date *"><input type="date" className={inputCls} value={f.date} onChange={set('date')} /></Field>
        <Field label="Time *"><input type="time" className={inputCls} value={f.time} onChange={set('time')} /></Field>
        <Field label="Notes" className="sm:col-span-2"><input className={inputCls} value={f.notes} onChange={set('notes')} /></Field>
        <Needs className="sm:col-span-2" list={[[f.doctor.trim(), 'the doctor'], [f.date, 'a date'], [f.time, 'a time']]} />
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button disabled={!ok} className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">Save appointment</button></div>
      </form>
    </Modal>
  );
}

export default function Appointments() {
  const { appointments, patients, patient, role, deleteAppointment } = useApp();
  const confirm = useConfirm();
  const [month, setMonth] = useState(todayKey().slice(0, 7)); const [sel, setSel] = useState(todayKey());
  const [who, setWho] = useState('all'); const [modal, setModal] = useState(null);
  const filter = role === 'patient' ? patient.id : who;
  const list = appointments.filter((a) => filter === 'all' || a.patientId === filter).sort(byDT);
  const [y, m] = month.split('-').map(Number);
  const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  const shift = (n) => setMonth(new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7));
  const name = (id) => patients.find((p) => p.id === id)?.name;
  const Item = ({ a }) => (
    <li className="flex items-start gap-3 py-3 text-sm">
      <div className="flex-1"><p className="font-bold">{a.doctor} {a.specialty && <span className="font-normal text-slate-500">({a.specialty})</span>}</p>
        <p className="text-xs text-slate-500">{longDate(a.date)}, {a.time}. <Badge>{name(a.patientId)}</Badge></p>{a.notes && <p className="mt-1 text-xs text-slate-500">{a.notes}</p>}</div>
      <button aria-label="Edit appointment" onClick={() => setModal(a)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>
      <button aria-label="Delete appointment" onClick={async () => (await confirm({ title: 'Delete this appointment?', confirmLabel: 'Delete appointment' })) && deleteAppointment(a.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
    </li>);
  const upcoming = list.filter((a) => a.date >= todayKey()).slice(0, 8);
  return (
    <div className="space-y-5">
      <PageBanner icon={CalendarDays} title="Appointments" subtitle="Only dates you enter appear here. MedGuard does not suggest follow-up dates."
        actions={<>
          {role === 'caregiver' && <select className={`${inputCls} !w-auto`} value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter by family member"><option value="all">Whole family</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
          <button onClick={() => setModal({ date: sel })} className="flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-extrabold text-navy-900 hover:bg-gold-300"><Plus size={16} aria-hidden="true" />Add appointment</button>
        </>} />
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <button aria-label="Previous month" onClick={() => shift(-1)} className="rounded-lg p-1.5 hover:bg-slate-100"><ChevronLeft size={18} /></button>
            <h2 className="font-bold">{new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h2>
            <button aria-label="Next month" onClick={() => shift(1)} className="rounded-lg p-1.5 hover:bg-slate-100"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((k, i) => { if (!k) return <div key={i} />; const n = list.filter((a) => a.date === k).length; return (
              <button key={k} onClick={() => setSel(k)} aria-label={`${k}, ${n} appointments`} aria-pressed={sel === k}
                className={`relative aspect-square rounded-xl text-sm font-semibold ${sel === k ? 'bg-navy-900 text-white' : k === todayKey() ? 'bg-gold-100 text-gold-700 ring-1 ring-gold-300' : 'hover:bg-mint-100'}`}>
                {+k.slice(8)}{n > 0 && <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold-500" />}</button>); })}
          </div>
        </Card>
        <div className="space-y-5 lg:col-span-2">
          <Card title={longDate(sel)}>{list.filter((a) => a.date === sel).length ? <ul className="divide-y divide-slate-100">{list.filter((a) => a.date === sel).map((a) => <Item key={a.id} a={a} />)}</ul> : <Empty>No appointments on this day.</Empty>}</Card>
          <Card tone="sage" title="Upcoming">{upcoming.length ? <ul className="divide-y divide-slate-100">{upcoming.map((a) => <Item key={a.id} a={a} />)}</ul> : <Empty>No upcoming appointments.</Empty>}</Card>
        </div>
      </div>
      {modal && <Form initial={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

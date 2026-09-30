import { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useApp } from '../context/AppContext';
import { Card, Empty, inputCls } from '../components/ui';
import { todayKey, addDays, fmtDate } from '../utils/dates';
import { dosesOn, logFor, STATUSES, summarize } from '../utils/schedule';

function Today() {
  const { patient, reminders, medicines, doseLogs, setDoseStatus } = useApp();
  const [date, setDate] = useState(todayKey());
  const future = date > todayKey();
  const doses = dosesOn(reminders.filter((r) => r.patientId === patient.id), date);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button aria-label="Previous day" onClick={() => setDate(addDays(date, -1))} className="rounded-lg bg-white p-2 shadow-card"><ChevronLeft size={16} /></button>
        <span className="min-w-32 text-center text-sm font-bold">{date === todayKey() ? 'Today' : fmtDate(date)}</span>
        <button aria-label="Next day" onClick={() => setDate(addDays(date, 1))} className="rounded-lg bg-white p-2 shadow-card"><ChevronRight size={16} /></button>
        {date !== todayKey() && <button onClick={() => setDate(todayKey())} className="text-xs font-bold text-teal-600">Back to today</button>}
      </div>
      {doses.length === 0 ? <Empty>No scheduled doses for {patient.name} on this day. Add reminders to build a schedule.</Empty> : (
        <div className="space-y-3">
          {doses.map((r) => { const l = logFor(doseLogs, r.id, date); const cur = l?.status || 'pending'; return (
            <Card key={r.id} className="!p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-sm font-bold"><span className="mr-2 text-teal-600 tabular-nums">{r.time}</span>{medicines.find((m) => m.id === r.medicineId)?.name}</p>
                  <p className="text-xs text-slate-500">{r.dose || `${r.units} per dose`} {l ? `. Recorded ${new Date(l.updatedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}` : '. Not yet recorded'}</p></div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Dose status">
                  {STATUSES.map(([k, label, cls]) => (
                    <button key={k} disabled={future} onClick={() => setDoseStatus(r.id, date, k)} aria-pressed={cur === k}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${cur === k ? cls : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>))}
                </div>
              </div>
            </Card>); })}
        </div>)}
      <p className="text-xs text-slate-500">Click another status to correct an entry. Not confirmed is not counted as missed.</p>
    </div>
  );
}

const SERIES = [['taken', 'Confirmed taken', '#16876B'], ['not_taken', 'Reported not taken', '#D97855'], ['skipped', 'Skipped', '#E8BD68'], ['unconfirmed', 'Unconfirmed', '#B9C6BD']];
function History() {
  const reduce = useReducedMotion();
  const { patient, reminders, doseLogs } = useApp();
  const [n, setN] = useState(7);
  const { rows, total } = summarize(reminders, doseLogs, patient.id, n);
  const data = rows.map((r) => ({ ...r, label: fmtDate(r.date) }));
  return (
    <div className="space-y-4">
      <div className="flex gap-2">{[[7, 'Weekly'], [30, 'Monthly']].map(([v, l]) => <button key={v} onClick={() => setN(v)} aria-pressed={n === v} className={`rounded-lg px-4 py-1.5 text-sm font-bold ${n === v ? 'bg-navy-900 text-white' : 'bg-white text-slate-700 shadow-card hover:bg-mint-100'}`}>{l}</button>)}</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{SERIES.map(([k, l, c]) => <div key={k} className="rounded-2xl bg-white p-4 shadow-card"><p className="text-xs text-slate-500"><i className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: c }} />{l}</p><p className="text-2xl font-extrabold tabular-nums">{total[k]}</p></div>)}</div>
      <Card title={`Last ${n} days, ${patient.name}`}>
        <div className="h-64"><ResponsiveContainer><BarChart data={data}><CartesianGrid vertical={false} stroke="#E6E1D0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={n > 7 ? 4 : 0} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={24} />
          <Tooltip cursor={{ fill: '#DCE9DF66' }} /><Legend wrapperStyle={{ fontSize: 12 }} />
          {SERIES.map(([k, l, c]) => <Bar key={k} dataKey={k} name={l} stackId="d" fill={c} isAnimationActive={!reduce} animationDuration={900} />)}</BarChart></ResponsiveContainer></div>
      </Card>
      <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle size={15} className="shrink-0" />These are user-reported entries. They do not prove that a medicine was taken or ingested. Unconfirmed doses are past doses with no confirmation and are not treated as missed.</p>
    </div>
  );
}

export default function Tracker() {
  const { patient, patients, setPatient } = useApp();
  const [tab, setTab] = useState('today');
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Daily Medication Tracker</h1><p className="text-sm text-slate-500">Record what actually happened for each scheduled dose.</p></div>
        <select className={`${inputCls} !w-auto`} value={patient.id} onChange={(e) => setPatient(e.target.value)} aria-label="Patient">{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div className="flex gap-2">{[['today', 'Doses'], ['history', 'Adherence history']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k} className={`rounded-lg px-4 py-1.5 text-sm font-bold ${tab === k ? 'bg-navy-900 text-white' : 'bg-white text-slate-700 shadow-card hover:bg-mint-100'}`}>{l}</button>)}</div>
      {tab === 'today' ? <Today /> : <History />}
    </div>
  );
}

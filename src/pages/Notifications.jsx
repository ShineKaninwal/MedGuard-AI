import { useState } from 'react';
import { BellRing, Siren, Clock, PackageMinus, Hourglass, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Notice, PageHeader, inputCls } from '../components/ui';
import { patientStats } from '../utils/family';
import { expiryStatus, longDate } from '../utils/medicine';
import { daysUntil, todayKey } from '../utils/dates';
import { typeLabel } from '../config/sos';

const LEVELS = { urgent: ['red', 'Urgent'], attention: ['amber', 'Needs attention'], info: ['slate', 'Coming up'] };
const ICON = { sos: Siren, dose: Clock, low: PackageMinus, expiry: Hourglass, appt: CalendarDays };

// A live list of things that need attention, worked out from the data saved in this browser. It is not a log of messages sent.
export default function Notifications() {
  const s = useApp();
  const { patients, patient, role, medicines, emergencyAlerts, setPatient, navigate } = s;
  const [member, setMember] = useState('all'); const [level, setLevel] = useState('all');
  const scope = role === 'patient' ? patient.id : member;
  const items = [];
  emergencyAlerts.filter((a) => a.active && (scope === 'all' || a.patientId === scope)).forEach((a) =>
    items.push({ id: a.id, level: 'urgent', kind: 'sos', pid: a.patientId, title: `SOS active: ${a.patientName}`, detail: `${typeLabel(a.type)}. Notifications to contacts are simulated.`, page: 'sos', cta: 'Open emergency screen' }));
  patients.filter((p) => scope === 'all' || p.id === scope).forEach((p) => {
    const st = patientStats(s, p.id); const first = p.name.split(' ')[0];
    st.pending.forEach((r) => items.push({ id: `d${r.id}`, level: 'attention', kind: 'dose', pid: p.id, title: `${first}: dose to confirm`, detail: `${medicines.find((m) => m.id === r.medicineId)?.name || 'Medicine'} at ${r.time}. Record whether it was taken.`, page: 'tracker', cta: 'Open tracker' }));
    st.low.forEach(({ m, est }) => items.push({ id: `l${m.id}`, level: 'attention', kind: 'low', pid: p.id, title: `${first}: ${m.name} is running low`, detail: `${m.qty} left${est.ok ? `, about ${est.days} days at the current schedule` : ''}.`, page: 'refill', cta: 'Open refill planner' }));
    st.expiring.forEach((m) => { const e = expiryStatus(m.expiry); items.push({ id: `e${m.id}`, level: e.key === 'expired' ? 'urgent' : 'attention', kind: 'expiry', pid: p.id, title: `${first}: ${m.name} ${e.key === 'expired' ? 'has expired' : 'expires soon'}`, detail: `${longDate(m.expiry)} (${e.days < 0 ? `${-e.days} days ago` : `in ${e.days} days`}).`, page: e.key === 'expired' ? 'disposal' : 'inventory', cta: e.key === 'expired' ? 'How to dispose' : 'Open inventory' }); });
    st.appts.filter((a) => daysUntil(a.date) <= 7).forEach((a) => items.push({ id: `a${a.id}`, level: 'info', kind: 'appt', pid: p.id, title: `${first}: appointment ${a.date === todayKey() ? 'today' : `in ${daysUntil(a.date)} days`}`, detail: `${a.doctor}, ${longDate(a.date)} at ${a.time}.`, page: 'appointments', cta: 'Open appointments' }));
  });
  const order = { urgent: 0, attention: 1, info: 2 };
  const shown = items.filter((i) => level === 'all' || i.level === level).sort((a, b) => order[a.level] - order[b.level]);
  const count = (l) => items.filter((i) => i.level === l).length;

  return (
    <div className="space-y-5">
      <PageHeader icon={BellRing} title="Notifications" subtitle="Everything that needs attention right now, across your family's medicines."
        actions={<label className="flex items-center gap-2 text-sm text-slate-500">Show
          <select value={scope} disabled={role === 'patient'} onChange={(e) => setMember(e.target.value)} className={`${inputCls} !w-auto font-semibold`}><option value="all">Whole family</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>} />
      <Notice tone="teal">This list is worked out live from your saved data. It is not a history of messages sent. Dose reminders as browser pop-ups are turned on in Reminders, and SOS alerts to contacts are simulated.</Notice>
      <div role="group" aria-label="Filter by importance" className="flex flex-wrap gap-1.5">
        {[['all', `All (${items.length})`], ['urgent', `Urgent (${count('urgent')})`], ['attention', `Needs attention (${count('attention')})`], ['info', `Coming up (${count('info')})`]].map(([k, l]) => (
          <button key={k} aria-pressed={level === k} onClick={() => setLevel(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${level === k ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}>{l}</button>))}
      </div>
      {shown.length === 0 ? <Empty icon={CheckCircle2}>{items.length ? 'Nothing in this category.' : 'You are all caught up. Nothing needs attention right now.'}</Empty> : (
        <ul className="space-y-2">
          {shown.map((i) => { const Icon = ICON[i.kind]; const [tone, lab] = LEVELS[i.level]; return (
            <li key={i.id}><Card className="!p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${i.level === 'urgent' ? 'bg-red-50 text-red-600' : i.level === 'attention' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}><Icon size={17} aria-hidden="true" /></span>
                <div className="min-w-0 flex-1"><p className="flex flex-wrap items-center gap-2 text-sm font-bold">{i.title}<Badge tone={tone}>{lab}</Badge></p><p className="text-sm text-slate-600">{i.detail}</p></div>
                <button onClick={() => { setPatient(i.pid); navigate(i.page); }} className="rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-navy-900 ring-1 ring-slate-200 hover:bg-slate-50">{i.cta}</button>
              </div></Card></li>); })}
        </ul>)}
    </div>
  );
}

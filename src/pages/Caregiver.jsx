import { AlertTriangle, ArrowRight, Siren, Users, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty } from '../components/ui';
import { patientStats } from '../utils/family';
import { expiryStatus, longDate } from '../utils/medicine';
import { typeLabel, SIMULATED_NOTICE } from '../config/sos';
import { fmtDateTime } from '../services/notifications';
import { telHref } from '../utils/phone';
import NotificationList, { StatusSummary } from '../components/sos/NotificationList';

export default function Caregiver() {
  const s = useApp();
  const { patients, role, setRole, setPatient, navigate } = s;
  if (role !== 'caregiver') return (
    <Card className="mx-auto mt-10 max-w-lg text-center"><Users className="mx-auto text-teal-600" />
      <h1 className="mt-3 text-xl font-extrabold">Caregiver view</h1>
      <p className="mt-1 text-sm text-slate-500">This page shows the whole family. You are in the simulated patient role. This is a demo switch, not real access control.</p>
      <button onClick={() => setRole('caregiver')} className="mt-4 rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white">Switch to caregiver view</button></Card>);
  const all = patients.map((p) => ({ p, st: patientStats(s, p.id) }));
  const flat = (f) => all.flatMap(({ p, st }) => f(st).map((x) => ({ p, x })));
  const open = (id, page) => { setPatient(id); navigate(page); };
  const pending = flat((st) => st.pending); const low = flat((st) => st.low); const exp = flat((st) => st.expiring);
  const appts = all.flatMap(({ p, st }) => st.appts.slice(0, 2).map((a) => ({ p, a }))).sort((a, b) => `${a.a.date}${a.a.time}`.localeCompare(`${b.a.date}${b.a.time}`)).slice(0, 6);
  const alerts = flat((st) => st.alerts);
  const List = ({ title, items, render, empty }) => <Card title={title} action={<Badge tone={items.length ? 'amber' : 'green'}>{items.length}</Badge>}>{items.length ? <ul className="space-y-2 text-sm">{items.map(render)}</ul> : <Empty>{empty}</Empty>}</Card>;
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-extrabold tracking-tight">Caregiver Dashboard</h1>
        <p className="text-sm text-slate-500">Everyone in the family, using the same medicine and reminder data as the rest of the app.</p></div>
      <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle size={15} className="shrink-0" />Prototype: the caregiver and patient views are a simulated role switch. There is no authentication or access control.</p>
      {alerts.length === 0 ? (
        <div className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-card">
          <span className="flex items-center gap-2"><Siren size={17} className="text-slate-500" />No active emergency alerts</span>
          <button onClick={() => navigate('sos')} className="text-xs font-bold text-red-600">Emergency SOS</button></div>
      ) : (
        <section aria-label="Active emergency alerts" className="space-y-3">
          {alerts.map(({ p, x: a }) => {
            const phone = p.phone || a.patientPhone;
            return (
              <div key={a.id} role="alert" className="rounded-2xl bg-red-50 p-4 ring-2 ring-red-500">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="flex items-center gap-2 text-lg font-extrabold text-red-800"><Siren size={20} className="animate-pulse" />SOS ACTIVE: {p.name}</p>
                    <p className="text-sm font-semibold text-red-900">{typeLabel(a.type)}. Alert time {fmtDateTime(a.createdAt)}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {phone ? <a href={telHref(phone)} className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-red-700"><Phone size={16} />Call {p.name.split(' ')[0]}</a>
                      : <span className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">No phone saved for {p.name.split(' ')[0]}</span>}
                    <button onClick={() => open(p.id, 'sos')} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-red-700 ring-1 ring-red-300 hover:bg-red-100">Open emergency screen</button></div>
                </div>
                <div className="mt-3 space-y-2"><StatusSummary notifications={a.notifications} /><NotificationList notifications={a.notifications} canRetry={false} compact /></div>
                <p className="mt-2 text-[11px] text-slate-600">{SIMULATED_NOTICE} This alert appears here only because the patient and caregiver views share this browser. If life is at risk, call 112. The Call button opens your dialer and cannot confirm a call connected.</p>
              </div>);
          })}
        </section>)}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {all.map(({ p, st }) => (
          <Card key={p.id}>
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-navy-900 font-extrabold text-white">{p.name[0]}</span>
              <div><p className="font-bold">{p.name}</p><p className="text-xs text-slate-500">{p.relation}, age {p.age}</p></div></div>
            <div className="mt-3 flex flex-wrap gap-1.5">{p.conditions.map((c) => <Badge key={c} tone="teal">{c}</Badge>)}</div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              {[['Doses today', `${st.taken}/${st.todays.length} taken`], ['To confirm', st.pending.length], ['Low stock', st.low.length], ['Expiry issues', st.expiring.length]].map(([k, v]) => <div key={k} className="rounded-xl bg-slate-50 p-2"><dd className="text-sm font-extrabold">{v}</dd><dt className="text-slate-500">{k}</dt></div>)}
            </dl>
            <p className="mt-3 text-xs text-slate-500">{st.appts[0] ? `Next appointment: ${longDate(st.appts[0].date)}, ${st.appts[0].doctor}` : 'No upcoming appointments'}</p>
            <button onClick={() => open(p.id, 'family')} className="mt-3 flex items-center gap-1.5 text-sm font-bold text-teal-600">Open overview <ArrowRight size={15} /></button>
          </Card>))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <List title="Pending dose confirmations" items={pending} empty="Nothing waiting for confirmation." render={({ p, x }) => <li key={x.id} className="flex justify-between gap-2"><span><b>{p.name.split(' ')[0]}</b>: {s.medicines.find((m) => m.id === x.medicineId)?.name} at {x.time}</span><button onClick={() => open(p.id, 'tracker')} className="text-xs font-bold text-teal-600">Confirm</button></li>} />
        <List title="Low-stock medicines" items={low} empty="No low-stock medicines." render={({ p, x }) => <li key={x.m.id}><b>{p.name.split(' ')[0]}</b>: {x.m.name}, {x.m.qty} left{x.est.ok ? ` (about ${x.est.days} days)` : ''}</li>} />
        <List title="Expiring or expired medicines" items={exp} empty="No expiry issues." render={({ p, x }) => <li key={x.id}><b>{p.name.split(' ')[0]}</b>: {x.name} <Badge tone={expiryStatus(x.expiry).tone}>{expiryStatus(x.expiry).label}</Badge> {longDate(x.expiry)}</li>} />
        <List title="Upcoming appointments" items={appts} empty="No upcoming appointments." render={({ p, a }) => <li key={a.id}><b>{p.name.split(' ')[0]}</b>: {a.doctor}, {longDate(a.date)} {a.time}</li>} />
      </div>
    </div>
  );
}

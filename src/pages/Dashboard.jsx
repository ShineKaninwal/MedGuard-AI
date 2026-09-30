import { useMemo } from 'react';
import { Pill, Hourglass, Copy, PackageMinus, ShieldCheck, Siren, Check, Sparkles, Leaf, FileText, Bot, CalendarDays, ChevronRight, Package, Activity as ActivityIcon } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useApp, analyze } from '../context/AppContext';
import { Card, Badge, Empty } from '../components/ui';
import { SosButton } from '../components/sos/SosUi';
import ExpiryRunway from '../components/ExpiryRunway';
import { EmergencyCalls } from '../components/sos/CallButtons';
import { HeroIllustration, PulseLine, MedPattern } from '../components/illustrations';
import { daysUntil, fmtDate, timeAgo, todayKey } from '../utils/dates';
import { dosesOn, statusOf, needsConfirm, estimateSupply, isLow, summarize as doseSummary } from '../utils/schedule';
import { expiryStatus, longDate } from '../utils/medicine';
import { summarize as wasteSummary, inr } from '../utils/waste';

// One statistic box. Each variant has its own treatment so the row is not four identical cards. All of them go somewhere, so all are buttons.
const TILE = {
  forest: { box: 'bg-navy-900 text-white ring-navy-700', icon: 'bg-gold-400 text-navy-900', hint: 'text-mint-100', track: 'bg-white/15', bar: 'bg-gold-400' },
  sage: { box: 'bg-mint-100 text-navy-900 ring-mint-200', icon: 'bg-white text-teal-700', hint: 'text-slate-600', track: 'bg-white/70', bar: 'bg-teal-600' },
  terracotta: { box: 'bg-amber-50 text-slate-900 ring-amber-200', icon: 'bg-amber-400 text-slate-900', hint: 'text-amber-800', track: 'bg-white/80', bar: 'bg-amber-500' },
  ivory: { box: 'bg-white text-slate-900 ring-slate-200', icon: 'bg-gold-100 text-gold-700', hint: 'text-slate-600', track: 'bg-slate-100', bar: 'bg-gold-500' },
};
function Tile({ variant, label, value, hint, icon: Icon, share, onClick }) {
  const t = TILE[variant];
  return (
    <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClick} className={`card-hover flex flex-col justify-between rounded-2xl p-4 text-left shadow-card ring-1 ${t.box}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold">{label}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${t.icon}`}><Icon size={18} aria-hidden="true" /></span>
      </div>
      <p className="mt-2 text-4xl font-extrabold tabular-nums leading-none">{value}</p>
      <p className={`mt-1 text-xs ${t.hint}`}>{hint}</p>
      <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${t.track}`} aria-hidden="true">
        <motion.div className={`h-full rounded-full ${t.bar}`} initial={{ width: 0 }} animate={{ width: `${Math.round(Math.max(0, Math.min(1, share)) * 100)}%` }} transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }} />
      </div>
    </motion.button>
  );
}

// Adherence ring. It shows confirmed-taken doses out of every scheduled dose in the window. Doses nobody confirmed count as unconfirmed, never as missed.
function AdherenceRing({ pct, label }) {
  const r = 46, c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-36 w-36" role="img" aria-label={label}>
      <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" className="stroke-mint-100" />
        <motion.circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" strokeLinecap="round" strokeDasharray={c} className="stroke-teal-600"
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-3xl font-extrabold tabular-nums text-navy-900">{Math.round(pct * 100)}%</p><p className="text-[11px] font-semibold text-slate-600">confirmed taken</p></div></div>
    </div>
  );
}

const QUICK = [['audit', 'Run AI Audit', ShieldCheck], ['prescriptions', 'Prescriptions', FileText], ['inventory', 'Medicine inventory', Package], ['assistant', 'Ask the Health Assistant', Bot], ['appointments', 'Appointments', CalendarDays]];

export default function Dashboard() {
  const { patient, patients, setPatient, medicines, reminders, appointments, activity, alerts, prescriptions, navigate, doseLogs, setDoseStatus, settings } = useApp();
  const reduce = useReducedMotion();

  const meds = medicines.filter((m) => m.patientId === patient.id);
  const found = analyze(medicines, patient.id, reminders, settings.refillDays);
  const count = (t) => found.filter((f) => f.type === t).length;
  const mineRem = reminders.filter((r) => r.patientId === patient.id);
  const todays = dosesOn(mineRem, todayKey());
  const pending = todays.filter((r) => needsConfirm(doseLogs, r, todayKey())).length;
  const supply = meds.map((m) => ({ m, est: estimateSupply(m, reminders) })).filter((x) => isLow(x.m, x.est, settings.refillDays)).sort((a, b) => (a.est.days ?? 999) - (b.est.days ?? 999));
  const done = todays.filter((r) => statusOf(doseLogs, r.id, todayKey()) === 'taken').length;
  const appts = appointments.filter((a) => a.patientId === patient.id && a.date >= todayKey()).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const myAlerts = alerts.filter((a) => a.patientId === patient.id);
  const medName = (id) => medicines.find((m) => m.id === id)?.name;
  const ws = useMemo(() => wasteSummary(meds, reminders, settings.refillDays), [meds, reminders, settings.refillDays]);
  const hour = new Date().getHours();
  const first = patient.name.split(' ')[0];

  const week = useMemo(() => doseSummary(reminders, doseLogs, patient.id, 7), [reminders, doseLogs, patient.id]);
  const weekTotal = week.total.taken + week.total.not_taken + week.total.skipped + week.total.unconfirmed;
  const pct = weekTotal ? week.total.taken / weekTotal : 0;
  const weekData = week.rows.map((r) => ({ ...r, label: fmtDate(r.date) }));
  const weekSummary = weekTotal ? `${week.total.taken} of ${weekTotal} scheduled doses confirmed taken in the last 7 days. ${week.total.not_taken} reported not taken, ${week.total.skipped} skipped, ${week.total.unconfirmed} unconfirmed.` : 'No scheduled doses in the last 7 days.';

  const rxs = prescriptions.filter((p) => p.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const invPreview = [...meds].sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999')).slice(0, 4);
  const total = Math.max(meds.length, 1);
  const expiring = count('expiring') + count('expired');

  return (
    <div className="space-y-5">
      {/* Welcome section */}
      <section aria-label="Welcome" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-5 text-white shadow-lift sm:p-7">
        <MedPattern className="pointer-events-none absolute -left-6 bottom-0 h-32 w-56 text-mint-200/10" />
        <div className="relative grid items-center gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <h1 className="!text-white text-2xl font-semibold sm:text-3xl">Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, welcome back</h1>
            <p className="mt-1 text-sm text-mint-100">Here is the medicine overview for {first} today.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-mint-100">
              <label className="flex items-center gap-2 rounded-2xl bg-white/10 py-1.5 pl-3 pr-1.5 ring-1 ring-white/20">Family member
                <select value={patient.id} onChange={(e) => setPatient(e.target.value)} aria-label="Family member" className="rounded-xl border-0 bg-ivory-100 px-2.5 py-1 text-sm font-bold text-navy-900">
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></label>
              {patient.conditions.map((c) => <span key={c} className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/20">{c}</span>)}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => navigate('audit')} className="flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-extrabold text-navy-900 shadow-card transition hover:bg-gold-300">
                <ShieldCheck size={17} aria-hidden="true" /> Run AI Audit
              </button>
              <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold ring-1 ring-white/20" role="status">
                <ActivityIcon size={15} className="text-gold-400" aria-hidden="true" />
                {myAlerts.length ? `${myAlerts.length} audit finding${myAlerts.length > 1 ? 's' : ''} to review` : 'No open audit findings'}
              </span>
            </div>
          </div>
          <HeroIllustration className="mx-auto hidden h-44 w-auto md:block lg:h-52" />
        </div>
      </section>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile variant="forest" label="Total medicines" value={meds.length} hint={`for ${first}`} icon={Pill} share={meds.length ? (meds.length - count('expired')) / total : 0} onClick={() => navigate('inventory')} />
        <Tile variant="terracotta" label="Near or past expiry" value={expiring} hint="within 60 days" icon={Hourglass} share={expiring / total} onClick={() => navigate('inventory')} />
        <Tile variant="sage" label="Possible duplicates" value={count('duplicate')} hint="same ingredient, for review" icon={Copy} share={count('duplicate') / total} onClick={() => navigate('audit')} />
        <Tile variant="ivory" label="Low stock" value={count('low')} hint="below minimum or running out" icon={PackageMinus} share={count('low') / total} onClick={() => navigate('refill')} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {/* Adherence + quick actions */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <Card title="Dose adherence, last 7 days" action={<button type="button" onClick={() => navigate('tracker')} className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline">Open tracker <ChevronRight size={14} aria-hidden="true" /></button>}>
              <div className="grid items-center gap-4 sm:grid-cols-[150px_1fr]">
                <AdherenceRing pct={pct} label={weekSummary} />
                <div role="img" aria-label={weekSummary} className="h-40">
                  <ResponsiveContainer>
                    <BarChart data={weekData} margin={{ left: -24, right: 4, top: 4 }}>
                      <CartesianGrid vertical={false} stroke="#E6E1D0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={0} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={32} />
                      <Tooltip cursor={{ fill: '#DCE9DF55' }} contentStyle={{ borderRadius: 12, border: '1px solid #DEDACD', fontSize: 12 }} />
                      <Bar dataKey="taken" name="Confirmed taken" stackId="d" fill="#16876B" isAnimationActive={!reduce} animationDuration={900} />
                      <Bar dataKey="not_taken" name="Reported not taken" stackId="d" fill="#D97855" isAnimationActive={!reduce} animationDuration={900} />
                      <Bar dataKey="skipped" name="Skipped" stackId="d" fill="#E8BD68" isAnimationActive={!reduce} animationDuration={900} />
                      <Bar dataKey="unconfirmed" name="Unconfirmed" stackId="d" fill="#B9C6BD" radius={[5, 5, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                {[['bg-teal-600', 'Confirmed taken'], ['bg-amber-400', 'Reported not taken'], ['bg-gold-400', 'Skipped'], ['bg-mint-300', 'Unconfirmed']].map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-sm ${c}`} />{l}</span>)}
              </p>
              <p className="mt-1 text-[11px] text-slate-600">User-reported entries. Unconfirmed doses are not treated as missed.</p>
            </Card>

            <Card tone="forest" title="Quick actions" hover={false}>
              <ul className="space-y-2">
                {QUICK.map(([id, label, Icon]) => (
                  <li key={id}><button type="button" onClick={() => navigate(id)} className="flex w-full items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-left text-sm font-bold ring-1 ring-white/15 transition hover:bg-white/20">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-400 text-navy-900"><Icon size={16} aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">{label}</span><ChevronRight size={16} className="text-mint-200" aria-hidden="true" /></button></li>))}
              </ul>
            </Card>
          </div>

          {/* Audit findings */}
          <Card tone="sage" title="Audit findings" action={<Badge tone={myAlerts.length ? 'amber' : 'slate'}>{myAlerts.length} open</Badge>}>
            {myAlerts.length === 0 ? <Empty>No audit results yet. Select Run AI Audit to check {first}'s medicines.</Empty> : (
              <ul className="space-y-2">
                <AnimatePresence>
                  {myAlerts.map((a) => (
                    <motion.li key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex items-start gap-3 rounded-xl p-3 text-sm ${a.level === 'danger' ? 'bg-coral-50 text-coral-800 ring-1 ring-coral-200' : 'bg-white text-amber-900 ring-1 ring-amber-200'}`}>
                      <Sparkles size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {a.text}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </Card>

          {/* Inventory, prescriptions, activity */}
          <div className="grid gap-5 lg:grid-cols-3">
            <Card title="Medicine inventory" action={<button type="button" onClick={() => navigate('inventory')} className="text-xs font-bold text-teal-700 hover:underline">View all</button>} className="lg:col-span-1">
              {invPreview.length === 0 ? <Empty>No medicines yet.</Empty> : (
                <ul className="space-y-3">
                  {invPreview.map((m) => { const st = expiryStatus(m.expiry); return (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{m.name}</p><p className="text-xs text-slate-600">Qty {m.qty}{m.expiry ? `, ${longDate(m.expiry)}` : ''}</p></div>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </li>); })}
                </ul>)}
            </Card>
            <Card tone="ivory" title="Recent prescriptions" action={<button type="button" onClick={() => navigate('prescriptions')} className="text-xs font-bold text-teal-700 hover:underline">View all</button>}>
              {rxs.length === 0 ? <Empty>No prescriptions saved.</Empty> : (
                <ul className="space-y-3">
                  {rxs.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700"><FileText size={17} aria-hidden="true" /></span>
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.doctor || 'Unknown doctor'}</p><p className="text-xs text-slate-600">{longDate(p.date)}, {(p.items || []).length} item{(p.items || []).length === 1 ? '' : 's'}</p></div>
                    </li>))}
                </ul>)}
            </Card>
            <Card title="Recent agent activity" action={<button type="button" onClick={() => navigate('agents')} className="text-xs font-bold text-teal-700 hover:underline">View all</button>}>
              <ul className="space-y-3">
                {activity.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" aria-hidden="true" />
                    <div>
                      <p className="text-sm"><span className="font-semibold">{a.agent}:</span> {a.text}</p>
                      <p className="text-xs text-slate-600">{timeAgo(a.ts)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card title="Expiry runway" action={<span className="text-xs text-slate-600">recorded dates, next 12 months</span>}>
            {meds.length === 0 ? <Empty>No medicines yet.</Empty> : <ExpiryRunway meds={meds} />}
          </Card>

          <Card tone="gold" title={`Waste outlook for ${first}`} action={<button type="button" onClick={() => navigate('waste')} className="text-xs font-bold text-teal-800 underline">Open Waste Analytics</button>}>
            <dl className="grid grid-cols-3 gap-3 text-center">
              {[['Expired', ws.expired.length, ws.expired.length ? 'text-coral-700' : ''], ['Expiring in 60 days', ws.near.length, ws.near.length ? 'text-amber-800' : ''], ['Potential waste', inr(ws.potentialValue), '']].map(([k, v, c]) => (
                <div key={k} className="rounded-xl bg-white/80 p-3"><dd className={`text-2xl font-extrabold tabular-nums ${c}`}>{v}</dd><dt className="mt-0.5 text-xs text-slate-600">{k}</dt></div>))}
            </dl>
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-700"><Leaf size={14} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />Worked out from this inventory and the stock values you entered. It is not a record of past waste, and no environmental impact is calculated.</p>
          </Card>
        </div>

        {/* Right rail */}
        <aside aria-label="Emergency, reminders and appointments" className="space-y-5">
          <section aria-label="Emergency SOS" className="relative overflow-hidden rounded-3xl bg-coral-700 p-5 text-white shadow-lift ring-4 ring-coral-200">
            <Siren size={120} className="pointer-events-none absolute -right-6 -top-6 text-white/10" aria-hidden="true" />
            <p className="relative flex items-center gap-2 text-lg font-extrabold"><Siren size={20} aria-hidden="true" />Emergency SOS</p>
            <p className="relative mt-1 text-sm text-coral-50">Pick the emergency type and alert your contacts. Nothing is sent until you confirm. Alerts to contacts are simulated in this prototype.</p>
            <div className="relative mt-4"><SosButton size="lg" className="w-full !bg-white !text-coral-700 !ring-coral-200/60 hover:!bg-coral-50" /></div>
            <div className="relative mt-3"><EmergencyCalls size="md" /></div>
            <button type="button" onClick={() => navigate('contacts')} className="relative mt-3 text-xs font-bold text-white underline">Manage emergency contacts</button>
          </section>

          <Card title="Today's reminders" action={<Badge tone={done === todays.length && todays.length ? 'teal' : 'slate'}>{done} of {todays.length} taken{pending ? `, ${pending} to confirm` : ''}</Badge>}>
            {todays.length === 0 ? <Empty>No reminders for {patient.name}.</Empty> : (
              <ul className="divide-y divide-slate-100">
                {todays.map((r) => {
                  const taken = statusOf(doseLogs, r.id, todayKey()) === 'taken';
                  return (
                    <li key={r.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-12 text-sm font-bold tabular-nums text-teal-700">{r.time}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${taken ? 'text-slate-500 line-through' : ''}`}>{medName(r.medicineId)}</p>
                        <p className="truncate text-xs text-slate-600">{r.dose}</p>
                      </div>
                      <button onClick={() => setDoseStatus(r.id, todayKey(), taken ? 'not_confirmed' : 'taken')} aria-pressed={taken}
                        className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${taken ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-mint-100 hover:text-teal-800'}`}>
                        <Check size={14} aria-hidden="true" /> {taken ? 'Taken' : 'Mark taken'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card tone="ivory" title="Upcoming appointments" action={<button type="button" onClick={() => navigate('appointments')} className="text-xs font-bold text-teal-700 hover:underline">View all</button>}>
            {appts.length === 0 ? <Empty>No upcoming appointments. Add one in Appointments.</Empty> : (
              <ul className="space-y-3">
                {appts.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy-900 text-white">
                      <span className="text-sm font-extrabold leading-none">{fmtDate(a.date).split(' ')[0]}</span>
                      <span className="text-[10px] leading-none text-gold-300">{fmtDate(a.date).split(' ')[1]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{a.doctor}</p>
                      <p className="text-xs text-slate-600">{a.specialty}, {a.time} (in {daysUntil(a.date)} days)</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card tone="sage" title="Low stock and refills" action={<button onClick={() => navigate('refill')} className="text-xs font-bold text-teal-800 hover:underline">Open planner</button>}>
            {supply.length === 0 ? <Empty>No low-stock medicines.</Empty> : (
              <ul className="space-y-2 text-sm">{supply.map(({ m, est }) => (
                <li key={m.id} className="flex items-center justify-between gap-2"><span className="min-w-0 truncate font-semibold">{m.name}</span>
                  <Badge tone="amber">{m.qty} left{est.ok ? `, about ${est.days} days` : ''}</Badge></li>))}</ul>)}
          </Card>

          <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200/70">
            <p className="text-sm font-bold text-navy-900">Your data stays on this device</p>
            <p className="mt-1 text-xs text-slate-600">Everything is stored in this browser only. Sample people and numbers are fictional.</p>
            <PulseLine className="mt-2 h-8 w-full" loop />
          </div>
        </aside>
      </div>
    </div>
  );
}

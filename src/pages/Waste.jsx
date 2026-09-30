import { useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Pill, Hourglass, Timer, Trash2, BarChart3, ChevronDown, Leaf } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useApp } from '../context/AppContext';
import { Card, Badge, StatCard, Empty, Notice, PageHeader, inputCls } from '../components/ui';
import { summarize, monthlyExpiry, bucketCounts, byMember, disposalStats, inr, NEAR_DAYS, HORIZON_DAYS } from '../utils/waste';
import { longDate } from '../utils/medicine';

const COLOR = { expired: '#B25234', near: '#E8BD68', ok: '#16876B', later: '#B9C6BD' };
const stateBadge = { expired: ['red', 'Expired'], near: ['amber', 'Expiring soon'], ok: ['green', 'Valid'], unknown: ['slate', 'No expiry date'] };

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="max-w-56 rounded-xl bg-white p-3 text-xs shadow-xl ring-1 ring-slate-200">
      <p className="font-bold">{d.expired ? 'Already expired' : d.label}</p>
      <p className="text-slate-600">{d.count} medicine{d.count === 1 ? '' : 's'}{d.value ? `, ${inr(d.value)} recorded value` : ''}</p>
      {d.names.length > 0 && <p className="mt-1 text-slate-500">{d.names.join(', ')}</p>}
    </div>
  );
}

export default function Waste() {
  const reduce = useReducedMotion();
  const { medicines, reminders, patients, patient, settings, disposals, role, navigate } = useApp();
  const [member, setMember] = useState('all');
  const scope = role === 'patient' ? patient.id : member;
  const meds = useMemo(() => medicines.filter((m) => scope === 'all' || m.patientId === scope), [medicines, scope]);
  const sm = useMemo(() => summarize(meds, reminders, settings.refillDays), [meds, reminders, settings.refillDays]);
  const trend = useMemo(() => monthlyExpiry(sm.rows, 12), [sm]);
  const buckets = useMemo(() => bucketCounts(sm.rows), [sm]);
  const members = useMemo(() => byMember(sm.rows, patients), [sm, patients]);
  const mineDisposals = disposals.filter((d) => scope === 'all' || d.patientId === scope);
  const ds = disposalStats(mineDisposals);
  const nameOf = (id) => patients.find((p) => p.id === id)?.name.split(' ')[0] || 'Unknown';
  const attention = sm.rows.filter((r) => r.state === 'expired' || r.state === 'near' || r.counted).sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.rows.length));
  const scopeName = scope === 'all' ? 'the whole family' : nameOf(scope);

  return (
    <div className="space-y-5">
      <PageHeader icon={BarChart3} title="Waste Analytics"
        subtitle={`What is expiring or likely to be left over, for ${scopeName}. Built from the medicines saved in this browser.`}
        actions={<label className="flex items-center gap-2 text-sm text-slate-500">Show
          <select value={scope} disabled={role === 'patient'} onChange={(e) => setMember(e.target.value)} className={`${inputCls} !w-auto font-semibold`}>
            <option value="all">Whole family</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>} />

      <Notice tone="teal" icon={Leaf}>These figures come from the inventory, reminders and values you have entered (sample data until you change it). MedGuard does not know what is really left in a box. It does not calculate any environmental impact, because that would need verified data this prototype does not have.</Notice>

      {meds.length === 0 ? (
        <Empty icon={Pill} action={<button onClick={() => navigate('inventory')} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700">Go to Medicine Inventory</button>}>
          There are no medicines to analyse for {scopeName}. Add medicines in your inventory and this page will fill in.</Empty>
      ) : (<>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total inventory" value={sm.count} hint={`medicines, ${inr(sm.stockValue)} recorded value${sm.unpriced ? ` (${sm.unpriced} without a value)` : ''}`} icon={Pill} tone="navy" />
          <StatCard label="Expired" value={sm.expired.length} hint={sm.expired.length ? `${inr(sm.expiredValue)} recorded value` : 'nothing past expiry'} icon={Hourglass} tone={sm.expired.length ? 'red' : 'green'} />
          <StatCard label="Nearing expiry" value={sm.near.length} hint={`within ${NEAR_DAYS} days${sm.near.length ? `, ${inr(sm.nearValue)} recorded value` : ''}`} icon={Timer} tone={sm.near.length ? 'amber' : 'green'} />
          <StatCard label="Potential waste" value={inr(sm.potentialValue)} hint="expired stock plus projected leftover" icon={Trash2} tone={sm.potentialValue ? 'amber' : 'green'} />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card title="Expiry trend: next 12 months" className="lg:col-span-2"
            action={<Badge>Forecast from today's inventory</Badge>}>
            <div role="img" aria-label={`Bar chart of how many medicines reach their expiry date each month. ${trend.filter((t) => t.count).map((t) => `${t.label}: ${t.count}`).join('. ') || 'No medicines have expiry dates.'}`} className="h-60">
              <ResponsiveContainer>
                <BarChart data={trend} margin={{ left: -18, right: 4 }}>
                  <CartesianGrid vertical={false} stroke="#E6E1D0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-35} textAnchor="end" height={48} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={36} />
                  <Tooltip content={<TrendTooltip />} cursor={{ fill: '#DCE9DF66' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={!reduce} animationDuration={900}>{trend.map((d) => <Cell key={d.key} fill={d.expired ? COLOR.expired : d.near ? COLOR.near : d.key === 'later' ? COLOR.later : COLOR.ok} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {[['bg-amber-600', 'Already expired'], ['bg-gold-400', 'Month with medicine expiring within 60 days'], ['bg-teal-500', 'Later expiry']].map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-sm ${c}`} />{l}</span>)}
            </p>
            <p className="mt-2 text-xs text-slate-500">This shows when medicines you have now will expire. It is not a history of past waste, which MedGuard does not record.</p>
            <details className="group mt-3 rounded-xl ring-1 ring-slate-100">
              <summary className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-600">View chart data as a table<ChevronDown size={14} className="transition group-open:rotate-180" /></summary>
              <div className="overflow-x-auto border-t border-slate-100 px-3 py-2">
                <table className="w-full min-w-[420px] text-left text-xs"><caption className="sr-only">Medicines reaching expiry by month</caption>
                  <thead className="text-slate-500"><tr><th scope="col" className="py-1 pr-3">Period</th><th scope="col" className="py-1 pr-3">Medicines</th><th scope="col" className="py-1">Which</th></tr></thead>
                  <tbody>{trend.filter((t) => t.count).map((t) => <tr key={t.key} className="border-t border-slate-100"><th scope="row" className="py-1.5 pr-3 font-semibold">{t.label}</th><td className="pr-3 tabular-nums">{t.count}</td><td className="text-slate-600">{t.names.join(', ')}</td></tr>)}</tbody></table>
              </div>
            </details>
          </Card>

          <Card title="Time to expiry">
            <ul className="space-y-2.5 text-sm">
              {buckets.map((b) => (
                <li key={b.id}>
                  <div className="mb-1 flex items-center justify-between text-xs"><span className="font-semibold">{b.label}</span><span className="tabular-nums text-slate-500">{b.rows.length}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className={`h-full rounded-full ${b.tone} transition-all duration-500`} style={{ width: `${(b.rows.length / maxBucket) * 100}%` }} /></div>
                </li>))}
            </ul>
            {sm.rows.some((r) => r.state === 'unknown') && <p className="mt-3 text-xs text-slate-500">{sm.rows.filter((r) => r.state === 'unknown').length} medicine(s) have no expiry date and are not shown here.</p>}
          </Card>
        </div>

        <Card title="How the potential waste figure is made up">
          <ul className="divide-y divide-slate-100 text-sm">
            <li className="flex flex-wrap items-start justify-between gap-2 py-3">
              <div><p className="font-semibold">Expired stock</p><p className="text-xs text-slate-600">{sm.expired.length} medicine{sm.expired.length === 1 ? '' : 's'} already past the recorded expiry date. Counted in full.</p></div>
              <p className="text-lg font-extrabold tabular-nums">{inr(sm.expiredValue)}</p>
            </li>
            <li className="flex flex-wrap items-start justify-between gap-2 py-3">
              <div><p className="font-semibold">Projected leftover at expiry (fixed schedules only)</p>
                <p className="text-xs text-slate-600">{sm.projected.length ? `${sm.projected.map((r) => r.m.name).join(', ')}.` : 'No medicine with a fixed schedule is expected to have stock left over before it expires.'} Only medicines expiring within {HORIZON_DAYS} days are counted, because schedules change.</p></div>
              <p className="text-lg font-extrabold tabular-nums">{inr(sm.projectedValue)}</p>
            </li>
            <li className="flex flex-wrap items-start justify-between gap-2 py-3">
              <div><p className="font-semibold">Not estimable: nearing expiry, no fixed schedule</p>
                <p className="text-xs text-slate-600">{sm.unknownNear.length ? `${sm.unknownNear.map((r) => r.m.name).join(', ')}. ` : 'None. '}MedGuard cannot tell how much of these will be used, so they are not included in the total. If none were used, this is the most that could be left.</p></div>
              <p className="text-right"><span className="block text-lg font-extrabold tabular-nums text-slate-600">up to {inr(sm.unknownNearValue)}</span><span className="text-xs text-slate-600">not in the total</span></p>
            </li>
          </ul>
          {sm.unpricedAtRisk > 0 && <Notice tone="amber" className="mt-2">{sm.unpricedAtRisk} at-risk medicine{sm.unpricedAtRisk === 1 ? ' has' : 's have'} no stock value recorded, so {sm.unpricedAtRisk === 1 ? 'it is' : 'they are'} left out of the ₹ figures. Add a value when you edit the medicine.</Notice>}
          <details className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <summary className="font-bold">How this is calculated</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>A medicine is <b>expired</b> if its expiry date is before today, and <b>nearing expiry</b> if it expires within {NEAR_DAYS} days.</li>
              <li><b>Value</b> is the "value of stock on hand" you enter for each medicine. For a partial amount, value is scaled by units (value ÷ quantity × units).</li>
              <li><b>Projected leftover</b> = quantity now − (units used per day from your Reminders schedule × days until expiry), never below zero. It assumes doses are taken exactly as scheduled and no refill is added.</li>
              <li>As-needed medicines and medicines with no fixed schedule get no projection. Units are never added across different medicines.</li>
            </ul>
          </details>
        </Card>

        <Card title="Medicines that need attention" action={<Badge tone={attention.length ? 'amber' : 'green'}>{attention.length}</Badge>}>
          {attention.length === 0 ? <Empty>Nothing is expired, nearing expiry, or projected to be left over. Nice and tidy.</Empty> : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="sr-only">Medicines that are expired, nearing expiry, or projected to be left over</caption>
                <thead className="text-xs text-slate-500"><tr>{['Medicine', 'Expiry', 'In stock', 'Projected leftover at expiry', 'Recorded value at risk', 'Action'].map((h, i) => <th key={i} scope="col" className={`px-2 py-2 font-semibold ${h === 'Action' ? 'sr-only' : ''}`}>{h}</th>)}</tr></thead>
                <tbody>
                  {attention.map((r) => { const [tone, lab] = stateBadge[r.state]; return (
                    <tr key={r.m.id} className="border-t border-slate-100 align-top">
                      <th scope="row" className="px-2 py-3 font-semibold">{r.m.name}<span className="block text-xs font-normal text-slate-500">{nameOf(r.m.patientId)}</span></th>
                      <td className="px-2 py-3"><Badge tone={tone}>{lab}</Badge><span className="mt-0.5 block text-xs text-slate-500">{longDate(r.m.expiry)} ({r.days < 0 ? `${-r.days} days ago` : `in ${r.days} days`})</span></td>
                      <td className="px-2 py-3 tabular-nums">{r.m.qty} <span className="text-xs text-slate-500">{r.m.form}</span></td>
                      <td className="px-2 py-3">{r.state === 'expired' ? <span>All {r.m.qty}</span> : r.est.ok ? <span>{r.leftover} <span className="text-xs text-slate-500">at current schedule</span></span> : <span className="text-xs text-slate-500">Not estimable: {r.est.reason.toLowerCase()}</span>}</td>
                      <td className="px-2 py-3 tabular-nums">{r.leftoverValue != null ? inr(r.leftoverValue) : <span className="text-xs text-slate-500">{r.est.ok || r.state === 'expired' ? 'No value recorded' : 'Not estimable'}</span>}</td>
                      <td className="px-2 py-3 text-right">{r.state === 'expired' && <a href="#/disposal" className="whitespace-nowrap text-xs font-bold text-teal-600 underline">How to dispose</a>}</td>
                    </tr>); })}
                </tbody>
              </table>
            </div>)}
          <p className="mt-3 text-xs text-slate-500">Do not stop or change any medicine because of a figure here. If a medicine you rely on has expired, contact your pharmacist or doctor for a replacement.</p>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="By family member">
            {members.length === 0 ? <Empty>No data.</Empty> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[380px] text-left text-sm">
                <caption className="sr-only">Expiry status by family member</caption>
                <thead className="text-xs text-slate-500"><tr>{['Member', 'Medicines', 'Expired', 'Nearing', 'Value at risk'].map((h) => <th key={h} scope="col" className="py-2 pr-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody>{members.map(({ patient: p, total, expired, near, atRiskValue }) => <tr key={p.id} className="border-t border-slate-100">
                  <th scope="row" className="py-2.5 pr-3 font-semibold">{p.name.split(' ')[0]}</th><td className="pr-3 tabular-nums">{total}</td><td className="pr-3 tabular-nums">{expired}</td><td className="pr-3 tabular-nums">{near}</td><td className="tabular-nums">{inr(atRiskValue)}</td></tr>)}</tbody></table></div>)}
          </Card>

          <Card title="Disposals you have recorded" action={<Badge tone={ds.count ? 'teal' : 'slate'}>{ds.count}</Badge>}>
            {mineDisposals.length === 0 ? (
              <Empty>No disposals recorded yet. After you dispose of an expired medicine safely, mark it in the <a href="#/disposal" className="font-bold text-teal-600 underline">Disposal Guide</a> and it will be counted here.</Empty>
            ) : (<>
              <p className="mb-2 text-sm text-slate-600">{ds.count} recorded, about {inr(ds.value)} recorded value. These are records you entered, not verified disposals.</p>
              <ul className="divide-y divide-slate-100 text-sm">{mineDisposals.slice(0, 5).map((d) => <li key={d.id} className="flex items-center justify-between gap-2 py-2"><span><b>{d.name}</b> <span className="text-xs text-slate-500">{nameOf(d.patientId)}, {d.reason === 'expired' ? 'expired' : 'unused'}</span></span><span className="text-xs text-slate-500">{longDate(d.date)}</span></li>)}</ul>
            </>)}
          </Card>
        </div>

        <Card title="Habits that can reduce medicine waste">
          <ul className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
            {['Record expiry dates when you bring medicines home, and run the AI Medicine Audit now and then.',
              'At refill time, check what you already have. The Supply and Refill Planner shows how long current stock should last.',
              'Ask your pharmacist about pack sizes and quantities that suit your prescription.',
              'Keep medicines in their original packaging and store them as the label says.'].map((t) => <li key={t} className="flex gap-2 rounded-xl bg-slate-50 p-3"><Leaf size={15} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />{t}</li>)}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Never skip, stop or stretch a prescribed medicine to avoid waste. Talk to your prescriber first.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="#/disposal" className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800">Safe disposal guide</a>
            <a href="#/whatif" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-navy-900 ring-1 ring-slate-200 hover:bg-slate-50">Try the What-If Simulator</a>
          </div>
        </Card>
      </>)}
    </div>
  );
}

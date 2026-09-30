import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, inputCls } from '../components/ui';
import { estimateSupply, isLow } from '../utils/schedule';
import { longDate } from '../utils/medicine';

function Row({ m, est, low }) {
  const { recordRefill, setQuantity, setMinQty } = useApp();
  const [n, setN] = useState('');
  const num = Number(n); const valid = n !== '' && num >= 0;
  return (
    <tr className="border-t border-slate-100 align-top text-sm">
      <td className="px-3 py-3"><p className="font-semibold">{m.name}</p><p className="text-xs text-slate-500">{m.lastRefill ? `Last refill ${longDate(m.lastRefill.date)} (+${m.lastRefill.qty})` : 'No refill recorded'}</p></td>
      <td className="px-3 py-3 font-bold tabular-nums">{m.qty}</td>
      <td className="px-3 py-3">{est.ok ? <><b>About {est.days} days</b><p className="text-xs text-slate-500">Runs out about {longDate(est.date)}</p></> : <span className="text-xs text-slate-500">No estimate: {est.reason}</span>}
        {low && <div className="mt-1"><Badge tone="amber">Low stock</Badge></div>}</td>
      <td className="px-3 py-3"><input type="number" min="0" aria-label={`Refill threshold for ${m.name}`} className={`${inputCls} !w-20`} value={m.minQty ?? 0} onChange={(e) => setMinQty(m.id, Math.max(0, Number(e.target.value)))} /></td>
      <td className="px-3 py-3"><div className="flex flex-wrap gap-1.5">
        <input type="number" min="0" aria-label={`Quantity for ${m.name}`} className={`${inputCls} !w-20`} value={n} onChange={(e) => setN(e.target.value)} placeholder="Qty" />
        <button disabled={!valid || num === 0} onClick={() => { recordRefill(m.id, num); setN(''); }} className="rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-40">Record refill</button>
        <button disabled={!valid} onClick={() => { setQuantity(m.id, num); setN(''); }} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40">Set quantity</button></div></td>
    </tr>
  );
}

export default function Refill() {
  const { patient, patients, setPatient, medicines, reminders, settings, setRefillDays } = useApp();
  const rows = medicines.filter((m) => m.patientId === patient.id).map((m) => { const est = estimateSupply(m, reminders); return { m, est, low: isLow(m, est, settings.refillDays) }; });
  const low = rows.filter((r) => r.low);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Supply and Refill Planner</h1><p className="text-sm text-slate-500">Estimates use only the fixed schedules you set in Reminders.</p></div>
        <div className="flex items-end gap-2">
          <label className="text-xs font-semibold text-slate-600">Remind when about<div className="mt-1 flex items-center gap-1"><input type="number" min="1" className={`${inputCls} !w-16`} value={settings.refillDays} onChange={(e) => setRefillDays(Math.max(1, Number(e.target.value)))} /> days left</div></label>
          <select className={`${inputCls} !w-auto`} value={patient.id} onChange={(e) => setPatient(e.target.value)} aria-label="Patient">{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </div>
      </div>
      <Card title="Low-stock medicines" action={<Badge tone={low.length ? 'amber' : 'green'}>{low.length}</Badge>}>
        {low.length === 0 ? <Empty>Nothing is low right now.</Empty> : <ul className="space-y-1.5 text-sm">{low.map(({ m, est }) => <li key={m.id}><b>{m.name}</b>: {m.qty} left{est.ok ? `, about ${est.days} days (by ${longDate(est.date)})` : ''}. Arrange a refill through your usual pharmacy.</li>)}</ul>}
      </Card>
      <Card className="overflow-x-auto !p-2">
        {rows.length === 0 ? <Empty>No medicines for this patient.</Empty> : (
          <table className="w-full min-w-[760px] text-left"><thead className="text-xs text-slate-500"><tr>{['Medicine', 'Quantity', 'Estimated supply', 'Low below', 'Update stock'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r) => <Row key={r.m.id} {...r} />)}</tbody></table>)}
      </Card>
      <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle size={15} className="shrink-0" />Estimates are approximate and assume doses are taken as scheduled. As-needed or variable use gets no estimate. MedGuard never orders or buys medicines.</p>
    </div>
  );
}

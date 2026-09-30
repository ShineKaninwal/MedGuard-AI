import { useState } from 'react';
import { Plus, Search, ShieldCheck, ShieldAlert, Pill } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, PageBanner, inputCls } from '../components/ui';
import { useMedicineDialogs } from '../components/MedicineDialogs';
import { expiryStatus, longDate } from '../utils/medicine';

export default function Inventory() {
  const { medicines, patients } = useApp();
  const dlg = useMedicineDialogs();
  const [q, setQ] = useState(''); const [status, setStatus] = useState('all'); const [member, setMember] = useState('all'); const [sort, setSort] = useState('soonest');
  const who = (id) => patients.find((p) => p.id === id)?.name.split(' ')[0];
  const list = medicines
    .filter((m) => `${m.name} ${m.generic}`.toLowerCase().includes(q.toLowerCase()))
    .filter((m) => status === 'all' || expiryStatus(m.expiry).key === status)
    .filter((m) => member === 'all' || m.patientId === member)
    .sort((a, b) => (sort === 'soonest' ? a.expiry.localeCompare(b.expiry) : b.expiry.localeCompare(a.expiry)));

  return (
    <div className="space-y-5">
      <PageBanner icon={Pill} title="Medicine Inventory" subtitle={`${list.length} of ${medicines.length} medicines shown`}
        actions={<button onClick={() => dlg.create()} className="flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-extrabold text-navy-900 hover:bg-gold-300"><Plus size={17} aria-hidden="true" />Add medicine</button>} />
      <Card tone="sage" hover={false}>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or ingredient" aria-label="Search medicines" className={`${inputCls} pl-9`} /></div>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by expiry status">
            <option value="all">All expiry statuses</option><option value="valid">Valid</option><option value="expiring">Expiring soon</option><option value="expired">Expired</option></select>
          <select className={inputCls} value={member} onChange={(e) => setMember(e.target.value)} aria-label="Filter by family member">
            <option value="all">All family members</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className={inputCls} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by expiry date">
            <option value="soonest">Expiry: soonest first</option><option value="latest">Expiry: latest first</option></select>
        </div>
      </Card>
      {list.length === 0 ? <Empty>No medicines match. Change the filters or add a medicine.</Empty> : (
        <Card className="overflow-x-auto !p-2">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-mint-50 text-xs text-slate-600"><tr>{['Medicine', 'Ingredient', 'Qty', 'Expiry', 'Member', 'Verified'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {list.map((m) => { const st = expiryStatus(m.expiry); return (
                <tr key={m.id} onClick={() => dlg.open(m)} className="cursor-pointer border-t border-slate-100 hover:bg-mint-50">
                  <td className="px-3 py-3"><button className="text-left font-semibold hover:text-teal-700" onClick={(e) => { e.stopPropagation(); dlg.open(m); }}>{m.name}</button><p className="text-xs text-slate-500">{[m.strength, m.form].filter(Boolean).join(', ')}</p></td>
                  <td className="px-3 py-3 text-slate-600">{m.generic}</td>
                  <td className="px-3 py-3 font-semibold tabular-nums">{m.qty}</td>
                  <td className="px-3 py-3"><Badge tone={st.tone}>{st.label}</Badge><p className="mt-0.5 text-xs text-slate-500">{longDate(m.expiry)}</p></td>
                  <td className="px-3 py-3">{who(m.patientId)}</td>
                  <td className="px-3 py-3">{m.verified === 'verified' ? <ShieldCheck size={18} className="text-teal-600" aria-label="Verified" /> : <ShieldAlert size={18} className="text-slate-500" aria-label="Unverified" />}</td>
                </tr>); })}
            </tbody>
          </table>
        </Card>
      )}
      {dlg.node}
    </div>
  );
}

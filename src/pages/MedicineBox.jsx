import { useState } from 'react';
import { Plus, Pill } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Badge, Empty, inputCls } from '../components/ui';
import { useMedicineDialogs } from '../components/MedicineDialogs';
import { expiryStatus, longDate } from '../utils/medicine';

export default function MedicineBox() {
  const { medicines, patients } = useApp();
  const dlg = useMedicineDialogs();
  const [member, setMember] = useState('all');
  const list = medicines.filter((m) => member === 'all' || m.patientId === member).sort((a, b) => a.expiry.localeCompare(b.expiry));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Digital Medicine Box</h1>
          <p className="flex gap-3 text-xs text-slate-500">{[['bg-emerald-500', 'Valid'], ['bg-amber-400', 'Expiring soon'], ['bg-red-500', 'Expired']].map(([c, l]) => <span key={l} className="flex items-center gap-1"><i className={`h-2 w-2 rounded-full ${c}`} />{l}</span>)}</p></div>
        <div className="flex gap-2">
          <select className={`${inputCls} !w-auto`} value={member} onChange={(e) => setMember(e.target.value)} aria-label="Filter by family member">
            <option value="all">Everyone</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <button onClick={() => dlg.create()} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"><Plus size={17} />Add</button>
        </div>
      </div>
      {list.length === 0 ? <Empty>The box is empty. Add a medicine to place it here.</Empty> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => { const st = expiryStatus(m.expiry); return (
            <motion.button key={m.id} whileHover={{ y: -3 }} onClick={() => dlg.open(m)} className="overflow-hidden rounded-2xl bg-white text-left shadow-card ring-1 ring-slate-100">
              <div className={`h-2 ${st.bar}`} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-navy-700"><Pill size={18} /></span>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
                <p className="mt-3 font-bold">{m.name}</p>
                <p className="text-xs text-slate-500">{[m.strength, m.form].filter(Boolean).join(', ')}</p>
                <div className="mt-3 flex items-end justify-between text-xs text-slate-500">
                  <span><b className="text-lg text-navy-900 tabular-nums">{m.qty}</b> in stock</span>
                  <span className="text-right">Expires {longDate(m.expiry)}<br /><b className="text-navy-900">{patients.find((p) => p.id === m.patientId)?.name}</b></span>
                </div>
              </div>
            </motion.button>); })}
        </div>
      )}
      {dlg.node}
    </div>
  );
}

import { useState } from 'react';
import { Pencil, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Modal, Field, FieldError, Badge, inputCls } from './ui';
import { useConfirm, useToast } from './Feedback';
import { useApp } from '../context/AppContext';
import { expiryStatus, longDate } from '../utils/medicine';
import { inr } from '../utils/waste';

const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Gel', 'Inhaler', 'Drops', 'Injection', 'Other'];

function MedicineForm({ initial, onClose }) {
  const { patients, prescriptions, saveMedicine, selectedPatientId } = useApp();
  const toast = useToast();
  const [f, setF] = useState({ name: '', generic: '', strength: '', form: 'Tablet', qty: '', minQty: '', cost: '', expiry: '', patientId: selectedPatientId, rxId: '', verified: 'unverified', ...initial });
  const [tried, setTried] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const err = {
    name: f.name.trim() ? '' : 'Enter the medicine name.',
    generic: f.generic.trim() ? '' : 'Enter the active ingredient (for example, Metformin).',
    expiry: f.expiry ? '' : 'Choose the expiry date printed on the pack.',
    qty: f.qty === '' ? 'Enter how many units you have (0 is fine).' : !Number.isInteger(Number(f.qty)) || Number(f.qty) < 0 ? 'Enter a whole number, 0 or more.' : '',
    cost: f.cost !== '' && Number(f.cost) < 0 ? 'Value cannot be negative.' : '',
  };
  const bad = Object.values(err).some(Boolean);
  const rxs = prescriptions.filter((p) => p.patientId === f.patientId);
  const submit = (e) => {
    e.preventDefault(); setTried(true); if (bad) return;
    saveMedicine({ ...f, name: f.name.trim(), generic: f.generic.trim(), strength: f.strength.trim(), qty: Number(f.qty), minQty: Number(f.minQty || 0), cost: Number(f.cost || 0), rxId: f.rxId || null });
    toast(`${f.name.trim()} ${initial?.id ? 'updated' : 'added to your inventory'}.`); onClose();
  };
  const inv = (k) => tried && !!err[k];
  return (
    <Modal title={initial?.id ? 'Edit medicine' : 'Add medicine'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Medicine name *" className="sm:col-span-2"><input className={inputCls} value={f.name} onChange={set('name')} autoFocus aria-invalid={inv('name')} /><FieldError show={tried}>{err.name}</FieldError></Field>
        <Field label="Active ingredient *"><input className={inputCls} value={f.generic} onChange={set('generic')} aria-invalid={inv('generic')} /><FieldError show={tried}>{err.generic}</FieldError></Field>
        <Field label="Strength"><input className={inputCls} value={f.strength} onChange={set('strength')} placeholder="e.g. 500 mg" /></Field>
        <Field label="Dosage form"><select className={inputCls} value={f.form} onChange={set('form')}>{FORMS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Expiry date *"><input type="date" className={inputCls} value={f.expiry} onChange={set('expiry')} aria-invalid={inv('expiry')} /><FieldError show={tried}>{err.expiry}</FieldError></Field>
        <Field label="Quantity in stock *"><input type="number" inputMode="numeric" min="0" className={inputCls} value={f.qty} onChange={set('qty')} aria-invalid={inv('qty')} /><FieldError show={tried}>{err.qty}</FieldError></Field>
        <Field label="Minimum quantity"><input type="number" inputMode="numeric" min="0" className={inputCls} value={f.minQty} onChange={set('minQty')} /></Field>
        <Field label="Value of stock on hand (₹)" className="sm:col-span-2"><input type="number" inputMode="decimal" min="0" className={inputCls} value={f.cost} onChange={set('cost')} placeholder="Optional. What the units you hold cost" aria-invalid={inv('cost')} />
          <FieldError show={tried}>{err.cost}</FieldError><span className="mt-1 block text-xs font-normal text-slate-500">Used only for Waste Analytics. Leave blank if you do not know.</span></Field>
        <Field label="Family member"><select className={inputCls} value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value, rxId: '' })}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Prescription"><select className={inputCls} value={f.rxId || ''} onChange={set('rxId')}><option value="">None</option>{rxs.map((p) => <option key={p.id} value={p.id}>{p.doctor || 'Unknown'}, {longDate(p.date)}</option>)}</select></Field>
        <Field label="Verification" className="sm:col-span-2">
          <select className={inputCls} value={f.verified} onChange={set('verified')}><option value="unverified">Unverified</option><option value="verified">Verified against label or prescription</option></select>
        </Field>
        {tried && bad && <p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-2">Please fix the highlighted fields to save this medicine.</p>}
        <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button type="submit" className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700">Save medicine</button>
        </div>
      </form>
    </Modal>
  );
}

function MedicineDetail({ medicine: m, onClose, onEdit }) {
  const { patients, prescriptions, deleteMedicine } = useApp();
  const confirm = useConfirm(); const toast = useToast();
  const st = expiryStatus(m.expiry);
  const rx = prescriptions.find((p) => p.id === m.rxId);
  const rows = [
    ['Active ingredient', m.generic], ['Strength', m.strength || 'Not set'], ['Dosage form', m.form],
    ['Quantity', `${m.qty}${m.minQty ? ` (minimum ${m.minQty})` : ''}`], ['Value of stock on hand', Number(m.cost) > 0 ? inr(m.cost) : 'Not set'],
    ['Expiry date', `${longDate(m.expiry)} (${st.days < 0 ? `${-st.days} days ago` : `in ${st.days} days`})`],
    ['Family member', patients.find((p) => p.id === m.patientId)?.name], ['Prescription', rx ? `${rx.doctor || 'Unknown doctor'}, ${longDate(rx.date)}` : 'None linked'],
  ];
  const remove = async () => {
    const ok = await confirm({ title: `Delete ${m.name}?`, confirmLabel: 'Delete medicine', body: 'This removes the medicine and its reminders from MedGuard. It does not dispose of the medicine itself. For expired stock, use the Disposal Guide so the removal is recorded in Waste Analytics.' });
    if (ok) { deleteMedicine(m.id); toast(`${m.name} deleted.`); onClose(); }
  };
  return (
    <Modal title={m.name} onClose={onClose}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={st.tone}>{st.label}</Badge>
        {m.verified === 'verified' ? <Badge tone="teal"><ShieldCheck size={12} className="mr-1" aria-hidden="true" />Verified</Badge> : <Badge tone="slate"><ShieldAlert size={12} className="mr-1" aria-hidden="true" />Unverified</Badge>}
      </div>
      <dl className="divide-y divide-slate-100 text-sm">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-slate-600">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
      </dl>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={remove} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><Trash2 size={15} aria-hidden="true" />Delete</button>
        <button type="button" onClick={onEdit} className="flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"><Pencil size={15} aria-hidden="true" />Edit</button>
      </div>
    </Modal>
  );
}

// Shared by Inventory, Medicine Box and Prescriptions.
export function useMedicineDialogs() {
  const { medicines } = useApp();
  const [v, setV] = useState(null);
  const close = () => setV(null);
  const med = v?.id && medicines.find((m) => m.id === v.id);
  let node = null;
  if (v?.mode === 'form') node = <MedicineForm initial={v.initial} onClose={close} />;
  else if (v?.mode === 'view' && med) node = <MedicineDetail medicine={med} onClose={close} onEdit={() => setV({ mode: 'form', initial: med })} />;
  return { open: (m) => setV({ mode: 'view', id: m.id }), create: (initial) => setV({ mode: 'form', initial }), node };
}

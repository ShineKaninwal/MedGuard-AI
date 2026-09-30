import { useRef, useState } from 'react';
import { Plus, ScanLine, Pencil, Trash2, ImagePlus, Loader2, AlertTriangle, PackagePlus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Modal, Field, Needs, Notice, inputCls } from '../components/ui';
import { CAMERA_CAPTURE_APPROVED, DEMO_UPLOADS_ALLOWED, CAMERA_NOTICE } from '../config/policy';
import { useMedicineDialogs } from '../components/MedicineDialogs';
import { useConfirm } from '../components/Feedback';
import { fileToSmallDataUrl, makeSamplePrescriptionImage } from '../utils/image';
import { todayKey } from '../utils/dates';
import { longDate } from '../utils/medicine';

const blankItem = () => ({ name: '', strength: '', instructions: '' });

// Camera rule: cameras may produce counts only, and prescription scanning is not approved. So there is no live capture here.
// The file chooser takes a saved image file (no `capture` attribute). Uploads need a tick-box saying the file is a fictional demo.
function ImagePicker({ image, onChange }) {
  const ref = useRef(); const [err, setErr] = useState(''); const [fictional, setFictional] = useState(false);
  const pick = async (e) => {
    const f = e.target.files[0]; e.target.value = ''; setErr(''); if (!f) return;
    if (!fictional) return setErr('Tick the box to confirm this is a fictional demo image first.');
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return setErr('Choose a saved PNG, JPG or WebP file.');
    if (f.size > 15 * 1024 * 1024) return setErr('That image is larger than 15 MB. Choose a smaller file.');
    try { onChange(await fileToSmallDataUrl(f)); } catch { setErr('That image could not be read. Try a different file.'); }
  };
  return (
    <div className="space-y-3">
      <Notice tone="amber"><b>Camera capture is off.</b> {CAMERA_NOTICE} Type the prescription in, use the built-in fictional sample, or choose a saved fictional demo image.{CAMERA_CAPTURE_APPROVED ? ' (Approval flag is set in config/policy.js.)' : ''}</Notice>
      {image ? (
        <div className="relative inline-block"><img src={image} alt="Prescription" className="max-h-44 rounded-xl ring-1 ring-slate-200" />
          <button type="button" onClick={() => onChange(null)} aria-label="Remove image" className="absolute right-1 top-1 rounded-full bg-white p-1.5 shadow"><X size={14} aria-hidden="true" /></button></div>
      ) : (
        <div className="space-y-2">
          {DEMO_UPLOADS_ALLOWED && (
            <label className="flex cursor-pointer items-start gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-teal-600" checked={fictional} onChange={(e) => setFictional(e.target.checked)} />
              This file is a fictional demo image. It is not a real prescription, patient record or identity document, and was not taken with a camera for this app.</label>)}
          <div className="flex flex-wrap gap-2">
            {DEMO_UPLOADS_ALLOWED && <>
              <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick} aria-label="Fictional demo prescription image file" />
              <button type="button" disabled={!fictional} onClick={() => ref.current.click()} className="flex items-center gap-2 rounded-xl border border-dashed border-slate-400 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-teal-500 hover:text-teal-700 disabled:opacity-50"><ImagePlus size={17} aria-hidden="true" />Choose a saved demo image</button></>}
            <button type="button" onClick={() => { setErr(''); onChange(makeSamplePrescriptionImage()); }} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"><ScanLine size={17} aria-hidden="true" />Use a sample prescription image</button>
          </div>
        </div>
      )}
      {err && <p role="alert" className="text-xs font-semibold text-red-700">{err}</p>}
    </div>
  );
}

function Items({ items, setItems, conf, checked, toggle }) {
  const upd = (i, k, v) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl bg-slate-50 p-3">
          <div className="grid grid-cols-2 gap-2">
            {[['name', 'Medicine name'], ['strength', 'Strength']].map(([k, l]) => <Cell key={k} label={l} k={`i${i}.${k}`} value={it[k]} onChange={(v) => upd(i, k, v)} {...{ conf, checked, toggle }} />)}
            <Cell label="Dosage instructions (as written by the doctor)" k={`i${i}.instructions`} value={it.instructions} onChange={(v) => upd(i, 'instructions', v)} wide {...{ conf, checked, toggle }} />
          </div>
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="mt-2 text-xs font-semibold text-red-600">Remove medicine</button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, blankItem()])} className="text-sm font-semibold text-teal-600">+ Add medicine line</button>
    </div>
  );
}

// One editable field; shows confidence + a confirm checkbox when OCR is unsure.
function Cell({ label, k, value, onChange, wide, conf, checked, toggle }) {
  const c = conf?.[k]; const low = c !== undefined && c < 80;
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <Field label={label}><input className={`${inputCls} ${low && !checked[k] ? '!border-amber-400 bg-amber-50' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} /></Field>
      {c !== undefined && (
        <p className={`mt-1 flex items-center gap-2 text-[11px] ${low ? 'text-amber-700' : 'text-slate-500'}`}>
          Confidence {c}%{low && <label className="flex items-center gap-1 font-semibold"><input type="checkbox" checked={!!checked[k]} onChange={() => toggle(k)} />I checked this against the image</label>}
        </p>
      )}
    </div>
  );
}

function PrescriptionForm({ initial, onClose }) {
  const { patients, selectedPatientId, savePrescription } = useApp();
  const [f, setF] = useState({ patientId: selectedPatientId, doctor: '', date: todayKey(), notes: '', image: null, source: 'manual', items: [blankItem()], ...initial });
  const ok = f.doctor.trim() && f.date;
  const submit = (e) => { e.preventDefault(); if (!ok) return; savePrescription({ ...f, items: f.items.filter((i) => i.name.trim()) }); onClose(); };
  return (
    <Modal wide title={initial?.id ? 'Edit prescription' : 'Add prescription'} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
        <Field label="Family member"><select className={inputCls} value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value })}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Prescribing doctor *"><input className={inputCls} value={f.doctor} onChange={(e) => setF({ ...f, doctor: e.target.value })} /></Field>
        <Field label="Prescription date *"><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <div className="md:col-span-3"><p className="mb-2 text-xs font-semibold text-slate-600">Medicines on the prescription</p><Items items={f.items} setItems={(items) => setF({ ...f, items })} checked={{}} /></div>
        <Field label="Notes" className="md:col-span-3"><input className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <div className="md:col-span-3"><ImagePicker image={f.image} onChange={(image) => setF({ ...f, image })} /></div>
        <Needs className="md:col-span-3" list={[[f.doctor.trim(), 'the doctor'], [f.date, 'the prescription date']]} />
        <div className="flex justify-end gap-2 md:col-span-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button disabled={!ok} className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">Save prescription</button>
        </div>
      </form>
    </Modal>
  );
}

// Simulated OCR: the sample below is NOT read from the uploaded image.
const SAMPLE = { doctor: 'Dr. R. Sharma', date: todayKey(), items: [
  { name: 'Amoxicillin', strength: '250 mg', instructions: '1 capsule three times daily for 5 days' },
  { name: 'Cetirizine', strength: '10 mg', instructions: '1 tablet at night' }],
  conf: { doctor: 92, date: 88, 'i0.name': 95, 'i0.strength': 71, 'i0.instructions': 64, 'i1.name': 90, 'i1.strength': 84, 'i1.instructions': 58 } };

function Scanner({ onClose }) {
  const { patients, selectedPatientId, savePrescription } = useApp();
  const [step, setStep] = useState('upload'); const [image, setImage] = useState(null);
  const [d, setD] = useState(null); const [checked, setChecked] = useState({}); const [patientId, setPatientId] = useState(selectedPatientId);
  const scan = () => { setStep('scanning'); setTimeout(() => { setD({ doctor: SAMPLE.doctor, date: SAMPLE.date, items: SAMPLE.items.map((i) => ({ ...i })) }); setStep('review'); }, 1500); };
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }));
  const pending = d ? Object.keys(SAMPLE.conf).filter((k) => SAMPLE.conf[k] < 80 && !checked[k] && (!k.startsWith('i') || d.items[+k[1]])) : [];
  const confirm = () => { savePrescription({ patientId, doctor: d.doctor, date: d.date, notes: 'Extracted with simulated OCR and confirmed by user', image, source: 'scan', items: d.items.filter((i) => i.name.trim()) }); onClose(); };
  return (
    <Modal wide title="Demo prescription scan (simulated)" onClose={onClose}>
      <p className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle size={15} className="shrink-0" />Simulated OCR. This prototype shows sample text and does not read your image. Real OCR would need review too.</p>
      {step === 'upload' && (<div className="space-y-4"><ImagePicker image={image} onChange={setImage} />
        <button disabled={!image} onClick={scan} className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40"><ScanLine size={16} />Run simulated scan</button></div>)}
      {step === 'scanning' && <p className="flex items-center gap-2 py-10 text-sm text-slate-600" role="status"><Loader2 className="animate-spin" size={18} aria-hidden="true" />Extracting sample fields (simulated)...</p>}
      {step === 'review' && d && (
        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <img src={image} alt="Uploaded prescription" className="rounded-xl ring-1 ring-slate-200" />
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Edit anything that looks wrong. Fields below 80% confidence must be checked before you can save. Nothing is added to inventory automatically.</p>
            <Field label="Family member"><select className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            {(() => { const a = patients.find((p) => p.id === patientId)?.allergies || []; return <p role="note" className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">MedGuard does not check medicines against allergies. {a.length ? `Recorded allergies for this person: ${a.join(', ')}. Check every item with a doctor or pharmacist.` : 'No allergies are recorded for this person. Check with a doctor or pharmacist.'}</p>; })()}
            <div className="grid grid-cols-2 gap-2">
              <Cell label="Prescribing doctor" k="doctor" value={d.doctor} onChange={(v) => setD({ ...d, doctor: v })} conf={SAMPLE.conf} checked={checked} toggle={toggle} />
              <div><Field label="Prescription date"><input type="date" className={inputCls} value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></Field><p className="mt-1 text-[11px] text-slate-500">Confidence {SAMPLE.conf.date}%</p></div>
            </div>
            <Items items={d.items} setItems={(items) => setD({ ...d, items })} conf={SAMPLE.conf} checked={checked} toggle={toggle} />
            <div className="flex items-center justify-end gap-3">
              {pending.length > 0 && <span className="text-xs text-amber-700">{pending.length} uncertain field{pending.length > 1 ? 's' : ''} left to check</span>}
              <button disabled={pending.length > 0 || !d.doctor.trim()} onClick={confirm} className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">Confirm and save</button>
            </div>
          </div>
        </div>)}
    </Modal>
  );
}

export default function Prescriptions() {
  const { prescriptions, patients, medicines, deletePrescription } = useApp();
  const confirm = useConfirm();
  const dlg = useMedicineDialogs();
  const [modal, setModal] = useState(null); const [member, setMember] = useState('all');
  const list = prescriptions.filter((p) => member === 'all' || p.patientId === member).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Prescriptions</h1><p className="text-sm text-slate-500">{list.length} saved</p></div>
        <div className="flex flex-wrap gap-2">
          <select className={`${inputCls} !w-auto`} value={member} onChange={(e) => setMember(e.target.value)} aria-label="Filter by family member"><option value="all">Everyone</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <button onClick={() => setModal({ t: 'scan' })} className="flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white"><ScanLine size={16} aria-hidden="true" />Demo scan (simulated)</button>
          <button onClick={() => setModal({ t: 'form' })} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"><Plus size={16} />Add manually</button>
        </div>
      </div>
      {list.length === 0 ? <Empty>No prescriptions yet. Add one manually, or try the simulated demo scan with a fictional sample image.</Empty> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((p) => { const linked = medicines.filter((m) => m.rxId === p.id).length; return (
            <Card key={p.id}>
              <div className="flex gap-4">
                {p.image && <img src={p.image} alt="Prescription" className="h-24 w-20 rounded-lg object-cover ring-1 ring-slate-200" />}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{p.doctor || 'Unknown doctor'}</h2>
                    <Badge tone={p.source === 'scan' ? 'amber' : 'slate'}>{p.source === 'scan' ? 'Scanned (simulated OCR)' : 'Manual'}</Badge></div>
                  <p className="text-xs text-slate-500">{longDate(p.date)}, {patients.find((x) => x.id === p.patientId)?.name}, {linked} linked in inventory</p>
                  {p.notes && <p className="mt-1 text-xs text-slate-500">{p.notes}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <button aria-label="Edit prescription" onClick={() => setModal({ t: 'form', initial: p })} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>
                  <button aria-label="Delete prescription" onClick={async () => (await confirm({ title: 'Delete this prescription?', body: 'Linked medicines stay in your inventory and become unverified.', confirmLabel: 'Delete prescription' })) && deletePrescription(p.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
              </div>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {p.items.length === 0 && <li className="py-2 text-slate-500">No medicines listed.</li>}
                {p.items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2">
                    <div><p className="font-semibold">{it.name} <span className="font-normal text-slate-500">{it.strength}</span></p>{it.instructions && <p className="text-xs text-slate-500">{it.instructions}</p>}</div>
                    <button onClick={() => dlg.create({ name: it.name, strength: it.strength, generic: '', patientId: p.patientId, rxId: p.id })} className="flex shrink-0 items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700"><PackagePlus size={13} />Add to inventory</button>
                  </li>))}
              </ul>
            </Card>); })}
        </div>
      )}
      {modal?.t === 'form' && <PrescriptionForm initial={modal.initial} onClose={() => setModal(null)} />}
      {modal?.t === 'scan' && <Scanner onClose={() => setModal(null)} />}
      {dlg.node}
    </div>
  );
}

import { useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Modal, Field, PageBanner, inputCls } from '../components/ui';
import { patientStats } from '../utils/family';
import { roleLabel } from '../config/sos';
import { summarize, estimateSupply } from '../utils/schedule';
import { expiryStatus, longDate } from '../utils/medicine';
import { useConfirm } from '../components/Feedback';

const split = (t) => t.split(',').map((x) => x.trim()).filter(Boolean);

function ProfileForm({ initial, onClose }) {
  const { saveProfile } = useApp();
  const [f, setF] = useState({ name: '', age: '', relation: '', phone: '', conditions: '', allergies: '', ...initial, ...(initial && { conditions: initial.conditions.join(', '), allergies: initial.allergies.join(', ') }) });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={initial ? 'Edit profile' : 'Create profile'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (f.name.trim()) { saveProfile({ ...f, phone: (f.phone || '').trim(), phoneSample: initial && f.phone === initial.phone ? initial.phoneSample : false, name: f.name.trim(), age: Number(f.age) || 0, conditions: split(f.conditions), allergies: split(f.allergies) }); onClose(); } }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name *" className="sm:col-span-2"><input className={inputCls} value={f.name} onChange={set('name')} autoFocus /></Field>
        <Field label="Age"><input type="number" min="0" className={inputCls} value={f.age} onChange={set('age')} /></Field>
        <Field label="Relation"><input className={inputCls} value={f.relation} onChange={set('relation')} placeholder="e.g. Father" /></Field>
        <Field label="Phone number (used by the caregiver Call button)" className="sm:col-span-2"><input type="tel" inputMode="tel" className={inputCls} value={f.phone} onChange={set('phone')} placeholder="Optional" />{f.phoneSample && f.phone === initial?.phone && <p className="mt-1 text-[11px] text-amber-700">Sample number. Replace it with the real one.</p>}</Field>
        <Field label="Conditions (comma separated)" className="sm:col-span-2"><input className={inputCls} value={f.conditions} onChange={set('conditions')} /></Field>
        <Field label="Allergies (comma separated)" className="sm:col-span-2"><input className={inputCls} value={f.allergies} onChange={set('allergies')} /></Field>
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button disabled={!f.name.trim()} className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">Save profile</button></div>
      </form>
    </Modal>
  );
}

function DeleteProfile({ p, onClose }) {
  const { patients, deleteProfile } = useApp();
  const others = patients.filter((x) => x.id !== p.id); const [t, setT] = useState('');
  return (
    <Modal title={`Delete ${p.name}?`} onClose={onClose}>
      <p className="mb-3 text-sm text-slate-500">Choose what happens to this profile's medicines, prescriptions, reminders, dose records, appointments and contacts.</p>
      <select className={inputCls} value={t} onChange={(e) => setT(e.target.value)} aria-label="What to do with their data"><option value="">Delete all their data</option>{others.map((o) => <option key={o.id} value={o.id}>Move everything to {o.name}</option>)}</select>
      <div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
        <button onClick={() => { deleteProfile(p.id, t || null); onClose(); }} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white">Delete profile</button></div>
    </Modal>
  );
}

const MoveTo = ({ patients, current, onMove, label }) => {
  const confirm = useConfirm();
  return (
  <select aria-label={label} value="" onChange={async (e) => { const to = e.target.value; if (to && await confirm({ title: 'Reassign to this profile?', body: 'Reminders move too. Prescription links and verification are cleared.', confirmLabel: 'Reassign', tone: 'navy' })) onMove(to); }} className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-500">
    <option value="">Move to...</option>{patients.filter((x) => x.id !== current).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
  );
};

export default function Family() {
  const s = useApp();
  const { patients, patient, setPatient, role, prescriptions, contacts, navigate, reassignMedicine, reassignPrescription, doseLogs, reminders } = s;
  const [modal, setModal] = useState(null);
  const cg = role === 'caregiver'; const st = patientStats(s, patient.id);
  const rxs = prescriptions.filter((p) => p.patientId === patient.id); const cts = contacts.filter((c) => c.patientId === patient.id);
  const week = summarize(reminders, doseLogs, patient.id, 7).total;
  const shownProfiles = cg ? patients : [patient];
  return (
    <div className="space-y-5">
      <PageBanner icon={Users} title="Family Profiles" subtitle={cg ? 'Select a profile to see its overview.' : 'Patient view: you can only see your own profile (simulated).'}
        actions={cg && <button onClick={() => setModal({ t: 'form' })} className="flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-extrabold text-navy-900 hover:bg-gold-300"><Plus size={16} aria-hidden="true" />Create profile</button>} />
      <div className="flex flex-wrap gap-2">{shownProfiles.map((p) => (
        <button key={p.id} onClick={() => setPatient(p.id)} aria-pressed={p.id === patient.id} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${p.id === patient.id ? 'bg-navy-900 text-white shadow-card' : 'bg-white text-slate-800 shadow-card hover:bg-mint-100'}`}>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-400 text-xs font-extrabold text-navy-900">{p.name[0]}</span>{p.name}</button>))}</div>

      <Card tone="sage" title={patient.name} action={cg && <div className="flex gap-1">
        <button aria-label="Edit profile" onClick={() => setModal({ t: 'form', p: patient })} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>
        {patients.length > 1 && <button aria-label="Delete profile" onClick={() => setModal({ t: 'del' })} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>}</div>}>
        <p className="text-sm text-slate-500">{patient.relation}, age {patient.age}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">{patient.conditions.map((c) => <Badge key={c} tone="teal">{c}</Badge>)}{patient.allergies.map((a) => <Badge key={a} tone="red">Allergy: {a}</Badge>)}{!patient.conditions.length && !patient.allergies.length && <span className="text-xs text-slate-500">No conditions or allergies recorded.</span>}</div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Assigned medicines" action={<button onClick={() => navigate('inventory')} className="text-xs font-bold text-teal-600">Inventory</button>}>
          {st.meds.length === 0 ? <Empty>No medicines assigned.</Empty> : <ul className="divide-y divide-slate-100 text-sm">{st.meds.map((m) => { const e = expiryStatus(m.expiry); return (
            <li key={m.id} className="flex items-center justify-between gap-2 py-2"><span><b>{m.name}</b> <span className="text-xs text-slate-500">{m.strength}, {m.qty} left</span></span>
              <span className="flex items-center gap-2"><Badge tone={e.tone}>{e.label}</Badge>{cg && <MoveTo patients={patients} current={patient.id} label={`Move ${m.name}`} onMove={(to) => reassignMedicine(m.id, to)} />}</span></li>); })}</ul>}
        </Card>
        <Card title="Prescriptions" action={<button onClick={() => navigate('prescriptions')} className="text-xs font-bold text-teal-600">Manage</button>}>
          {rxs.length === 0 ? <Empty>No prescriptions saved.</Empty> : <ul className="divide-y divide-slate-100 text-sm">{rxs.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-2"><span><b>{p.doctor || 'Unknown doctor'}</b> <span className="text-xs text-slate-500">{longDate(p.date)}, {p.items.length} items</span></span>
              {cg && <MoveTo patients={patients} current={patient.id} label="Move prescription" onMove={(to) => reassignPrescription(p.id, to)} />}</li>))}</ul>}
        </Card>
        <Card tone="ivory" title="Tracking, last 7 days" action={<button onClick={() => navigate('tracker')} className="text-xs font-bold text-teal-600">Full history</button>}>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">{[['Taken', week.taken], ['Not taken', week.not_taken], ['Skipped', week.skipped], ['Unconfirmed', week.unconfirmed]].map(([k, v]) => <div key={k} className="rounded-xl bg-white p-2 ring-1 ring-ivory-300"><p className="text-lg font-extrabold">{v}</p><p className="text-slate-500">{k}</p></div>)}</div>
          <p className="mt-2 text-[11px] text-slate-500">User-reported records. They do not prove a medicine was taken.</p>
        </Card>
        <Card title="Supply status" action={<button onClick={() => navigate('refill')} className="text-xs font-bold text-teal-600">Refill planner</button>}>
          {st.meds.length === 0 ? <Empty>No medicines.</Empty> : <ul className="space-y-1.5 text-sm">{st.meds.map((m) => { const est = estimateSupply(m, reminders); return (
            <li key={m.id} className="flex justify-between gap-2"><span>{m.name}</span><span className="text-xs text-slate-500">{est.ok ? `about ${est.days} days` : 'no estimate'}{st.low.some((x) => x.m.id === m.id) && ' (low)'}</span></li>); })}</ul>}
        </Card>
        <Card title="Appointments" action={<button onClick={() => navigate('appointments')} className="text-xs font-bold text-teal-600">Calendar</button>}>
          {st.appts.length === 0 ? <Empty>No upcoming appointments.</Empty> : <ul className="space-y-1.5 text-sm">{st.appts.map((a) => <li key={a.id}><b>{a.doctor}</b>, {longDate(a.date)} {a.time}</li>)}</ul>}
        </Card>
        <Card tone="ivory" title="Emergency contacts" action={<button onClick={() => navigate('contacts')} className="text-xs font-bold text-teal-600">Contacts page</button>}>
          {cts.length === 0 ? <Empty>No contacts saved.</Empty> : <ul className="space-y-1.5 text-sm">{cts.map((c) => <li key={c.id}><b>{c.name}</b> <span className="text-xs text-slate-500">{c.relation || roleLabel(c.category)}, {c.phone}{c.primary ? ', primary' : ''}{c.sos ? ', gets SOS alerts' : ''}</span></li>)}</ul>}
          <p className="mt-2 text-[11px] text-slate-500">Sample contacts use made-up numbers. Add, edit and delete them on the Contacts page.</p>
        </Card>
      </div>
      <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle size={15} className="shrink-0" />Roles are a simulation for the prototype. There is no authentication, and all data is stored in this browser.</p>
      {modal?.t === 'form' && <ProfileForm initial={modal.p} onClose={() => setModal(null)} />}
      {modal?.t === 'del' && <DeleteProfile p={patient} onClose={() => setModal(null)} />}
    </div>
  );
}

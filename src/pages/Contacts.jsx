import { useState } from 'react';
import { Plus, Pencil, Trash2, Star, Phone, AlertTriangle, Siren } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Modal, Field, inputCls } from '../components/ui';
import { CONTACT_ROLES, roleLabel } from '../config/sos';
import { validPhone, telHref } from '../utils/phone';
import ConfirmDialog from '../components/sos/ConfirmDialog';

const tones = { family: 'teal', caregiver: 'green', doctor: 'amber', hospital: 'red', ambulance: 'red' };

function ContactForm({ initial, patientId, onClose }) {
  const { saveContact } = useApp();
  const [f, setF] = useState({ name: '', category: 'family', relation: '', phone: '', notes: '', primary: false, sos: true, ...initial });
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const errs = { name: f.name.trim() ? '' : 'Enter a name.', phone: validPhone(f.phone) ? '' : 'Enter a phone number with 7 to 15 digits, e.g. +91 98765 43210.' };
  const submit = (e) => { e.preventDefault(); setTouched(true); if (errs.name || errs.phone) return;
    saveContact({ ...f, name: f.name.trim(), relation: f.relation.trim(), phone: f.phone.trim(), notes: f.notes.trim(), patientId: initial?.patientId || patientId }); onClose(); };
  return (
    <Modal title={initial ? 'Edit contact' : 'Add emergency contact'} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2" noValidate>
        <Field label="Name *" className="sm:col-span-2"><input className={inputCls} value={f.name} onChange={set('name')} autoFocus aria-invalid={touched && !!errs.name} />{touched && errs.name && <p className="mt-1 text-xs font-semibold text-red-600">{errs.name}</p>}</Field>
        <Field label="Role *"><select className={inputCls} value={f.category} onChange={set('category')}>{CONTACT_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></Field>
        <Field label="Relationship or title"><input className={inputCls} value={f.relation} onChange={set('relation')} placeholder="e.g. Daughter, Cardiologist" /></Field>
        <Field label="Phone number *" className="sm:col-span-2"><input type="tel" inputMode="tel" className={inputCls} value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210" aria-invalid={touched && !!errs.phone} />{touched && errs.phone && <p className="mt-1 text-xs font-semibold text-red-600">{errs.phone}</p>}</Field>
        <Field label="Notes (optional)" className="sm:col-span-2"><textarea rows={2} className={inputCls} value={f.notes} onChange={set('notes')} placeholder="e.g. Lives nearby, speaks Tamil and English" /></Field>
        <label className="sm:col-span-2 flex cursor-pointer items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-teal-600" checked={f.primary} onChange={set('primary')} /><span><b>Primary contact.</b> <span className="text-xs text-slate-500">Called first by the "Call family" and "Call doctor" buttons. Only one per person.</span></span></label>
        <label className="sm:col-span-2 flex cursor-pointer items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-red-600" checked={f.sos} onChange={set('sos')} /><span><b>Receive SOS alerts.</b> <span className="text-xs text-slate-500">Pre-selected when an SOS alert is sent. You can change it for each alert.</span></span></label>
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white">Save contact</button></div>
      </form>
    </Modal>
  );
}

export default function Contacts() {
  const { patient, patients, setPatient, contacts, patchContact, setPrimaryContact, deleteContact, navigate } = useApp();
  const [form, setForm] = useState(null); const [del, setDel] = useState(null); const [filter, setFilter] = useState('all');
  const mine = contacts.filter((c) => c.patientId === patient.id);
  const shown = mine.filter((c) => filter === 'all' || c.category === filter).sort((a, b) => Number(b.primary) - Number(a.primary) || a.name.localeCompare(b.name));
  const sosCount = mine.filter((c) => c.sos).length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Emergency Contacts</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">Contacts for
            <select aria-label="Patient" value={patient.id} onChange={(e) => setPatient(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-navy-900">{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
        <button onClick={() => setForm({})} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700"><Plus size={16} />Add contact</button>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle size={15} className="mt-0.5 shrink-0" />Sample contacts use made-up numbers. Replace them with real people before relying on this. In this prototype, SOS alerts to contacts are simulated: nobody receives a real message. Calls open your phone dialer.</p>

      <div className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 text-sm font-semibold ${sosCount ? 'bg-white text-slate-700 shadow-card' : 'bg-red-50 text-red-800'}`}>
        <span className="flex items-center gap-2"><Siren size={17} className="text-red-600" />{sosCount ? `${sosCount} contact${sosCount > 1 ? 's' : ''} will be pre-selected to receive SOS alerts for ${patient.name.split(' ')[0]}` : `No contacts are set to receive SOS alerts for ${patient.name.split(' ')[0]}`}</span>
        <button onClick={() => navigate('sos')} className="text-xs font-bold text-red-600">Emergency SOS page</button></div>

      <div role="group" aria-label="Filter by role" className="flex flex-wrap gap-1.5">
        {[{ id: 'all', label: 'All' }, ...CONTACT_ROLES].map((r) => <button key={r.id} aria-pressed={filter === r.id} onClick={() => setFilter(r.id)} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === r.id ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}>{r.label}</button>)}
      </div>

      {shown.length === 0 ? <Empty>{mine.length ? 'No contacts with this role.' : `No emergency contacts for ${patient.name} yet. Add a family member, caregiver, doctor, hospital or ambulance service.`}</Empty> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {shown.map((c) => (
            <li key={c.id}><Card>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="flex flex-wrap items-center gap-1.5 font-bold">{c.name}{c.primary && <Badge tone="teal">Primary</Badge>}{c.sample && <Badge tone="slate">Sample</Badge>}</p>
                  <p className="mt-0.5 text-xs text-slate-500"><Badge tone={tones[c.category]}>{roleLabel(c.category)}</Badge> {c.relation}</p></div>
                <div className="flex shrink-0 gap-0.5">
                  <button onClick={() => setPrimaryContact(c.id)} aria-pressed={c.primary} aria-label={c.primary ? `Remove primary status from ${c.name}` : `Make ${c.name} the primary contact`} className={`rounded-lg p-2 hover:bg-slate-100 ${c.primary ? 'text-amber-500' : 'text-slate-500'}`}><Star size={16} fill={c.primary ? 'currentColor' : 'none'} /></button>
                  <button onClick={() => setForm(c)} aria-label={`Edit ${c.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>
                  <button onClick={() => setDel(c)} aria-label={`Delete ${c.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></div>
              </div>
              <a href={telHref(c.phone)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-teal-700"><Phone size={14} />{c.phone}</a>
              {c.notes && <p className="mt-1 text-xs text-slate-500">{c.notes}</p>}
              <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold">
                <span>Receive SOS alerts</span>
                <input type="checkbox" role="switch" className="h-5 w-9 cursor-pointer accent-red-600" checked={c.sos} onChange={(e) => patchContact(c.id, { sos: e.target.checked })} aria-label={`${c.name} receives SOS alerts`} /></label>
            </Card></li>))}
        </ul>)}

      {form && <ContactForm initial={form.id ? form : null} patientId={patient.id} onClose={() => setForm(null)} />}
      {del && <ConfirmDialog title={`Delete ${del.name}?`} confirmLabel="Delete contact" onClose={() => setDel(null)} onConfirm={() => { deleteContact(del.id); setDel(null); }}>
        <p>This removes the contact from {patient.name}'s list. They will no longer be pre-selected for SOS alerts, and their call button will disappear.</p>
        {del.sos && sosCount === 1 && <p className="font-semibold text-red-700">This is the only contact set to receive SOS alerts.</p>}</ConfirmDialog>}
    </div>
  );
}

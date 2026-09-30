import { useEffect, useState } from 'react';
import { Siren, MapPin, HeartPulse, Phone, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { typeLabel, roleLabel, NUMBERS, SIMULATED_NOTICE, SHARE_FIELDS } from '../../config/sos';
import { fmtDateTime, buildMessage } from '../../services/notifications';
import { telHref } from '../../utils/phone';
import { CallLink, CallNote, pickContact } from './CallButtons';
import NotificationList, { StatusSummary } from './NotificationList';
import ConfirmDialog from './ConfirmDialog';

const useTick = (ms) => { const [, set] = useState(0); useEffect(() => { const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms]); };
export const elapsed = (ts) => { const m = Math.floor((Date.now() - ts) / 60000); return m < 1 ? 'less than a minute' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };

const LOC_TEXT = { not_shared: 'Location was not shared (you did not choose to).', pending: 'Getting location... waiting for your browser.', denied: 'Location permission was denied, so no location was included.', unavailable: 'Location could not be determined.' };

export function LocationLine({ loc }) {
  if (loc?.status === 'shared') return <span>Latitude {loc.lat}, longitude {loc.lng} (accuracy about {loc.accuracy} m). <a className="font-bold text-teal-700 underline" target="_blank" rel="noopener noreferrer" href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}>Open in maps</a></span>;
  return <span>{LOC_TEXT[loc?.status] || LOC_TEXT.not_shared}</span>;
}

// The screen shown for as long as an alert is active. Calling sits at the top and is never gated.
export default function ActiveEmergency({ alert: a }) {
  const { contacts, patients, role, retryNotification, closeAlert } = useApp();
  const [dlg, setDlg] = useState(null); const [notify, setNotify] = useState(true); const [showMsg, setShowMsg] = useState(false);
  useTick(20000);
  const mine = contacts.filter((c) => c.patientId === a.patientId);
  const fam = pickContact(mine, ['family', 'caregiver']); const doc = pickContact(mine, ['doctor']);
  const patientPhone = patients.find((p) => p.id === a.patientId)?.phone || a.patientPhone;
  const ids = [...new Set(a.notifications.filter((n) => n.kind === 'alert').map((n) => n.contactId))];
  const recipients = ids.map((id) => { const n = a.notifications.find((x) => x.contactId === id); return mine.find((c) => c.id === id) || { id, name: n.contactName, phone: n.contactPhone, category: n.contactRole }; });
  const sharedKeys = SHARE_FIELDS.filter((f) => a.shared && a.shared[f.id] !== undefined);
  const NoContact = ({ label }) => <span className="flex items-center justify-center rounded-xl bg-white/60 px-4 py-3 text-center text-sm font-bold text-slate-500 ring-1 ring-slate-200">No {label} contact with a phone number saved</span>;

  return (
    <section aria-label="Active emergency" className="overflow-hidden rounded-2xl bg-white shadow-card ring-2 ring-coral-500">
      <div className="bg-coral-600 p-4 text-white">
        <p className="flex items-center gap-2 text-2xl font-extrabold tracking-wide"><Siren size={28} aria-hidden="true" />SOS ACTIVE</p>
        <p className="mt-1 text-lg font-bold">{a.patientName}: {typeLabel(a.type)}</p>
        <p className="text-sm">Alert time {fmtDateTime(a.createdAt)}. Active for {elapsed(a.createdAt)}. ID {a.id}</p>
      </div>
      <div className="space-y-5 p-4">
        <div className="space-y-2">
          <CallLink number={NUMBERS.general} className="w-full bg-coral-600 px-4 py-5 text-xl text-white hover:bg-coral-700">Call emergency services {NUMBERS.general}</CallLink>
          <div className="grid gap-2 sm:grid-cols-3">
            {fam ? <CallLink number={fam.phone} label={`Call ${fam.name}`} className="bg-navy-900 px-3 py-3.5 text-sm text-white hover:bg-navy-800">Call family: {fam.name}</CallLink> : <NoContact label="family" />}
            {doc ? <CallLink number={doc.phone} label={`Call ${doc.name}`} className="bg-navy-900 px-3 py-3.5 text-sm text-white hover:bg-navy-800">Call doctor: {doc.name}</CallLink> : <NoContact label="doctor" />}
            <CallLink number={NUMBERS.ambulance} className="bg-white px-3 py-3.5 text-sm text-coral-700 ring-2 ring-coral-300 hover:bg-coral-50">Ambulance {NUMBERS.ambulance}</CallLink>
          </div>
          {role === 'caregiver' && (patientPhone ? <CallLink number={patientPhone} className="w-full bg-teal-600 px-3 py-3 text-sm text-white hover:bg-teal-700">Call {a.patientName.split(' ')[0]}</CallLink> : <p className="text-center text-xs text-slate-500">No phone number saved for {a.patientName}. Add one in Family Profiles.</p>)}
          <CallNote />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-extrabold">Contact notifications</h3><StatusSummary notifications={a.notifications} /></div>
          <p className="mb-2 rounded-lg bg-slate-800 p-2.5 text-xs font-semibold text-white">{SIMULATED_NOTICE}</p>
          <NotificationList notifications={a.notifications} onRetry={(nid) => retryNotification(a.id, nid)} />
          <button onClick={() => setShowMsg(!showMsg)} className="mt-2 flex items-center gap-1 text-xs font-bold text-teal-700" aria-expanded={showMsg}><ChevronDown size={14} className={showMsg ? 'rotate-180' : ''} />Preview the message that would be sent</button>
          {showMsg && <pre className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">{buildMessage(a)}</pre>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div><h3 className="mb-2 text-sm font-extrabold">Contacts in this alert</h3>
            {recipients.length === 0 ? <p className="text-sm text-slate-500">None selected.</p> : (
              <ul className="space-y-1.5">{recipients.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 text-sm"><span className="min-w-0"><b>{c.name}</b><span className="block text-xs text-slate-500">{roleLabel(c.category)}, {c.phone}</span></span>
                  <a href={telHref(c.phone)} aria-label={`Call ${c.name}`} className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-extrabold text-navy-900 ring-1 ring-slate-200 hover:bg-slate-100"><Phone size={13} />Call</a></li>))}</ul>)}
          </div>
          <div className="space-y-3 text-sm">
            <div><h3 className="mb-1 flex items-center gap-1.5 text-sm font-extrabold"><MapPin size={15} />Location</h3><p className="text-slate-600"><LocationLine loc={a.location} /></p></div>
            <div><h3 className="mb-1 flex items-center gap-1.5 text-sm font-extrabold"><HeartPulse size={15} />Medical information you approved</h3>
              {sharedKeys.length === 0 ? <p className="text-slate-600">None. No medical information was included in this alert.</p> : (
                <ul className="space-y-0.5 text-slate-600">{sharedKeys.map((f) => { const v = a.shared[f.id]; return <li key={f.id}><b>{f.label}:</b> {Array.isArray(v) ? (v.join(', ') || 'none recorded') : v}</li>; })}</ul>)}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button onClick={() => setDlg('resolved')} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700">Mark resolved</button>
          <button onClick={() => setDlg('cancelled')} className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-coral-700 ring-2 ring-coral-300 hover:bg-coral-50">Cancel alert</button>
        </div>
      </div>

      {dlg && (
        <ConfirmDialog title={dlg === 'cancelled' ? 'Cancel this SOS alert?' : 'Mark this emergency as resolved?'} confirmLabel={dlg === 'cancelled' ? 'Yes, cancel alert' : 'Yes, mark resolved'} tone={dlg === 'cancelled' ? 'red' : 'navy'}
          onClose={() => setDlg(null)} onConfirm={() => { closeAlert(a.id, dlg, notify); setDlg(null); }}>
          <p>{dlg === 'cancelled' ? 'Only do this if help is not needed, for example a false alarm.' : 'Only do this once the person is safe.'} The alert will stop showing as active.</p>
          <p className="font-semibold text-slate-800">This does not end any phone call and does not stop help that is already on the way.</p>
          <label className="flex cursor-pointer items-start gap-2 pt-1"><input type="checkbox" className="mt-0.5 accent-coral-600" checked={notify} onChange={(e) => setNotify(e.target.checked)} />Also send a simulated status update to the contacts who were alerted</label>
        </ConfirmDialog>)}
    </section>
  );
}

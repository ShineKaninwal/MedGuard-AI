import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Siren, MapPin, ShieldAlert, Users, HeartPulse } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EMERGENCY_TYPES, SHARE_FIELDS, roleLabel, SIMULATED_NOTICE } from '../../config/sos';
import { EmergencyCalls, CallNote } from './CallButtons';
import { Field, inputCls } from '../ui';

const HOLD_MS = 1200;

// Confirmation screen. Emergency calling is at the very top and never depends on anything below it.
export default function SosConfirm({ onClose }) {
  const { patients, patient, contacts, emergencyAlerts, sosPrefs, triggerSos, rememberShare, navigate } = useApp();
  const [pid, setPid] = useState(patient.id);
  const [type, setType] = useState('general');
  const mine = useMemo(() => contacts.filter((c) => c.patientId === pid), [contacts, pid]);
  const [chosen, setChosen] = useState(() => mine.filter((c) => c.sos).map((c) => c.id));
  const saved = sosPrefs.defaults[pid] || {};
  const [loc, setLoc] = useState(Boolean(saved.location));
  const [fields, setFields] = useState(saved.fields || {});
  const [remember, setRemember] = useState(false);
  const [tapMode, setTapMode] = useState(false);
  const [armed, setArmed] = useState(false);
  const [hint, setHint] = useState(false);
  const [progress, setProgress] = useState(0);
  const raf = useRef(0); const t0 = useRef(0); const sent = useRef(false);
  const existing = emergencyAlerts.find((a) => a.patientId === pid && a.active);
  const p = patients.find((x) => x.id === pid) || patient;

  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => { if (!armed) return undefined; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);

  const changePatient = (id) => { setPid(id); setChosen(contacts.filter((c) => c.patientId === id && c.sos).map((c) => c.id));
    const s = sosPrefs.defaults[id] || {}; setLoc(Boolean(s.location)); setFields(s.fields || {}); };
  const toggle = (id) => setChosen((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const send = () => {
    if (sent.current || existing) return; sent.current = true;
    const share = { location: loc, fields };
    if (remember) rememberShare(pid, share);
    triggerSos({ patientId: pid, type, contactIds: chosen, share });
    onClose(); navigate('sos');
  };
  const begin = () => { if (t0.current || existing) return; t0.current = performance.now();
    const tick = () => { const v = Math.min(1, (performance.now() - t0.current) / HOLD_MS); setProgress(v);
      if (v >= 1) { t0.current = 0; send(); } else raf.current = requestAnimationFrame(tick); }; raf.current = requestAnimationFrame(tick); };
  const cancelHold = () => { cancelAnimationFrame(raf.current); t0.current = 0; setProgress(0); };
  const onClick = (e) => { e.preventDefault(); if (existing) return;
    if (tapMode) { if (armed) send(); else setArmed(true); } else { setHint(true); setTimeout(() => setHint(false), 3000); } };
  const holdProps = tapMode ? {} : { onPointerDown: begin, onPointerUp: cancelHold, onPointerLeave: cancelHold, onPointerCancel: cancelHold,
    onKeyDown: (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); begin(); } },
    onKeyUp: (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); cancelHold(); } } };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-navy-900/70 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Emergency SOS confirmation" className="mx-auto min-h-full w-full max-w-xl bg-slate-50 sm:min-h-0 sm:rounded-2xl sm:shadow-xl">
        <div className="sticky top-0 z-10 space-y-2 border-b border-coral-100 bg-coral-50 p-4 sm:rounded-t-2xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-coral-800"><Siren size={20} />Emergency SOS</h2>
            <button onClick={onClose} className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"><X size={14} />Close, no alert</button>
          </div>
          <p className="text-sm font-bold text-coral-900">In immediate danger? Call first. You can send the alert afterwards.</p>
          <EmergencyCalls />
        </div>

        <div className="space-y-5 p-4">
          <p className="rounded-xl bg-slate-800 p-3 text-xs font-semibold text-white">{SIMULATED_NOTICE}</p>

          {patients.length > 1 && <Field label="Emergency is for"><select className={inputCls} value={pid} onChange={(e) => changePatient(e.target.value)}>{patients.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>}

          <fieldset>
            <legend className="mb-2 text-sm font-extrabold">What kind of emergency?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {EMERGENCY_TYPES.map((t) => (
                <label key={t.id} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border-2 bg-white p-3 ${type === t.id ? 'border-coral-600 bg-coral-50' : 'border-slate-200'}`}>
                  <input type="radio" name="sos-type" className="mt-1 accent-coral-600" checked={type === t.id} onChange={() => setType(t.id)} />
                  <span><span className="block text-sm font-bold">{t.label}</span><span className="text-xs text-slate-500">{t.hint}</span></span>
                </label>))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 flex items-center gap-1.5 text-sm font-extrabold"><Users size={15} />Who should be alerted?</legend>
            <p className="mb-2 text-xs text-slate-500">Pre-selected from each contact's "Receive SOS alerts" setting. Change it for this alert only.</p>
            {mine.length === 0 ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{p.name} has no emergency contacts yet. You can still send the alert to record it, and use the call buttons. <button onClick={() => { onClose(); navigate('contacts'); }} className="font-bold underline">Add contacts</button></p> : (
              <ul className="space-y-1.5">{mine.map((c) => (
                <li key={c.id}><label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  <input type="checkbox" className="h-4 w-4 accent-coral-600" checked={chosen.includes(c.id)} onChange={() => toggle(c.id)} />
                  <span className="min-w-0 flex-1 text-sm"><b>{c.name}</b> <span className="text-xs text-slate-500">{roleLabel(c.category)}{c.relation ? `, ${c.relation}` : ''}, {c.phone}</span></span>
                </label></li>))}</ul>)}
          </fieldset>

          <fieldset className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <legend className="flex items-center gap-1.5 px-1 text-sm font-extrabold"><ShieldAlert size={15} />Share with contacts (optional)</legend>
            <p className="mb-2 text-xs text-slate-500">Nothing below is shared unless you tick it. Ticked items are included in the alert message to everyone selected above.</p>
            <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-coral-600" checked={loc} onChange={(e) => setLoc(e.target.checked)} /><MapPin size={14} />My current location <span className="text-xs text-slate-500">(your browser will ask for permission)</span></label>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-600"><HeartPulse size={13} />Medical information for {p.name}</p>
            <div className="grid gap-1.5 sm:grid-cols-2">{SHARE_FIELDS.map((f) => (
              <label key={f.id} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-coral-600" checked={Boolean(fields[f.id])} onChange={(e) => setFields({ ...fields, [f.id]: e.target.checked })} />{f.label}</label>))}</div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500"><input type="checkbox" className="h-3.5 w-3.5" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Remember these choices for {p.name.split(' ')[0]} next time</label>
          </fieldset>

          {existing ? (
            <div className="rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-800">An SOS alert for {p.name} is already active. <button onClick={() => { onClose(); navigate('sos'); }} className="underline">View it</button></div>
          ) : (
            <div>
              <button {...holdProps} onClick={onClick} aria-describedby="sos-send-help"
                className="relative w-full select-none overflow-hidden rounded-2xl bg-coral-600 px-4 py-5 text-lg font-extrabold uppercase tracking-wide text-white shadow-card focus-visible:outline-offset-4" style={{ touchAction: 'manipulation' }}>
                <span className="absolute inset-y-0 left-0 bg-coral-900/70" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
                <span className="relative flex items-center justify-center gap-2"><Siren size={22} />{tapMode ? (armed ? 'Tap again to send SOS' : 'Send SOS alert') : progress > 0 ? 'Keep holding...' : 'Hold to send SOS alert'}</span>
              </button>
              <p id="sos-send-help" className={`mt-2 text-center text-xs ${hint ? 'font-bold text-coral-700' : 'text-slate-500'}`}>{tapMode ? 'Tap twice within 4 seconds to send.' : 'Press and hold for about a second to send. This prevents accidental alerts. Keyboard: hold Space or Enter.'}</p>
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={tapMode} onChange={(e) => { setTapMode(e.target.checked); setArmed(false); cancelHold(); }} />I can't hold the button. Use two taps instead.</label>
            </div>
          )}
          <CallNote />
        </div>
      </div>
    </div>
  );
}

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { seed } from '../data/seed';
import { todayKey, daysUntil, daysFromNow } from '../utils/dates';
import { ALL_DAYS } from '../utils/schedule';
import { newAlertId, buildNotifications, deliver } from '../services/notifications';
import { summarizeFindings, createEmergencyAlert, alertRecipients } from '../utils/agentTools';

const KEY = 'medguard:v1';
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// Idempotent migration: fills Stage 2 fields on data saved by Stage 1.
const migrate = (s) => {
  const rx = s.prescriptions || [];
  const medicines = s.medicines.map((m) => {
    if (m.strength !== undefined) return m;
    const link = rx.find((p) => (p.medicineIds || []).includes(m.id));
    return { ...m, strength: (m.name.match(/\d+\s?(mg|mcg|ml|g)\b/i) || [''])[0], rxId: link ? link.id : null, verified: link ? 'verified' : 'unverified' };
  });
  const prescriptions = rx.map((p) => p.items ? p : { ...p, source: 'manual', notes: '', image: null,
    items: (p.medicineIds || []).map((id) => { const m = medicines.find((x) => x.id === id); return { name: m?.name || '', strength: m?.strength || '', instructions: '' }; }) });
  return { ...s, medicines, prescriptions, audits: s.audits || [] };
};
// Stage 4 migration: structured reminders, dose logs and settings. Sample history is fictional.
const PAT = ['taken', 'taken', 'taken', 'taken', 'skipped', 'taken', 'not_taken', 'taken', 'not_confirmed'];
const migrate4 = (s) => {
  if (s.doseLogs) return s;
  const start = daysFromNow(-13); const doseLogs = [];
  s.reminders.forEach((r, ri) => { for (let d = -13; d <= 0; d++) {
    const status = d === 0 ? (r.takenOn === todayKey() ? 'taken' : null) : PAT[(ri * 3 + d + 13) % PAT.length];
    if (status) doseLogs.push({ id: `${r.id}_${daysFromNow(d)}`, reminderId: r.id, patientId: r.patientId, date: daysFromNow(d), time: r.time, status, updatedAt: Date.now() });
  } });
  const reminders = s.reminders.map(({ takenOn, ...r }) => ({ days: ALL_DAYS, type: 'fixed', units: parseInt(r.dose, 10) || 1, active: true, createdDate: start, ...r }));
  return { ...s, reminders, doseLogs, settings: { refillDays: 7 } };
};
const migrate5 = (s) => s.contacts ? s : { ...s, role: 'caregiver', emergencyAlerts: [], contacts: [
  { id: 'c1', patientId: 'p1', name: 'Anita Kumar', relation: 'Daughter', phone: '+91 90000 00001' },
  { id: 'c2', patientId: 'p1', name: 'Dr. Anitha Rao', relation: 'Doctor', phone: '+91 90000 00002' },
  { id: 'c3', patientId: 'p2', name: 'Suresh Kumar', relation: 'Husband', phone: '+91 90000 00003' },
  { id: 'c4', patientId: 'p3', name: 'Meena Kumar', relation: 'Mother', phone: '+91 90000 00004' }] };
// Stage 6 migration: symptom history, per-member chats and visit-prep notes. Sample entries are fictional and flagged.
const migrate6 = (s) => s.symptoms ? s : { ...s, chats: {}, visitNotes: {}, symptoms: [
  { id: 'sy1', patientId: 'p1', text: 'Dull headache in the evenings, worse after screen use', date: daysFromNow(-4), duration: '3 days', severity: 4, notes: '', sample: true },
  { id: 'sy2', patientId: 'p2', text: 'Stiff, achy knees in the morning that ease during the day', date: daysFromNow(-6), duration: '2 weeks', severity: 5, notes: '', sample: true },
] };
// Stage 7 migration: contact roles, notes, primary and SOS flags, patient phone, SOS settings. Idempotent.
const SAMPLE_PHONES = { p1: '+91 90000 10001', p2: '+91 90000 10002' };
const guessRole = (c) => (/doctor|\bdr\b|dr\.|physician/i.test(`${c.relation} ${c.name}`) ? 'doctor' : /hospital|clinic/i.test(`${c.relation} ${c.name}`) ? 'hospital' : /ambulance/i.test(`${c.relation} ${c.name}`) ? 'ambulance' : /caregiver|nurse|attendant/i.test(c.relation || '') ? 'caregiver' : 'family');
const migrate7 = (s) => {
  if (s.sosPrefs) return s;
  const seen = new Set();
  const contacts = s.contacts.map((c) => {
    const category = c.category || guessRole(c); const near = ['family', 'caregiver'].includes(category);
    const primary = near && !seen.has(c.patientId); if (primary) seen.add(c.patientId);
    return { notes: '', sample: ['c1', 'c2', 'c3', 'c4'].includes(c.id), ...c, category, primary: c.primary ?? primary, sos: c.sos ?? near };
  });
  const patients = s.patients.map((p) => (p.phone !== undefined ? p : { ...p, phone: SAMPLE_PHONES[p.id] || '', phoneSample: Boolean(SAMPLE_PHONES[p.id]) }));
  return { ...s, contacts, patients, emergencyAlerts: s.emergencyAlerts || [], sosPrefs: { simulateFailure: false, defaults: {} } };
};
// A page reload interrupts any simulated send that was still running: show it honestly as failed (retry is available).
const resumeSos = (s) => ({ ...s, emergencyAlerts: (s.emergencyAlerts || []).map((a) => ({ ...a,
  location: a.location?.status === 'pending' ? { status: 'unavailable' } : a.location,
  notifications: (a.notifications || []).map((n) => (n.status === 'pending' ? { ...n, status: 'failed', error: 'Interrupted: the page was closed before the simulated send finished', at: Date.now() } : n)) })) });
// Stage 8 migration: records of medicines the user marked as disposed of, and removal of the old made-up monthly waste series.
// Older saved data upgrades automatically. Idempotent.
const migrate8 = (s) => {
  const { waste, ...rest } = s;
  const activity = (rest.activity || []).map((a) => (['ac1', 'ac2', 'ac3'].includes(a.id) && a.sample === undefined ? { ...a, sample: true } : a));
  return { ...rest, activity, disposals: Array.isArray(rest.disposals) ? rest.disposals : [] };
};
const full = (x) => resumeSos(migrate8(migrate7(migrate6(migrate5(migrate4(migrate(x)))))));
const load = () => { try { return full(JSON.parse(localStorage.getItem(KEY)) || seed()); } catch { return full(seed()); } };
const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const log = (s, text) => [{ id: uid('ac'), agent: 'Inventory Agent', text, ts: Date.now() }, ...s.activity].slice(0, 20);
const pageFromHash = () => window.location.hash.replace('#/', '') || 'dashboard';

// Dashboard findings. Same deterministic tools as the AI Medicine Audit (utils/agentTools.js), so the two cannot disagree.
export function analyze(medicines, patientId, reminders = [], refillDays = 7) {
  return summarizeFindings(medicines.filter((m) => m.patientId === patientId), reminders, refillDays);
}

export function AppProvider({ children }) {
  const [state, setState] = useState(load);
  const [page, setPage] = useState(pageFromHash);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { console.warn('Storage full: latest change not saved'); } }, [state]);
  useEffect(() => {
    const h = () => setPage(pageFromHash());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  const navigate = useCallback((id) => { window.location.hash = `/${id}`; }, []);
  const setPatient = (id) => setState((s) => ({ ...s, selectedPatientId: id }));
  const toggleReminder = (id) => setState((s) => ({
    ...s,
    reminders: s.reminders.map((r) => (r.id === id ? { ...r, takenOn: r.takenOn === todayKey() ? null : todayKey() } : r)),
  }));
  const runAudit = () => {
    const findings = analyze(state.medicines, state.selectedPatientId, state.reminders, state.settings?.refillDays).map((f, i) => ({ ...f, id: `al${Date.now()}${i}`, patientId: state.selectedPatientId }));
    setState((s) => ({
      ...s,
      alerts: [...s.alerts.filter((a) => a.patientId !== s.selectedPatientId), ...findings],
      activity: [{ id: `ac${Date.now()}`, agent: 'Audit Agent', text: `Audit finished: ${findings.length} issue${findings.length === 1 ? '' : 's'} found`, ts: Date.now() }, ...s.activity].slice(0, 20),
    }));
    return findings;
  };
  const resetData = () => { localStorage.removeItem(KEY); setState(full(seed())); };
  const saveMedicine = (m) => setState((s) => {
    const isNew = !m.id; const med = { ...m, id: m.id || uid('m') };
    return { ...s, medicines: isNew ? [med, ...s.medicines] : s.medicines.map((x) => (x.id === med.id ? med : x)), activity: log(s, `${isNew ? 'Added' : 'Updated'} ${med.name}`) };
  });
  const deleteMedicine = (id) => setState((s) => ({ ...s,
    medicines: s.medicines.filter((m) => m.id !== id), reminders: s.reminders.filter((r) => r.medicineId !== id),
    alerts: s.alerts.filter((a) => a.medicineId !== id), activity: log(s, `Removed ${s.medicines.find((m) => m.id === id)?.name}`) }));
  const savePrescription = (p) => { const id = p.id || uid('rx'); setState((s) => ({ ...s,
    prescriptions: p.id ? s.prescriptions.map((x) => (x.id === id ? { ...p } : x)) : [{ ...p, id }, ...s.prescriptions],
    activity: log(s, `${p.id ? 'Updated' : 'Saved'} prescription from ${p.doctor || 'unknown doctor'}`) })); return id; };
  const deletePrescription = (id) => setState((s) => ({ ...s, prescriptions: s.prescriptions.filter((p) => p.id !== id),
    medicines: s.medicines.map((m) => (m.rxId === id ? { ...m, rxId: null, verified: 'unverified' } : m)), activity: log(s, 'Deleted a prescription') }));
  const setDoseStatus = (reminderId, date, status) => setState((s) => {
    const r = s.reminders.find((x) => x.id === reminderId); if (!r) return s;
    const id = `${reminderId}_${date}`; const entry = { id, reminderId, patientId: r.patientId, date, time: r.time, status, updatedAt: Date.now() };
    return { ...s, doseLogs: s.doseLogs.some((l) => l.id === id) ? s.doseLogs.map((l) => (l.id === id ? entry : l)) : [...s.doseLogs, entry] };
  });
  const saveReminder = (r) => setState((s) => { const isNew = !r.id; const rem = { ...r, id: r.id || uid('r'), createdDate: r.createdDate || todayKey() };
    return { ...s, reminders: isNew ? [...s.reminders, rem] : s.reminders.map((x) => (x.id === rem.id ? rem : x)), activity: log(s, `${isNew ? 'Added' : 'Updated'} a reminder`) }; });
  const deleteReminder = (id) => setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id), activity: log(s, 'Deleted a reminder') }));
  const patchMedicine = (id, fn, text) => setState((s) => ({ ...s, medicines: s.medicines.map((m) => (m.id === id ? fn(m) : m)), activity: log(s, text) }));
  const recordRefill = (id, n) => patchMedicine(id, (m) => ({ ...m, qty: m.qty + n, lastRefill: { date: todayKey(), qty: n } }), `Recorded a refill of ${n}`);
  const setQuantity = (id, n) => patchMedicine(id, (m) => ({ ...m, qty: n }), 'Updated available quantity');
  const setMinQty = (id, n) => setState((s) => ({ ...s, medicines: s.medicines.map((m) => (m.id === id ? { ...m, minQty: n } : m)) }));
  const setRefillDays = (n) => setState((s) => ({ ...s, settings: { ...s.settings, refillDays: n } }));
  const setRole = (role) => setState((s) => ({ ...s, role }));
  const saveProfile = (p) => { const id = p.id || uid('p'); setState((s) => ({ ...s,
    patients: p.id ? s.patients.map((x) => (x.id === id ? { ...p } : x)) : [...s.patients, { ...p, id }],
    selectedPatientId: p.id ? s.selectedPatientId : id, activity: log(s, `${p.id ? 'Updated' : 'Created'} profile for ${p.name}`) })); return id; };
  // targetId: move all of the profile's data to another profile; null: delete it.
  const deleteProfile = (id, targetId) => setState((s) => {
    if (s.patients.length < 2) return s;
    const rest = s.patients.filter((p) => p.id !== id); const t = targetId;
    const move = (arr) => (t ? arr.map((x) => (x.patientId === id ? { ...x, patientId: t } : x)) : arr.filter((x) => x.patientId !== id));
    return { ...s, patients: rest, selectedPatientId: s.selectedPatientId === id ? (t || rest[0].id) : s.selectedPatientId,
      medicines: move(s.medicines), prescriptions: move(s.prescriptions), reminders: move(s.reminders), appointments: move(s.appointments),
      contacts: move(s.contacts), doseLogs: move(s.doseLogs), disposals: move(s.disposals), symptoms: move(s.symptoms), chats: Object.fromEntries(Object.entries(s.chats).filter(([k]) => k !== id)), visitNotes: Object.fromEntries(Object.entries(s.visitNotes).filter(([k]) => k !== id)), alerts: s.alerts.filter((a) => a.patientId !== id),
      audits: s.audits.filter((a) => a.report.patientId !== id), activity: log(s, `Removed profile ${s.patients.find((p) => p.id === id)?.name}`) };
  });
  const reassignMedicine = (id, to) => setState((s) => ({ ...s, medicines: s.medicines.map((m) => (m.id === id ? { ...m, patientId: to, rxId: null, verified: 'unverified' } : m)),
    reminders: s.reminders.map((r) => (r.medicineId === id ? { ...r, patientId: to } : r)), alerts: s.alerts.filter((a) => a.medicineId !== id), activity: log(s, 'Reassigned a medicine') }));
  const reassignPrescription = (id, to) => setState((s) => ({ ...s, prescriptions: s.prescriptions.map((p) => (p.id === id ? { ...p, patientId: to } : p)),
    medicines: s.medicines.map((m) => (m.rxId === id ? { ...m, rxId: null, verified: 'unverified' } : m)), activity: log(s, 'Reassigned a prescription') }));
  const saveAppointment = (a) => setState((s) => { const isNew = !a.id; const ap = { ...a, id: a.id || uid('a') };
    return { ...s, appointments: isNew ? [...s.appointments, ap] : s.appointments.map((x) => (x.id === ap.id ? ap : x)), activity: log(s, `${isNew ? 'Added' : 'Updated'} an appointment`) }; });
  const deleteAppointment = (id) => setState((s) => ({ ...s, appointments: s.appointments.filter((a) => a.id !== id), activity: log(s, 'Deleted an appointment') }));
  const saveSymptom = (e) => { const id = e.id || uid('sy'); setState((s) => ({ ...s,
    symptoms: e.id ? s.symptoms.map((x) => (x.id === id ? { ...e } : x)) : [{ ...e, id, createdAt: Date.now() }, ...s.symptoms],
    activity: log(s, `${e.id ? 'Updated' : 'Saved'} a symptom entry for ${s.patients.find((p) => p.id === e.patientId)?.name}`) })); return id; };
  const deleteSymptom = (id) => setState((s) => ({ ...s, symptoms: s.symptoms.filter((x) => x.id !== id), activity: log(s, 'Deleted a symptom entry') }));
  const addChat = (pid, ...msgs) => setState((s) => ({ ...s, chats: { ...s.chats, [pid]: [...(s.chats[pid] || []), ...msgs].slice(-60) } }));
  const clearChat = (pid) => setState((s) => ({ ...s, chats: { ...s.chats, [pid]: [] } }));
  const saveVisit = (pid, patch) => setState((s) => ({ ...s, visitNotes: { ...s.visitNotes, [pid]: { questions: [], notes: '', ...(s.visitNotes[pid] || {}), ...patch } } }));
  const saveAudit = (report, steps) => setState((s) => {
    const mk = (level, medicineId, text) => ({ id: uid('al'), type: 'audit', patientId: report.patientId, level, medicineId, text });
    const alerts = [
      ...report.expiry.expired.map((x) => mk('danger', x.medicine.id, `${x.medicine.name} is past its recorded expiry date.`)),
      ...report.expiry.expiring.map((x) => mk('warning', x.medicine.id, `${x.medicine.name} expires in ${x.days} days.`)),
      ...report.duplicates.map((d) => mk('warning', d.a.id, `Possible duplicate: ${d.a.name} and ${d.b.name}. Review with a pharmacist.`)),
      ...(report.lowStock || []).map((x) => mk('warning', x.medicine.id, `${x.medicine.name} is low: ${x.qty} left.`)),
    ];
    return { ...s,
      audits: [{ id: report.id, report, steps }, ...s.audits.filter((a) => a.report.patientId !== report.patientId)].slice(0, 10),
      alerts: [...s.alerts.filter((a) => a.patientId !== report.patientId), ...alerts],
      activity: [...steps.map((st) => ({ id: uid('ac'), agent: st.agent, text: st.result, ts: st.ts })).reverse(), ...s.activity].slice(0, 20) };
  });


  // Records that a person reviewed an audit report and which actions they ticked as checked. It changes no medicine, dose or schedule.
  const acknowledgeAudit = (auditId, checkedIds) => setState((s) => ({ ...s,
    audits: s.audits.map((a) => (a.id === auditId ? { ...a, report: { ...a.report, confirmation: { reviewedAt: Date.now(), checked: checkedIds } } } : a)),
    activity: log(s, 'Audit report reviewed and confirmed by the user') }));
  const setShareProfile = (on) => setState((s) => ({ ...s, settings: { ...s.settings, shareProfileWithService: !!on } }));

  // ---- Stage 8: disposal records ----
  // Removes an expired medicine (and its reminders) from the inventory and keeps a record for Waste Analytics.
  // It records what the user did. It does not dispose of anything and cannot verify that they did.
  const recordDisposal = (id, reason = 'expired') => setState((s) => {
    const m = s.medicines.find((x) => x.id === id); if (!m) return s;
    const rec = { id: uid('dp'), medicineId: id, name: m.name, patientId: m.patientId, reason, date: todayKey(), qty: m.qty, value: Number(m.cost) || 0 };
    return { ...s, disposals: [rec, ...s.disposals].slice(0, 200), medicines: s.medicines.filter((x) => x.id !== id),
      reminders: s.reminders.filter((r) => r.medicineId !== id), alerts: s.alerts.filter((a) => a.medicineId !== id), activity: log(s, `Recorded disposal of ${m.name}`) };
  });

  // ---- Stage 7: emergency contacts and SOS ----
  const saveContact = (c) => { const id = c.id || uid('c'); setState((s) => {
    const others = s.contacts.map((x) => (c.primary && x.patientId === c.patientId && x.id !== id ? { ...x, primary: false } : x));
    const rec = { ...c, id, sample: false };
    return { ...s, contacts: c.id ? others.map((x) => (x.id === id ? rec : x)) : [...others, rec], activity: log(s, `${c.id ? 'Updated' : 'Added'} emergency contact ${c.name}`) }; }); return id; };
  const deleteContact = (id) => setState((s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== id), activity: log(s, `Removed emergency contact ${s.contacts.find((c) => c.id === id)?.name}`) }));
  const patchContact = (id, patch) => setState((s) => ({ ...s, contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const setPrimaryContact = (id) => setState((s) => { const t = s.contacts.find((c) => c.id === id); if (!t) return s;
    return { ...s, contacts: s.contacts.map((c) => (c.patientId === t.patientId ? { ...c, primary: c.id === id ? !c.primary : false } : c)) }; });
  const setSosPrefs = (patch) => setState((s) => ({ ...s, sosPrefs: { ...s.sosPrefs, ...patch } }));
  const rememberShare = (pid, share) => setState((s) => ({ ...s, sosPrefs: { ...s.sosPrefs, defaults: { ...s.sosPrefs.defaults, [pid]: share } } }));

  const patchAlert = (id, fn) => setState((s) => ({ ...s, emergencyAlerts: s.emergencyAlerts.map((a) => (a.id === id ? fn(a) : a)) }));
  const patchNotif = (aid, nid, patch) => patchAlert(aid, (a) => ({ ...a, notifications: a.notifications.map((n) => (n.id === nid ? { ...n, ...patch } : n)) }));
  const runDelivery = (alert, notifs) => notifs.forEach((n) => deliver(n, alert, { simulateFailure: state.sosPrefs.simulateFailure })
    .then((r) => patchNotif(alert.id, n.id, { status: r.status, error: r.error || null, at: Date.now() })));

  // Creates the alert immediately (calling is never blocked), then runs the simulated notifications and the optional location lookup.
  // share = { location: bool, fields: { age, conditions, allergies, medicines } }
  const triggerSos = ({ patientId, type, contactIds, share }) => {
    const p = state.patients.find((x) => x.id === patientId); if (!p) return null;
    const existing = state.emergencyAlerts.find((a) => a.patientId === patientId && a.active); if (existing) return existing.id;
    const now = Date.now(); const id = newAlertId(now);
    const notifications = buildNotifications(alertRecipients(state.contacts, patientId, contactIds));
    const alert = createEmergencyAlert({ patient: p, medicines: state.medicines, type, share, id, notifications, now });
    setState((s) => ({ ...s, emergencyAlerts: [alert, ...s.emergencyAlerts].slice(0, 30), activity: [{ id: uid('ac'), agent: 'Emergency Agent', text: `SOS alert ${id} created for ${p.name} (simulated notifications)`, ts: now }, ...s.activity].slice(0, 20) }));
    runDelivery(alert, notifications);
    if (share?.location) {
      const done = (loc) => patchAlert(id, (a) => ({ ...a, location: loc }));
      if (!('geolocation' in navigator)) done({ status: 'unavailable' });
      else navigator.geolocation.getCurrentPosition(
        (pos) => done({ status: 'shared', lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5), accuracy: Math.round(pos.coords.accuracy), at: Date.now() }),
        (err) => done({ status: err.code === 1 ? 'denied' : 'unavailable' }), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
    }
    return id;
  };
  const retryNotification = (aid, nid) => { const a = state.emergencyAlerts.find((x) => x.id === aid); const n = a?.notifications.find((x) => x.id === nid); if (!n) return;
    patchNotif(aid, nid, { status: 'pending', error: null, at: Date.now() }); runDelivery(a, [n]); };
  const closeAlert = (aid, status, notifyContacts) => {
    const a = state.emergencyAlerts.find((x) => x.id === aid); if (!a) return; const now = Date.now();
    const closed = { ...a, active: false, status, closedAt: now };
    let extra = [];
    if (notifyContacts) { const ids = [...new Set(a.notifications.filter((n) => n.kind === 'alert').map((n) => n.contactId))];
      extra = buildNotifications(state.contacts.filter((c) => ids.includes(c.id)).map((c) => ({ ...c })), 'update').filter((n) => n.channel === 'sms'); }
    setState((s) => ({ ...s, emergencyAlerts: s.emergencyAlerts.map((x) => (x.id === aid ? { ...closed, notifications: [...x.notifications, ...extra] } : x)), activity: log(s, `SOS alert ${aid} ${status}`) }));
    if (extra.length) runDelivery(closed, extra);
  };
  const clearAlertHistory = () => setState((s) => ({ ...s, emergencyAlerts: s.emergencyAlerts.filter((a) => a.active) }));

  const patient = state.patients.find((p) => p.id === state.selectedPatientId);
  return (
    <Ctx.Provider value={{ ...state, patient, page, navigate, setPatient, toggleReminder, runAudit, resetData, saveMedicine, deleteMedicine, savePrescription, deletePrescription, saveAudit, acknowledgeAudit, setShareProfile, setDoseStatus, saveReminder, deleteReminder, recordRefill, setQuantity, setMinQty, setRefillDays, setRole, saveProfile, deleteProfile, reassignMedicine, reassignPrescription, saveAppointment, deleteAppointment, saveSymptom, deleteSymptom, addChat, clearChat, saveVisit, saveContact, deleteContact, patchContact, setPrimaryContact, setSosPrefs, rememberShare, triggerSos, retryNotification, closeAlert, clearAlertHistory, recordDisposal }}>
      {children}
    </Ctx.Provider>
  );
}

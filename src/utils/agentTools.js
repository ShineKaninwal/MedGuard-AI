// Deterministic "agent tools". Ordinary, testable functions: no randomness, no network, no AI model.
// The audit, the dashboard and the SOS flow all call these, so every screen reports the same result.
// Anything the data does not contain comes back as missing/unknown. Nothing here invents a date, dose, price or match.
import { daysUntil } from './dates.js';
import { estimateSupply, isLow } from './schedule.js';

export const EXPIRY_SOON_DAYS = 60; // same threshold as expiryStatus() in utils/medicine.js

export const norm = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export const strengthOf = (s = '') => norm(s).replace(/\s/g, '');
export const baseName = (s = '') => norm(s).replace(/\b\d+\s?(mg|mcg|ml|g)\b/g, '').replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
export const isValidDate = (d) => !!d && !isNaN(new Date(d));
export const ref = (m) => ({ id: m.id, name: m.name, strength: m.strength || '' });

const bigrams = (s) => { const t = s.replace(/ /g, ''); const o = []; for (let i = 0; i < t.length - 1; i++) o.push(t.slice(i, i + 2)); return o; };
export const dice = (a, b) => {
  const x = bigrams(a), y = bigrams(b); if (!x.length || !y.length) return 0;
  const m = new Map(); x.forEach((g) => m.set(g, (m.get(g) || 0) + 1));
  let hit = 0; y.forEach((g) => { if ((m.get(g) || 0) > 0) { hit++; m.set(g, m.get(g) - 1); } });
  return (2 * hit) / (x.length + y.length);
};

// Whole days from today to the recorded expiry date. Negative = already past. null = no usable date (never guessed).
export const daysRemaining = (iso) => (isValidDate(iso) ? daysUntil(iso) : null);

// Recorded-date check only. Packaging is the authority, which is why every result says "recorded".
export function checkExpiry(meds, soon = EXPIRY_SOON_DAYS) {
  const out = { expired: [], expiring: [], missing: [] };
  meds.forEach((m) => {
    const d = daysRemaining(m.expiry);
    if (d === null) out.missing.push({ medicine: ref(m) });
    else if (d < 0) out.expired.push({ medicine: ref(m), days: -d, date: m.expiry });
    else if (d <= soon) out.expiring.push({ medicine: ref(m), days: d, date: m.expiry });
  });
  return out;
}

// Pairs worth a pharmacist's look. 'high' = same ingredient and strength, 'medium' = same ingredient, 'low' = similar names only.
export function findDuplicates(meds) {
  const pairs = [];
  for (let i = 0; i < meds.length; i++) for (let j = i + 1; j < meds.length; j++) {
    const a = meds[i], b = meds[j], ia = norm(a.generic), ib = norm(b.generic), na = baseName(a.name), nb = baseName(b.name);
    if (ia && ia === ib) {
      const same = strengthOf(a.strength) && strengthOf(a.strength) === strengthOf(b.strength);
      pairs.push({ a: ref(a), b: ref(b), level: same ? 'high' : 'medium', ingredient: a.generic,
        reason: same ? `Same active ingredient (${a.generic}) and same strength (${a.strength})` : `Same active ingredient (${a.generic}); strength differs or is missing` });
    } else if ((na && na === nb) || dice(na, nb) >= 0.75) {
      pairs.push({ a: ref(a), b: ref(b), level: 'low', ingredient: '', reason: 'Names look similar but active ingredients differ or are missing. They may not be interchangeable.' });
    }
  }
  return pairs;
}

// Days of supply left. Only from a fixed schedule the user entered in Reminders. Otherwise { ok:false, reason }.
export const supplyDays = (m, reminders) => estimateSupply(m, reminders);

// Low stock = below the user's own minimum, or (when a schedule exists) about to run out within refillDays.
export function findLowStock(meds, reminders, refillDays = 7) {
  return meds.map((m) => ({ m, est: estimateSupply(m, reminders) })).filter((x) => isLow(x.m, x.est, refillDays))
    .map(({ m, est }) => ({
      medicine: ref(m), qty: m.qty, minQty: m.minQty || 0,
      belowMinimum: m.minQty > 0 && m.qty < m.minQty,
      daysLeft: est.ok ? est.days : null, daysNote: est.ok ? '' : est.reason,
    }));
}

// Prescription list (as entered) against inventory (as entered). "matches" need name AND strength to agree.
export function reconcilePrescription(meds, list) {
  const r = { matches: [], uncertain: [], notFound: [], extras: [] }; const used = new Set();
  list.forEach((it) => {
    const iname = baseName(it.name), istr = strengthOf(it.strength);
    const cands = meds.map((m) => ({ m, nameEq: !!iname && (baseName(m.name) === iname || norm(m.generic) === iname),
      fuzzy: dice(baseName(m.name), iname) >= 0.75 || dice(norm(m.generic), iname) >= 0.75 })).filter((x) => x.nameEq || x.fuzzy);
    cands.forEach((x) => used.add(x.m.id));
    const exact = cands.filter((x) => x.nameEq && istr && strengthOf(x.m.strength) === istr);
    if (exact.length) r.matches.push({ item: it.name, strength: it.strength, medicines: exact.map((x) => ref(x.m)) });
    else if (cands.length) r.uncertain.push({ item: it.name, strength: it.strength, medicines: cands.map((x) => ref(x.m)),
      reason: cands.some((x) => x.nameEq) ? 'Name matches but strength differs or is missing' : 'Only a similar name; not confirmed' });
    else r.notFound.push({ item: it.name, strength: it.strength });
  });
  r.extras = meds.filter((m) => !used.has(m.id)).map(ref);
  return r;
}

// Builds an emergency alert record. Pure: the caller supplies the id, the time and the (simulated) notifications.
// Medical details are included ONLY for fields the user ticked in share.fields; location only if share.location.
export function createEmergencyAlert({ patient, medicines = [], type, share, id, notifications = [], now }) {
  if (!patient || !id) return null;
  const f = share?.fields || {}; const shared = {};
  if (f.age) shared.age = patient.age;
  if (f.conditions) shared.conditions = patient.conditions || [];
  if (f.allergies) shared.allergies = patient.allergies || [];
  if (f.medicines) shared.medicines = medicines.filter((m) => m.patientId === patient.id).map((m) => m.name);
  return { id, patientId: patient.id, patientName: patient.name, patientPhone: patient.phone || '', type, createdAt: now, active: true, status: 'active',
    closedAt: null, location: share?.location ? { status: 'pending' } : { status: 'not_shared' }, shared, notifications, simulated: true };
}

// Which contacts an alert goes to: this patient's contacts, and only the ones the user picked.
export const alertRecipients = (contacts, patientId, contactIds) => contacts.filter((c) => c.patientId === patientId && contactIds.includes(c.id));

// Findings for the dashboard, built from the same tools as the audit so the two screens cannot disagree.
export function summarizeFindings(meds, reminders = [], refillDays = 7) {
  const out = []; const e = checkExpiry(meds);
  e.expired.forEach((x) => out.push({ type: 'expired', level: 'danger', medicineId: x.medicine.id, text: `${x.medicine.name} is ${x.days} days past its recorded expiry date. Check the packaging, then see the Disposal Guide.` }));
  e.expiring.forEach((x) => out.push({ type: 'expiring', level: 'warning', medicineId: x.medicine.id, text: `${x.medicine.name} reaches its recorded expiry date in ${x.days} days.` }));
  findLowStock(meds, reminders, refillDays).forEach((x) => out.push({ type: 'low', level: 'warning', medicineId: x.medicine.id,
    text: `${x.medicine.name} is low: ${x.qty} left${x.minQty ? `, your minimum is ${x.minQty}` : ''}${x.daysLeft !== null ? `, about ${x.daysLeft} days at the entered schedule` : ''}.` }));
  findDuplicates(meds).filter((d) => d.level !== 'low').forEach((d) => out.push({ type: 'duplicate', level: 'warning', medicineId: d.a.id,
    text: `${d.a.name} and ${d.b.name} share an active ingredient (${d.ingredient}). Ask a pharmacist to review; do not change how either is taken.` }));
  return out;
}

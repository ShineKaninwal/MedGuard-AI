// Waste analytics. Everything here is computed from the inventory, reminders and disposal records saved in this browser.
// Nothing is estimated from outside data, and no environmental impact is calculated: that needs verified data this prototype does not have.
//
// Two rules keep the numbers honest:
//  1. Units are never added across medicines (tablets, ml, puffs and bottles are not the same thing). Units are used per medicine only.
//  2. A "projected leftover at expiry" exists only when the user has a fixed schedule in Reminders. Otherwise it is "not estimable", never guessed.
import { daysUntil, todayKey } from './dates';
import { estimateSupply, isLow } from './schedule';

export const NEAR_DAYS = 60;      // same threshold as expiryStatus() in utils/medicine.js
export const HORIZON_DAYS = 180;  // schedules and prescriptions change, so leftover is only projected this far ahead

export const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const cost = (m) => (Number(m.cost) > 0 ? Number(m.cost) : 0);
// Value per unit of the stock on hand, from the value the user entered. Null when unknown.
export const unitValue = (m) => (Number(m.qty) > 0 && cost(m) > 0 ? cost(m) / Number(m.qty) : null);

// Assess one medicine. `state` is expired, near (within NEAR_DAYS), ok, or unknown (no expiry date recorded).
export function assess(m, reminders, refillDays = 7) {
  const est = estimateSupply(m, reminders);
  const uv = unitValue(m);
  const base = { m, est, unitValue: uv, low: isLow(m, est, refillDays) };
  if (!m.expiry) return { ...base, days: null, state: 'unknown', leftover: null, leftoverValue: null, counted: false };
  const days = daysUntil(m.expiry);
  const state = days < 0 ? 'expired' : days <= NEAR_DAYS ? 'near' : 'ok';
  const qty = Number(m.qty) || 0;
  let leftover = null; // units expected to remain on the expiry date
  if (state === 'expired') leftover = qty;
  else if (est.ok) leftover = Math.max(0, Math.round(qty - est.perDay * days));
  const counted = leftover != null && leftover > 0 && (state === 'expired' || days <= HORIZON_DAYS);
  return { ...base, days, state, leftover, leftoverValue: uv != null && leftover != null ? leftover * uv : null, counted };
}

export function summarize(medicines, reminders, refillDays = 7) {
  const rows = medicines.map((m) => assess(m, reminders, refillDays));
  const sum = (arr, f) => arr.reduce((t, r) => t + (f(r) || 0), 0);
  const expired = rows.filter((r) => r.state === 'expired');
  const near = rows.filter((r) => r.state === 'near');
  const projected = rows.filter((r) => r.state !== 'expired' && r.counted);   // scheduled, with leftover expected before HORIZON_DAYS
  const unknownNear = near.filter((r) => !r.est.ok);                          // nearing expiry, but no schedule to estimate from
  const expiredValue = sum(expired, (r) => r.leftoverValue);
  const projectedValue = sum(projected, (r) => r.leftoverValue);
  return {
    rows, expired, near, projected, unknownNear, count: rows.length,
    stockValue: sum(rows, (r) => cost(r.m)),
    unpriced: rows.filter((r) => !cost(r.m)).length,
    nearValue: sum(near, (r) => cost(r.m)),
    expiredValue, projectedValue, potentialValue: expiredValue + projectedValue,
    unknownNearValue: sum(unknownNear, (r) => cost(r.m)),
    unpricedAtRisk: [...expired, ...projected].filter((r) => r.unitValue == null).length,
    lowCount: rows.filter((r) => r.low).length,
  };
}

export const BUCKETS = [
  { id: 'expired', label: 'Expired', test: (d) => d < 0, tone: 'bg-red-500' },
  { id: '30', label: '0 to 30 days', test: (d) => d >= 0 && d <= 30, tone: 'bg-amber-500' },
  { id: '60', label: '31 to 60 days', test: (d) => d > 30 && d <= 60, tone: 'bg-amber-400' },
  { id: '90', label: '61 to 90 days', test: (d) => d > 60 && d <= 90, tone: 'bg-teal-400' },
  { id: '180', label: '91 to 180 days', test: (d) => d > 90 && d <= 180, tone: 'bg-teal-500' },
  { id: '365', label: '181 to 365 days', test: (d) => d > 180 && d <= 365, tone: 'bg-teal-600' },
  { id: 'later', label: 'More than a year', test: (d) => d > 365, tone: 'bg-teal-700' },
];
export const bucketCounts = (rows) => BUCKETS.map((b) => ({ ...b, rows: rows.filter((r) => r.days != null && b.test(r.days)) }));

const addMonth = (key, n) => { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); };
const monthLabel = (k) => new Date(`${k}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' });

// When the medicines currently in the inventory reach their expiry date: already expired, each of the next `months` months, then later.
// This is a forecast from today's inventory, not a history of past waste.
export function monthlyExpiry(rows, months = 12) {
  const start = todayKey().slice(0, 7);
  const bins = [{ key: 'expired', label: 'Expired', rows: [] }, ...Array.from({ length: months }, (_, i) => { const k = addMonth(start, i); return { key: k, label: monthLabel(k), rows: [] }; }), { key: 'later', label: 'Later', rows: [] }];
  rows.forEach((r) => {
    if (r.state === 'unknown') return;
    if (r.state === 'expired') { bins[0].rows.push(r); return; }
    (bins.find((b) => b.key === r.m.expiry.slice(0, 7)) || bins[bins.length - 1]).rows.push(r);
  });
  return bins.map((b) => ({ key: b.key, label: b.label, count: b.rows.length, names: b.rows.map((r) => r.m.name), near: b.rows.some((r) => r.state === 'near'), expired: b.key === 'expired', value: b.rows.reduce((t, r) => t + cost(r.m), 0) }));
}

export function byMember(rows, patients) {
  return patients.map((p) => {
    const mine = rows.filter((r) => r.m.patientId === p.id);
    return { patient: p, total: mine.length, expired: mine.filter((r) => r.state === 'expired').length, near: mine.filter((r) => r.state === 'near').length,
      atRiskValue: mine.filter((r) => r.state === 'expired' || r.counted).reduce((t, r) => t + (r.leftoverValue || 0), 0) };
  }).filter((x) => x.total > 0);
}

// Records the user made when they marked a medicine as disposed of (Disposal Guide page).
export function disposalStats(disposals = []) {
  return { count: disposals.length, value: disposals.reduce((t, d) => t + (Number(d.value) || 0), 0), expired: disposals.filter((d) => d.reason === 'expired').length };
}

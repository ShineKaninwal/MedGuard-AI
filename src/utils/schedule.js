import { todayKey, daysFromNow, addDays } from './dates.js';

export const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const STATUSES = [
  ['taken', 'Taken', 'bg-teal-600 text-white'], ['not_taken', 'Not taken', 'bg-red-600 text-white'],
  ['skipped', 'Skipped', 'bg-amber-400 text-navy-900'], ['not_confirmed', 'Not confirmed', 'bg-slate-500 text-white'],
];
const dow = (k) => new Date(`${k}T00:00:00Z`).getUTCDay();
export const nowHM = () => new Date().toTimeString().slice(0, 5);
export const occursOn = (r, k) => r.active !== false && r.type !== 'as-needed' && !!r.time && r.days.includes(dow(k)) && k >= (r.createdDate || '0000');
export const dosesOn = (reminders, k) => reminders.filter((r) => occursOn(r, k)).sort((a, b) => a.time.localeCompare(b.time));
export const logFor = (logs, rid, k) => logs.find((l) => l.reminderId === rid && l.date === k);
export const statusOf = (logs, rid, k) => logFor(logs, rid, k)?.status || 'pending';
export const isPast = (k, time) => k < todayKey() || (k === todayKey() && time <= nowHM());
// A dose needs confirmation when its time has passed and nobody confirmed it. It is never counted as missed.
export const needsConfirm = (logs, r, k) => isPast(k, r.time) && ['pending', 'not_confirmed'].includes(statusOf(logs, r.id, k));

export function summarize(reminders, logs, patientId, n) {
  const mine = reminders.filter((r) => r.patientId === patientId);
  const days = Array.from({ length: n }, (_, i) => daysFromNow(i - n + 1));
  const rows = days.map((k) => {
    const row = { date: k, taken: 0, not_taken: 0, skipped: 0, unconfirmed: 0 };
    logs.filter((l) => l.patientId === patientId && l.date === k && l.status !== 'not_confirmed').forEach((l) => row[l.status]++);
    dosesOn(mine, k).forEach((r) => { if (isPast(k, r.time) && ['pending', 'not_confirmed'].includes(statusOf(logs, r.id, k))) row.unconfirmed++; });
    return row;
  });
  const total = rows.reduce((t, r) => ({ taken: t.taken + r.taken, not_taken: t.not_taken + r.not_taken, skipped: t.skipped + r.skipped, unconfirmed: t.unconfirmed + r.unconfirmed }), { taken: 0, not_taken: 0, skipped: 0, unconfirmed: 0 });
  return { rows, total };
}

// Estimate only from a user-set fixed schedule. As-needed or missing schedules give no estimate.
export function estimateSupply(m, reminders) {
  const rs = reminders.filter((r) => r.medicineId === m.id && r.active !== false);
  if (rs.some((r) => r.type === 'as-needed')) return { ok: false, reason: 'As-needed use varies, so no estimate is made' };
  const fixed = rs.filter((r) => r.type === 'fixed' && r.time && Number(r.units) > 0 && r.days.length);
  if (!fixed.length) return { ok: false, reason: 'No fixed schedule in Reminders' };
  if (typeof m.qty !== 'number') return { ok: false, reason: 'Quantity unknown' };
  const perDay = fixed.reduce((s, r) => s + (Number(r.units) * r.days.length) / 7, 0);
  const days = Math.floor(m.qty / perDay);
  return { ok: true, days, date: addDays(todayKey(), days), perDay };
}
export const isLow = (m, est, refillDays) => (m.minQty > 0 && m.qty < m.minQty) || (est.ok && est.days <= refillDays);

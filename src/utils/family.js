import { todayKey } from './dates';
import { dosesOn, statusOf, needsConfirm, estimateSupply, isLow } from './schedule';
import { expiryStatus } from './medicine';

export const byDT = (a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`);

// Reads the same medicine, reminder and log data as every other page.
export function patientStats(s, pid) {
  const k = todayKey();
  const meds = s.medicines.filter((m) => m.patientId === pid);
  const todays = dosesOn(s.reminders.filter((r) => r.patientId === pid), k);
  return {
    meds, todays,
    pending: todays.filter((r) => needsConfirm(s.doseLogs, r, k)),
    taken: todays.filter((r) => statusOf(s.doseLogs, r.id, k) === 'taken').length,
    low: meds.map((m) => ({ m, est: estimateSupply(m, s.reminders) })).filter((x) => isLow(x.m, x.est, s.settings.refillDays)),
    expiring: meds.filter((m) => ['expired', 'expiring'].includes(expiryStatus(m.expiry).key)),
    appts: s.appointments.filter((a) => a.patientId === pid && a.date >= k).sort(byDT),
    alerts: (s.emergencyAlerts || []).filter((a) => a.patientId === pid && a.active),
  };
}

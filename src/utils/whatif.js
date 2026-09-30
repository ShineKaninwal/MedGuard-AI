// What-if inventory simulator. Pure functions: they never touch saved data.
// Allowed hypotheticals change STOCK only. The schedule is read from Reminders as it is; doses and treatment cannot be changed or stopped here.
import { assess, summarize, unitValue } from './waste';

export const MAX_QTY = 100000;
export const KINDS = [
  { id: 'refill', label: 'Add a refill', hint: 'Units added to the stock you have now', field: 'Units in the refill' },
  { id: 'setQty', label: 'Change quantity on hand', hint: 'For example, if a recount finds a different number', field: 'Quantity on hand' },
  { id: 'dispose', label: 'Set aside expired stock', hint: 'Only for medicines already past their expiry date', field: null },
];
export const kindLabel = (id) => KINDS.find((k) => k.id === id)?.label || id;

// Returns an error message, or '' when the hypothetical is allowed.
export function validateChange(kind, value, med) {
  if (!med) return 'Choose a medicine.';
  if (kind === 'dispose') return med.expiry && new Date(med.expiry) < new Date(new Date().toDateString()) ? '' : 'Only medicines that are already expired can be set aside.';
  if (value === '' || value === null || Number.isNaN(Number(value))) return 'Enter a number.';
  const n = Number(value);
  if (!Number.isInteger(n)) return 'Enter a whole number.';
  if (kind === 'refill' && n < 1) return 'A refill must add at least 1 unit.';
  if (kind === 'setQty' && n < 0) return 'Quantity cannot be negative.';
  if (n > MAX_QTY) return `Enter ${MAX_QTY.toLocaleString('en-IN')} or fewer.`;
  return '';
}

// Applies the hypothetical changes, in order, to COPIES of the medicines. Value on hand is scaled with the same value per unit as today.
export function applyChanges(medicines, changes) {
  const sim = new Map(medicines.map((m) => [m.id, { ...m }]));
  changes.forEach((c) => {
    const m = sim.get(c.medicineId); if (!m) return;
    const uv = unitValue(m);
    if (c.kind === 'refill') m.qty = Number(m.qty) + c.value;
    else if (c.kind === 'setQty') m.qty = c.value;
    else if (c.kind === 'dispose') m.qty = 0;
    if (uv != null) m.cost = uv * m.qty; else if (m.qty === 0) m.cost = 0;
  });
  return medicines.map((m) => sim.get(m.id));
}

export function simulate(medicines, reminders, changes, refillDays) {
  const simMeds = applyChanges(medicines, changes);
  const byId = new Map(simMeds.map((m) => [m.id, m]));
  const touched = [...new Set(changes.map((c) => c.medicineId))].map((id) => {
    const real = medicines.find((m) => m.id === id);
    return real ? { id, real: assess(real, reminders, refillDays), sim: assess(byId.get(id), reminders, refillDays), changes: changes.filter((c) => c.medicineId === id) } : null;
  }).filter(Boolean);
  return { touched, real: summarize(medicines, reminders, refillDays), sim: summarize(simMeds, reminders, refillDays) };
}

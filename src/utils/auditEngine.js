// Audit pipeline. Every step calls a deterministic tool from agentTools.js on the saved app data.
// There is no AI model in this file and nothing is invented: when data is missing, the step says so.
import { checkExpiry, findDuplicates, findLowStock, reconcilePrescription, isValidDate, ref, EXPIRY_SOON_DAYS as SOON } from './agentTools.js';

export const STEP_META = [
  { id: 's1', agent: 'Inventory Agent', action: 'Retrieve the patient\'s medicine inventory' },
  { id: 's2', agent: 'Prescription Agent', action: 'Retrieve the selected prescription list' },
  { id: 's3', agent: 'Validation Agent', action: 'Validate medicine data fields' },
  { id: 's4', agent: 'Expiry Agent', action: 'Compare recorded expiry dates with today' },
  { id: 's9', agent: 'Stock Agent', action: 'Check quantity against your minimum and schedule' },
  { id: 's5', agent: 'Duplicate Agent', action: 'Compare ingredient, strength and name' },
  { id: 's6', agent: 'Reconciliation Agent', action: 'Compare inventory with the prescription list' },
  { id: 's7', agent: 'Uncertainty Agent', action: 'Collect missing and uncertain data' },
  { id: 's8', agent: 'Report Agent', action: 'Generate the audit report' },
];

const plural = (n, w, many = `${w}s`) => `${n} ${n === 1 ? w : many}`;

const RUN = {
  s1: (c) => { c.meds = c.state.medicines.filter((m) => m.patientId === c.patient.id);
    return { status: c.meds.length ? 'done' : 'warning', result: `Retrieved ${plural(c.meds.length, 'medicine')} for ${c.patient.name}` }; },
  s2: (c) => { c.rx = c.state.prescriptions.find((p) => p.id === c.rxId) || null; c.list = c.rx ? c.rx.items : [];
    return c.rx ? { status: 'done', result: `Loaded prescription from ${c.rx.doctor || 'unknown doctor'} with ${plural(c.list.length, 'item')}` }
      : { status: 'warning', result: 'No prescription list selected. Reconciliation will be skipped.' }; },
  s3: (c) => {
    c.missing = c.meds.map((m) => { const f = [];
      if (!m.generic?.trim()) f.push('active ingredient'); if (!m.strength?.trim()) f.push('strength');
      if (!isValidDate(m.expiry)) f.push('expiry date'); if (typeof m.qty !== 'number' || m.qty < 0) f.push('quantity');
      return { medicine: ref(m), fields: f }; }).filter((x) => x.fields.length);
    c.unverified = c.meds.filter((m) => m.verified !== 'verified').map(ref);
    c.rxMissing = c.list.filter((i) => !i.strength?.trim()).map((i) => i.name);
    const n = c.missing.length + c.rxMissing.length;
    return { status: n ? 'warning' : 'done', result: n ? `${plural(c.missing.length, 'medicine')} and ${plural(c.rxMissing.length, 'list item')} have missing fields` : 'All required fields present' }; },
  s4: (c) => { c.expiry = checkExpiry(c.meds); const e = c.expiry; const n = e.expired.length + e.expiring.length + e.missing.length;
    return { status: n ? 'warning' : 'done', result: `${e.expired.length} past recorded expiry, ${e.expiring.length} within ${SOON} days, ${e.missing.length} without a date` }; },
  s9: (c) => { c.lowStock = findLowStock(c.meds, c.state.reminders || [], c.state.settings?.refillDays ?? 7);
    const noEst = c.lowStock.filter((x) => x.daysLeft === null).length;
    return { status: c.lowStock.length ? 'warning' : 'done',
      result: `${plural(c.lowStock.length, 'medicine')} low${c.lowStock.length && noEst ? `; days left not estimable for ${noEst} (no fixed schedule)` : ''}` }; },
  s5: (c) => { c.dups = findDuplicates(c.meds);
    return { status: c.dups.length ? 'warning' : 'done', result: `${plural(c.dups.length, 'possible duplicate pair')} flagged for review` }; },
  s6: (c) => {
    if (!c.rx) { c.recon = null; return { status: 'skipped', result: 'Skipped: no prescription list supplied' }; }
    const r = c.recon = reconcilePrescription(c.meds, c.list);
    return { status: r.notFound.length || r.uncertain.length ? 'warning' : 'done', result: `${r.matches.length} possible matches, ${r.uncertain.length} uncertain, ${r.notFound.length} not found` }; },
  s7: (c) => {
    const u = [];
    if (c.unverified.length) u.push(`${plural(c.unverified.length, 'medicine')} not yet verified against a label or prescription. Flags for these rest on data nobody has checked.`);
    if (c.missing.length) u.push(`${plural(c.missing.length, 'medicine')} with missing fields. Checks that need those fields could not be run for them.`);
    if (c.lowStock.some((x) => x.daysLeft === null)) u.push('Days of supply are shown only where you set a fixed schedule in Reminders. Elsewhere the app does not guess.');
    if (c.recon?.uncertain.length) u.push(`${plural(c.recon.uncertain.length, 'prescription item')} with uncertain matches. A similar name is not a confirmed match.`);
    if (c.rx?.source === 'scan') u.push('This prescription was entered through the simulated scanner, so its text may not match any real document.');
    if (!c.rx) u.push('No prescription list was supplied, so nothing was compared.');
    u.push('Expiry results use the dates you recorded. The printed date on the packaging is the one that counts.');
    c.uncertainty = u; return { status: 'warning', result: `${plural(u.length, 'uncertainty', 'uncertainties')} recorded` }; },
  s8: (c) => {
    // Every action is a "check or ask" step for a person. None of them changes a medicine, a dose or a schedule.
    const A = []; const add = (priority, text, page, pageLabel) => A.push({ id: `a${A.length + 1}`, priority, text, page, pageLabel });
    c.expiry.expired.forEach((x) => add('high', `Check the printed expiry date on the ${x.medicine.name} packaging, and ask a pharmacist about safe disposal.`, 'disposal', 'Disposal Guide'));
    c.expiry.expiring.forEach((x) => add('medium', `Check the expiry date on the ${x.medicine.name} packaging (about ${x.days} days left by the recorded date).`, 'inventory', 'Inventory'));
    c.expiry.missing.forEach((x) => add('medium', `Find the expiry date for ${x.medicine.name} on its packaging and add it.`, 'inventory', 'Inventory'));
    c.dups.forEach((d) => add('high', `Ask a pharmacist or doctor to review ${d.a.name} and ${d.b.name}. Do not change how either is taken without their advice.`));
    c.lowStock.forEach((x) => add('medium', `${x.medicine.name} is low (${x.qty} left). Decide with your doctor or pharmacist whether a refill is needed. The app never orders anything.`, 'refill', 'Refill Planner'));
    c.missing.forEach((x) => add('medium', `Add the missing ${x.fields.join(', ')} for ${x.medicine.name} from its label.`, 'inventory', 'Inventory'));
    c.recon?.notFound.forEach((x) => add('medium', `Ask the prescriber or pharmacist whether ${x.item} is still current and whether it is meant to be in stock.`));
    c.recon?.uncertain.forEach((x) => add('medium', `Compare ${x.item} with ${x.medicines.map((m) => m.name).join(' / ')} on the label. The match is not confirmed.`));
    if (c.unverified.length) add('low', 'Mark medicines as verified only after checking them against their label or prescription.', 'inventory', 'Inventory');
    add('low', 'Share this report with a pharmacist or doctor for review.');
    c.actions = A; return { status: 'done', result: `Report generated with ${plural(A.length, 'verification action')}` }; },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mkReport = (c, steps, incomplete) => {
  const e = c.expiry || { expired: [], expiring: [], missing: [] };
  const findings = e.expired.length + e.expiring.length + e.missing.length + (c.dups || []).length + (c.lowStock || []).length + (c.missing || []).length;
  return { id: `au${Date.now()}`, ts: Date.now(), patientId: c.patient.id, patientName: c.patient.name, engine: 'rule-based',
    rx: c.rx ? { id: c.rx.id, doctor: c.rx.doctor, date: c.rx.date, source: c.rx.source } : null,
    checked: (c.meds || []).length, expiry: e, duplicates: c.dups || [], lowStock: c.lowStock || [], missing: c.missing || [], unverified: c.unverified || [],
    recon: c.recon || null, rxMissing: c.rxMissing || [], uncertainty: c.uncertainty || [], actions: c.actions || [], findings,
    incomplete, failedSteps: steps.filter((s) => s.status === 'error').map((s) => s.agent), confirmation: null };
};

// pace = a short pause between steps so a person can follow the timeline. It does not change any result.
// Each step's durationMs is measured around the real call. A step that throws is shown as an error, never as success.
export async function runAuditPipeline(state, patient, rxId, onStep, pace = 250) {
  const c = { state, patient, rxId, meds: [], list: [] };
  const steps = [];
  for (const meta of STEP_META) {
    onStep({ ...meta, status: 'running', ts: Date.now() });
    await sleep(pace);
    const t0 = performance.now(); let out;
    try { out = RUN[meta.id](c); } catch (e) { out = { status: 'error', result: `Step failed: ${e.message}. Results that depend on it are missing.` }; }
    const step = { ...meta, ...out, ts: Date.now(), durationMs: Math.max(0, Math.round(performance.now() - t0)) }; steps.push(step); onStep(step);
  }
  return { steps, report: mkReport(c, steps, steps.some((s) => s.status === 'error')) };
}

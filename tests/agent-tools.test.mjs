// Unit tests for the deterministic agent tools and the audit pipeline. Plain Node, no extra packages:  npm test
import assert from 'node:assert/strict';
import { daysFromNow } from '../src/utils/dates.js';
import { daysRemaining, checkExpiry, findDuplicates, findLowStock, reconcilePrescription, createEmergencyAlert, alertRecipients, summarizeFindings } from '../src/utils/agentTools.js';
import { runAuditPipeline, STEP_META } from '../src/utils/auditEngine.js';
import { CAMERA_CAPTURE_APPROVED } from '../src/config/policy.js';

let n = 0; const t = (name, fn) => Promise.resolve().then(fn).then(() => { n++; console.log(`ok  ${name}`); }, (e) => { console.error(`FAIL ${name}\n${e.stack}`); process.exitCode = 1; });

const med = (o) => ({ patientId: 'p1', generic: '', strength: '', form: 'Tablet', qty: 30, minQty: 10, verified: 'verified', ...o });
const meds = [
  med({ id: 'a', name: 'Paracetamol 500mg', generic: 'Paracetamol', strength: '500mg', expiry: daysFromNow(25) }),
  med({ id: 'b', name: 'Dolo 650', generic: 'Paracetamol', strength: '650mg', expiry: daysFromNow(300) }),
  med({ id: 'c', name: 'Cough Syrup DX', generic: 'Dextromethorphan', strength: '10ml', qty: 1, minQty: 1, expiry: daysFromNow(-12) }),
  med({ id: 'd', name: 'Amlodipine 5mg', generic: 'Amlodipine', strength: '5mg', qty: 9, minQty: 14, expiry: daysFromNow(140) }),
  med({ id: 'e', name: 'Mystery Tonic', generic: '', strength: '', expiry: '' }),
];

await t('daysRemaining: real dates count, blank or invalid dates are null (never guessed)', () => {
  assert.equal(daysRemaining(daysFromNow(10)), 10); assert.equal(daysRemaining(daysFromNow(-3)), -3);
  assert.equal(daysRemaining(''), null); assert.equal(daysRemaining('not a date'), null); assert.equal(daysRemaining(undefined), null);
});
await t('checkExpiry: expired, expiring within 60 days, and missing are separated', () => {
  const e = checkExpiry(meds);
  assert.deepEqual(e.expired.map((x) => [x.medicine.id, x.days]), [['c', 12]]);
  assert.deepEqual(e.expiring.map((x) => x.medicine.id), ['a']);
  assert.deepEqual(e.missing.map((x) => x.medicine.id), ['e']);
});
await t('findDuplicates: same ingredient flagged; differing strength is "medium", not "high"', () => {
  const d = findDuplicates(meds); assert.equal(d.length, 1);
  assert.equal(d[0].level, 'medium'); assert.deepEqual([d[0].a.id, d[0].b.id], ['a', 'b']);
  assert.equal(findDuplicates([meds[0], { ...meds[1], strength: '500mg' }])[0].level, 'high');
});
await t('findDuplicates: an empty ingredient never counts as a match', () => {
  assert.equal(findDuplicates([med({ id: 'x', name: 'Alpha', generic: '' }), med({ id: 'y', name: 'Zed', generic: '' })]).length, 0);
});
await t('findLowStock: below minimum is flagged; days left are null when there is no schedule', () => {
  const l = findLowStock(meds, [], 7); assert.deepEqual(l.map((x) => x.medicine.id), ['d']);
  assert.equal(l[0].belowMinimum, true); assert.equal(l[0].daysLeft, null); assert.match(l[0].daysNote, /No fixed schedule/);
});
await t('findLowStock: with a fixed schedule, days left come from quantity / daily use', () => {
  const rem = [{ id: 'r1', medicineId: 'a', active: true, type: 'fixed', time: '08:00', units: 2, days: [0, 1, 2, 3, 4, 5, 6] }];
  const l = findLowStock([med({ id: 'a', name: 'X', qty: 12, minQty: 5, expiry: daysFromNow(90) })], rem, 7);
  assert.equal(l.length, 1); assert.equal(l[0].daysLeft, 6); assert.equal(l[0].belowMinimum, false);
});
await t('reconcilePrescription: match needs name AND strength; similar names are uncertain; absent items are not found', () => {
  const r = reconcilePrescription(meds, [{ name: 'Amlodipine', strength: '5 mg' }, { name: 'Paracetamol', strength: '1000 mg' }, { name: 'Amoxicillin', strength: '250 mg' }]);
  assert.equal(r.matches.length, 1); assert.equal(r.matches[0].medicines[0].id, 'd');
  assert.equal(r.uncertain.length, 1); assert.equal(r.uncertain[0].item, 'Paracetamol');
  assert.deepEqual(r.notFound.map((x) => x.item), ['Amoxicillin']);
  assert.ok(r.extras.some((m) => m.id === 'c'));
});
await t('createEmergencyAlert: medical details only when ticked, location only when requested, always marked simulated', () => {
  const p = { id: 'p1', name: 'Ravi Kumar', age: 62, conditions: ['Diabetes'], allergies: ['Penicillin'], phone: '+91 90000 10001' };
  const a = createEmergencyAlert({ patient: p, medicines: meds, type: 'medical', share: { location: false, fields: {} }, id: 'SOS-1', notifications: [], now: 1 });
  assert.deepEqual(a.shared, {}); assert.equal(a.location.status, 'not_shared'); assert.equal(a.simulated, true); assert.equal(a.active, true);
  const b = createEmergencyAlert({ patient: p, medicines: meds, type: 'medical', share: { location: true, fields: { allergies: true, medicines: true } }, id: 'SOS-2', notifications: [], now: 1 });
  assert.deepEqual(Object.keys(b.shared).sort(), ['allergies', 'medicines']); assert.equal(b.location.status, 'pending'); assert.equal(b.shared.medicines.length, 5);
  assert.equal(createEmergencyAlert({ patient: null, id: 'x' }), null);
  assert.deepEqual(alertRecipients([{ id: 'c1', patientId: 'p1' }, { id: 'c2', patientId: 'p2' }, { id: 'c3', patientId: 'p1' }], 'p1', ['c1', 'c2']).map((c) => c.id), ['c1']);
});
await t('summarizeFindings feeds the dashboard from the same tools', () => {
  const f = summarizeFindings(meds, [], 7); const types = f.map((x) => x.type).sort();
  assert.deepEqual(types, ['duplicate', 'expired', 'expiring', 'low']);
});
await t('audit pipeline: nine real steps, structured actions, human review not yet recorded', async () => {
  const shown = [];
  const state = { medicines: meds, prescriptions: [{ id: 'rx', patientId: 'p1', doctor: 'Dr. Test', date: daysFromNow(-2), source: 'manual', items: [{ name: 'Amlodipine', strength: '5 mg' }] }], reminders: [], settings: { refillDays: 7 } };
  const res = await runAuditPipeline(state, { id: 'p1', name: 'Ravi' }, 'rx', (s) => shown.push(s), 0);
  assert.equal(res.steps.length, STEP_META.length); assert.equal(res.steps.length, 9);
  assert.ok(res.steps.every((s) => typeof s.durationMs === 'number'));
  const r = res.report; assert.equal(r.incomplete, false); assert.equal(r.engine, 'rule-based'); assert.equal(r.confirmation, null);
  assert.equal(r.expiry.expired.length, 1); assert.equal(r.lowStock.length, 1); assert.equal(r.duplicates.length, 1); assert.equal(r.recon.matches.length, 1);
  assert.ok(r.actions.length > 3 && r.actions.every((a) => a.id && a.text && ['high', 'medium', 'low'].includes(a.priority)));
  assert.ok(r.uncertainty.some((u) => /recorded/.test(u)));
  assert.ok(shown.filter((s) => s.status === 'running').length === 9);
});
await t('audit pipeline: no prescription => reconciliation is "skipped", not "done"', async () => {
  const res = await runAuditPipeline({ medicines: meds, prescriptions: [], reminders: [], settings: {} }, { id: 'p1', name: 'Ravi' }, '', () => {}, 0);
  assert.equal(res.steps.find((s) => s.id === 's6').status, 'skipped'); assert.equal(res.report.recon, null);
});
await t('audit pipeline: a failing step is reported as an error and the report is marked incomplete', async () => {
  const res = await runAuditPipeline({ medicines: null, prescriptions: [], reminders: [], settings: {} }, { id: 'p1', name: 'Ravi' }, '', () => {}, 0);
  assert.ok(res.steps.some((s) => s.status === 'error')); assert.equal(res.report.incomplete, true); assert.ok(res.report.failedSteps.length > 0);
});
await t('camera capture stays disabled unless the organizers approve it', () => { assert.equal(CAMERA_CAPTURE_APPROVED, false); });

console.log(process.exitCode ? '\nSome tests FAILED' : `\nAll ${n} tests passed`);

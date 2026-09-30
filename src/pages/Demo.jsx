import { useState } from 'react';
import { PlayCircle, RotateCcw, ArrowRight, CheckCircle2, Circle, FlaskConical } from 'lucide-react';
import { Card, Badge, Notice, PageHeader } from '../components/ui';
import { useConfirm, useToast } from '../components/Feedback';
import { useApp } from '../context/AppContext';

// Everything in this script uses the built-in fictional sample family (Ravi, Meena and Arjun Kumar). Nothing here is real patient data.
// `sim` names what is simulated in that step, so it can be said out loud. Keep the seconds adding up to 300.
const STEPS = [
  { id: 'dashboard', page: 'dashboard', title: 'Dashboard', secs: 30,
    show: ['Ravi Kumar is selected. Point to today\'s reminders, low stock and expiry counters.', 'The red SOS panel is always one tap away.', 'The waste card at the bottom is worked out from the real inventory, not typed in.'],
    say: 'One place to see a family\'s medicines, doses, refills and emergencies.', sim: 'The three oldest entries in the activity feed are labelled sample entries.' },
  { id: 'inventory', page: 'inventory', title: 'Medicine inventory', secs: 40,
    show: ['Cough Syrup DX is already expired (red). Paracetamol 500mg and Dolo 650 share an ingredient.', 'Select Add medicine. Enter "Demo Multivitamin", ingredient "Multivitamin", quantity 30, an expiry date about 3 weeks away, value ₹120. Save.', 'Filter by Expiring soon to see it.'],
    say: 'Adding a medicine takes seconds, and every screen updates straight away.', sim: null },
  { id: 'audit', page: 'audit', title: 'AI medicine audit', secs: 50,
    show: ['Choose Ravi Kumar and run the audit. Watch the steps complete.', 'Read out the findings: the expired syrup, the medicines expiring soon and the duplicate paracetamol.', 'Optional, if time allows: Prescriptions, Scan prescription, "Use a sample prescription image", choose Meena Kumar, check the low-confidence fields and save.'],
    say: 'The audit checks expiry dates, duplicates and missing data, and says clearly when it is unsure.', sim: 'The "agents" are fixed rule-based checks, not machine learning. Prescription scanning is simulated: it shows sample text and does not read the image.' },
  { id: 'tracker', page: 'tracker', title: 'Medication tracking', secs: 40,
    show: ['Open the tracker and mark a dose as Taken. Doses that nobody confirmed are never counted as missed.', 'Open the Supply and Refill Planner. Amlodipine is low. Record a refill of 30 and watch the days of supply update.'],
    say: 'Adherence and supply are worked out from the schedule the family set, never guessed.', sim: null },
  { id: 'caregiver', page: 'caregiver', title: 'Caregiver dashboard', secs: 40,
    show: ['See the whole family at once: doses, low stock, expiry and appointments.', 'Leave this tab open. The SOS alert will appear here in the next step.'],
    say: 'A caregiver sees who needs attention without asking each person.', sim: 'Caregiver and patient are a demo switch in the sidebar. There is no login or real access control.' },
  { id: 'sos', page: 'sos', title: 'Emergency SOS', secs: 50,
    show: ['Select the red SOS button. Nothing is sent yet. Pick an emergency type; location and medical details are off unless ticked.', 'Press and hold Send (or tap twice). The SOS ACTIVE screen appears with call buttons for 112 and 108.', 'Go back to the Caregiver dashboard: the alert is shown there. Then mark it resolved.'],
    say: 'The call buttons never depend on the alert, and the app never claims a call connected.', sim: 'SMS and push notifications to contacts are simulated (Simulated sent, Pending or Failed, with Retry). No message leaves the browser. The contacts and phone numbers are fictional.' },
  { id: 'waste', page: 'waste', title: 'Sustainability dashboard', secs: 50,
    show: ['Waste Analytics: expired, nearing expiry, total inventory, potential waste and the 12-month expiry forecast, all from the real inventory.', 'Open "How this is calculated" and point out the "not estimable" line: it does not guess.', 'Disposal Guide: mark the expired syrup as disposed and watch it appear under recorded disposals.', 'What-If Simulator: try an example refill and compare the dashed SIMULATED panel with the saved data.'],
    say: 'Simple numbers a family can act on. No environmental-impact claims, because that needs data we do not have.', sim: 'What-If results are simulated and never saved. Price Comparison uses made-up demo prices. Value figures come from what you typed in.' },
];
const TOTAL = STEPS.reduce((t, s) => t + s.secs, 0);
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const REAL = [
  'Inventory, prescriptions, reminders, dose tracking, refill estimates, family profiles, appointments and emergency contacts. All stored in this browser.',
  'The audit findings (expiry, duplicates, missing data) and the waste, disposal and what-if calculations.',
  'Optional location sharing during an SOS, if you tick it and allow it in the browser.',
];
const SIMULATED = [
  'Prescription scanning (sample text, image is not read) and the "AI agents" (fixed rule-based checks).',
  'SOS notifications to contacts. No SMS or push message is sent. Calls use your phone\'s dialer through tel: links.',
  'Caregiver versus patient (a demo switch, no login) and the AI Health Assistant\'s replies (labelled pre-written samples unless a service is configured).',
  'Price Comparison prices (fictional) and What-If results (never saved).',
];

export default function Demo() {
  const { navigate, resetData } = useApp();
  const confirm = useConfirm(); const toast = useToast();
  const [done, setDone] = useState({});
  const count = Object.values(done).filter(Boolean).length;

  const fresh = async () => {
    const ok = await confirm({ title: 'Start a fresh demo?', confirmLabel: 'Reset to sample data', tone: 'navy',
      body: 'This replaces everything in this browser with the original fictional sample data, so the demo starts from a known state.' });
    if (ok) { resetData(); setDone({}); toast('Sample data restored. Ready to demo.'); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={PlayCircle} title="Demo Guide" subtitle={`A ${fmt(TOTAL)} walkthrough of MedGuard AI using fictional sample data.`}
        actions={<button type="button" onClick={fresh} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-navy-900 ring-1 ring-slate-200 hover:bg-slate-50"><RotateCcw size={15} aria-hidden="true" />Start fresh demo</button>} />

      <Notice tone="teal" icon={FlaskConical}>Every person, medicine, phone number and price in this demo is fictional. Steps that rely on simulated behaviour say so, so nothing is presented as real. Tip: select <b>Start fresh demo</b> first, so dates and counts match this script.</Notice>

      <Card title="Run of show" action={<Badge tone={count === STEPS.length ? 'green' : 'slate'}>{count} of {STEPS.length} done</Badge>}>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.id} className="rounded-xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-start gap-3">
                <button type="button" role="checkbox" aria-checked={!!done[s.id]} aria-label={`Mark step ${i + 1}, ${s.title}, as done`} onClick={() => setDone({ ...done, [s.id]: !done[s.id] })} className="mt-0.5 shrink-0 rounded-full text-teal-700">
                  {done[s.id] ? <CheckCircle2 size={24} aria-hidden="true" /> : <Circle size={24} className="text-slate-500" aria-hidden="true" />}</button>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-base font-extrabold">{i + 1}. {s.title}<Badge>{fmt(s.secs)}</Badge></p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{s.show.map((t) => <li key={t}>{t}</li>)}</ul>
                  <p className="mt-2 text-sm text-slate-600"><b>Say:</b> {s.say}</p>
                  {s.sim && <p className="mt-2 flex items-start gap-2 text-sm"><Badge tone="dark">SIMULATED</Badge><span className="text-slate-700">{s.sim}</span></p>}
                </div>
                <button type="button" onClick={() => navigate(s.page)} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800">Open<ArrowRight size={15} aria-hidden="true" /><span className="sr-only">{s.title}</span></button>
              </div>
            </li>))}
        </ol>
        <p className="mt-3 text-sm font-semibold text-slate-600">Total: {fmt(TOTAL)}</p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="What is real in this prototype"><ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">{REAL.map((t) => <li key={t}>{t}</li>)}</ul></Card>
        <Card title="What is simulated" action={<Badge tone="dark">SIMULATED</Badge>}><ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">{SIMULATED.map((t) => <li key={t}>{t}</li>)}</ul></Card>
      </div>
      <p className="text-xs text-slate-600">MedGuard AI is a prototype. It has not been clinically or legally reviewed and is not a medical device. In a real emergency, call your local emergency number (112 in India).</p>
    </div>
  );
}

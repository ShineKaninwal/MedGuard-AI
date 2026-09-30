import { Siren, Phone, AlertTriangle, HeartPulse } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EMERGENCY_NUMBERS as N } from '../../utils/safety';

const tel = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;
const btn = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold';

// Shown instantly for potentially life-threatening input. Static text only: never generated, no questions.
export function EmergencyCard({ rule, level = 'emergency' }) {
  const { patient, medicines, contacts } = useApp();
  const meds = medicines.filter((m) => m.patientId === patient.id);
  const cts = contacts.filter((c) => c.patientId === patient.id);
  const urgent = level === 'urgent'; const crisis = rule?.crisis;
  return (
    <div role="alert" className={`rounded-2xl p-4 ring-2 ${urgent ? 'bg-amber-50 ring-amber-300' : 'bg-coral-50 ring-coral-500'}`}>
      <div className={`flex items-start gap-3 ${urgent ? 'text-amber-900' : 'text-coral-800'}`}>
        <Siren size={26} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-base font-extrabold">{urgent ? 'Please get medical care promptly' : crisis ? 'You do not have to face this alone. Get help now.' : 'This could be a medical emergency. Call for help now.'}</p>
          <p className="mt-0.5 text-sm font-semibold">{rule?.title}</p>
        </div>
      </div>
      {urgent ? (
        <p className="mt-3 text-sm text-amber-900">This can be a sign of something that needs to be checked by a doctor soon. Do not wait for it to pass. If it gets worse, or you also have severe difficulty breathing, chest pain that spreads, weakness on one side, or you feel faint, call {N.general} immediately.</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={tel(N.general)} className={`${btn} bg-coral-600 text-white hover:bg-coral-700`}><Phone size={18} />Call {N.general} (emergency)</a>
            <a href={tel(N.ambulance)} className={`${btn} bg-white text-coral-700 ring-1 ring-coral-300 hover:bg-coral-100`}><Phone size={18} />Call {N.ambulance} (ambulance)</a>
            {crisis && <a href={tel(N.crisis)} className={`${btn} bg-white text-coral-700 ring-1 ring-coral-300 hover:bg-coral-100`}><Phone size={18} />Tele-MANAS {N.crisis}</a>}
          </div>
          <ul className="mt-3 space-y-1 text-sm text-coral-900">
            {crisis ? <>
              <li>Stay with the person, or ask someone to stay with you. Move anything that could cause harm out of reach.</li>
              <li>Tell the responder what is happening as clearly as you can.</li></> : <>
              <li>Do not wait for this chat, and do not go alone or drive yourself. Ask someone nearby to help.</li>
              <li>Stay with the person and follow the dispatcher's instructions.</li>
              <li>If the person is not responding or not breathing normally, tell the dispatcher straight away.</li></>}
          </ul>
        </>
      )}
      {!urgent && cts.length > 0 && (
        <div className="mt-3"><p className="text-xs font-bold text-coral-800">Family contacts on file <span className="font-normal">(sample data, check they are correct)</span></p>
          <div className="mt-1 flex flex-wrap gap-2">{cts.map((c) => <a key={c.id} href={tel(c.phone)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-navy-900 ring-1 ring-coral-200 hover:bg-coral-100"><Phone size={13} />{c.name} ({c.relation})</a>)}</div></div>)}
      <div className={`mt-3 rounded-xl bg-white/70 p-3 text-xs ${urgent ? 'text-amber-900' : 'text-coral-900'}`}>
        <p className="mb-1 flex items-center gap-1.5 font-bold"><HeartPulse size={14} />Information for responders about {patient.name}</p>
        <p>Age {patient.age}. Conditions: {patient.conditions.join(', ') || 'none recorded'}. Allergies: {patient.allergies.join(', ') || 'none recorded'}.</p>
        <p>Medicines on record: {meds.length ? meds.map((m) => m.name).join(', ') : 'none recorded'}. This list may be incomplete or out of date.</p>
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-600"><AlertTriangle size={12} className="mt-0.5 shrink-0" />This app cannot place calls. On a phone the buttons open your dialer; on a computer, dial from your phone. Numbers are for India, so use your local emergency number elsewhere.</p>
    </div>
  );
}

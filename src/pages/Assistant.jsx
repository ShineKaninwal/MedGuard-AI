import { useState } from 'react';
import { Phone, FlaskConical, MessageCircle, History, ClipboardList, Siren, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, PageBanner, inputCls } from '../components/ui';
import Chat from '../components/assistant/Chat';
import SymptomHistory from '../components/assistant/SymptomHistory';
import VisitPrep from '../components/assistant/VisitPrep';
import { SymptomModal } from '../components/assistant/SymptomModal';
import { EMERGENCY_NUMBERS as N } from '../utils/safety';
import { HAS_AI_SERVICE } from '../config/assistant';
import { PolicyLink } from '../components/AgentPolicy';

const TABS = [['chat', 'Assistant', MessageCircle], ['history', 'Symptom history', History], ['visit', 'Visit preparation', ClipboardList]];

export default function Assistant() {
  const { patients, patient, setPatient, role, symptoms } = useApp();
  const [tab, setTab] = useState('chat'); const [draft, setDraft] = useState(null);
  const count = symptoms.filter((s) => s.patientId === patient.id).length;
  return (
    <div className="space-y-4">
      <PageBanner icon={Bot} title="AI Health Assistant" subtitle="General health information and notes for a doctor visit. Not a diagnosis, not treatment advice."
        actions={<label className="flex items-center gap-2 text-sm text-mint-100">Family member
          <select value={patient.id} onChange={(e) => setPatient(e.target.value)} disabled={role === 'patient'} className={`${inputCls} !w-auto font-semibold`}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.relation})</option>)}</select></label>} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-coral-50 px-4 py-2.5 text-sm font-semibold text-coral-800 ring-2 ring-coral-200">
        <span className="flex items-center gap-2"><Siren size={16} />In an emergency, do not use this chat. Call for help now.</span>
        <span className="flex gap-2"><a href={`tel:${N.general}`} className="flex items-center gap-1.5 rounded-lg bg-coral-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-coral-700"><Phone size={13} />Call {N.general}</a>
          <a href={`tel:${N.ambulance}`} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-extrabold text-coral-700 ring-1 ring-coral-300 hover:bg-coral-100"><Phone size={13} />Ambulance {N.ambulance}</a></span>
      </div>
      <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><FlaskConical size={15} className="mt-0.5 shrink-0" />
        {HAS_AI_SERVICE ? 'An AI service is connected. Its replies are filtered by safety rules but are not clinically validated. ' : 'Prototype: no AI service is configured, so replies are clearly labelled pre-written samples. '}This assistant has not been clinically validated and can miss warning signs. It cannot diagnose, prescribe, or change doses, and it does not check allergies. Nothing you type here starts, stops or changes any medicine. <PolicyLink />.</p>

      <div role="tablist" aria-label="Assistant sections" className="flex gap-1 rounded-2xl bg-mint-100 p-1">
        {TABS.map(([k, l, Icon]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${tab === k ? 'bg-navy-900 text-white shadow-card' : 'text-slate-700 hover:bg-white/70 hover:text-navy-900'}`}><Icon size={16} /><span className="hidden sm:inline">{l}</span><span className="sm:hidden">{l.split(' ')[0]}</span>{k === 'history' && count > 0 && <Badge tone="teal">{count}</Badge>}</button>)}
      </div>

      {tab === 'chat' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2"><Chat onSave={(d) => setDraft(d)} onPrep={() => setTab('visit')} /></div>
          <div className="space-y-4">
            <Card title={`About ${patient.name.split(' ')[0]}`}>
              <p className="text-sm text-slate-600">{patient.relation}, age {patient.age}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{patient.conditions.map((c) => <Badge key={c} tone="teal">{c}</Badge>)}{patient.allergies.map((a) => <Badge key={a} tone="red">Allergy: {a}</Badge>)}</div>
              <p className="mt-3 text-[11px] text-slate-500">The assistant uses this profile only to point out what to tell a clinician. Edit it on the Family Profiles page. {HAS_AI_SERVICE ? 'This profile is sent to the connected AI service only if you allow it in Settings.' : 'Nothing you type leaves this browser.'}</p>
            </Card>
            <Card tone="ivory" title="What this assistant will not do">
              <ul className="space-y-1.5 text-sm text-slate-600"><li>Diagnose what is causing symptoms</li><li>Recommend or prescribe medicines</li><li>Advise on doses or changing a dose</li><li>Tell you symptoms are harmless</li><li>Book appointments or create treatment plans</li></ul>
            </Card>
            <button onClick={() => setDraft({ text: '', duration: '', severity: null })} className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-navy-900 shadow-card ring-1 ring-slate-100 hover:ring-teal-600/40">Add a symptom entry manually</button>
          </div>
        </div>)}
      {tab === 'history' && <SymptomHistory />}
      {tab === 'visit' && <VisitPrep />}
      {draft && <SymptomModal initial={{ text: draft.text, duration: draft.duration, severity: draft.severity || 4 }} onClose={() => setDraft(null)} />}
    </div>
  );
}

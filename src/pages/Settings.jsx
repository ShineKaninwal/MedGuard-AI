import { Settings as SettingsIcon, RotateCcw, Lock } from 'lucide-react';
import { Card, Notice, PageHeader, inputCls } from '../components/ui';
import AgentPolicy from '../components/AgentPolicy';
import { useConfirm, useToast } from '../components/Feedback';
import { useApp } from '../context/AppContext';
import { HAS_AI_SERVICE } from '../config/assistant';

export default function Settings() {
  const { patients, patient, setPatient, resetData, navigate, settings, setShareProfile } = useApp();
  const confirm = useConfirm(); const toast = useToast();
  const reset = async () => {
    const ok = await confirm({ title: 'Reset all data to the sample set?', confirmLabel: 'Reset sample data',
      body: <><p>This deletes everything you added or changed in this browser: medicines, reminders, dose history, family members, contacts, SOS alerts and disposal records.</p><p>The original fictional sample data is restored.</p></> });
    if (ok) { resetData(); toast('Sample data restored.'); navigate('dashboard'); }
  };
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader icon={SettingsIcon} title="Settings" subtitle="Everything is stored in this browser only." />
      <Card title="Selected family member">
        <label className="sr-only" htmlFor="settings-patient">Selected family member</label>
        <select id="settings-patient" value={patient.id} onChange={(e) => setPatient(e.target.value)} className={inputCls}>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.relation})</option>)}
        </select>
      </Card>
      <AgentPolicy />
      <Card title="Privacy and consent">
        <div className="space-y-3 text-sm">
          <p className="flex items-start gap-2"><Lock size={16} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />Medical details stay in this browser. The app has no account, no server and no analytics. It stores no faces, number plates or identity documents.</p>
          <label className={`flex items-start gap-2 ${HAS_AI_SERVICE ? 'cursor-pointer' : 'opacity-70'}`}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-teal-600" checked={Boolean(settings?.shareProfileWithService)} disabled={!HAS_AI_SERVICE} onChange={(e) => setShareProfile(e.target.checked)} />
            <span><b>Let the Assistant send the selected member's age, conditions and allergies to the connected AI service.</b>
              <span className="block text-xs text-slate-600">{HAS_AI_SERVICE ? 'Off by default. Without your consent only your typed message leaves this browser.' : 'No AI service is connected, so nothing leaves this browser and this switch has no effect.'}</span></span>
          </label>
          <p className="text-xs text-slate-600">SOS alerts share location and medical details only when you tick them for that one alert.</p>
        </div>
      </Card>
      <Card title="Demo data">
        <Notice tone="teal" className="mb-3">The sample family, medicines, prices and contacts in this prototype are fictional. Reset restores the original sample set, which is a good way to start a fresh demo.</Notice>
        <button type="button" onClick={reset} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"><RotateCcw size={15} aria-hidden="true" />Reset sample data</button>
      </Card>
    </div>
  );
}

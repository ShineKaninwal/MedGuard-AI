import { useState } from 'react';
import { Siren, AlertTriangle, ChevronDown, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty } from '../components/ui';
import { SosButton } from '../components/sos/SosUi';
import ActiveEmergency, { LocationLine } from '../components/sos/ActiveEmergency';
import { EmergencyCalls, CallNote } from '../components/sos/CallButtons';
import NotificationList, { StatusSummary } from '../components/sos/NotificationList';
import { typeLabel, SIMULATED_NOTICE } from '../config/sos';
import { fmtDateTime } from '../services/notifications';
import { useConfirm } from '../components/Feedback';

function PastAlert({ a }) {
  const [open, setOpen] = useState(false);
  const shared = Object.keys(a.shared || {});
  return (
    <li className="rounded-xl ring-1 ring-slate-100">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-3 text-left text-sm">
        <span><b>{a.patientName}</b>, {typeLabel(a.type)}<span className="block text-xs text-slate-500">{fmtDateTime(a.createdAt)}, ID {a.id}</span></span>
        <span className="flex items-center gap-2"><Badge tone={a.status === 'resolved' ? 'green' : 'slate'}>{a.status === 'resolved' ? 'Resolved' : 'Cancelled'}</Badge><ChevronDown size={16} className={open ? 'rotate-180' : ''} /></span></button>
      {open && <div className="space-y-2 border-t border-slate-100 p-3 text-xs text-slate-600">
        <p>Closed {a.closedAt ? fmtDateTime(a.closedAt) : ''}. Location: <LocationLine loc={a.location} /> Medical details shared: {shared.length ? shared.join(', ') : 'none'}.</p>
        <StatusSummary notifications={a.notifications} />
        <NotificationList notifications={a.notifications} canRetry={false} compact /></div>}
    </li>
  );
}

export default function Sos() {
  const { emergencyAlerts, sosPrefs, setSosPrefs, clearAlertHistory, navigate } = useApp();
  const confirm = useConfirm();
  const active = emergencyAlerts.filter((a) => a.active); const past = emergencyAlerts.filter((a) => !a.active);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div><h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><Siren className="text-coral-600" />Emergency SOS</h1>
        <p className="text-sm text-slate-500">Call for help, and alert your emergency contacts.</p></div>

      {active.map((a) => <ActiveEmergency key={a.id} alert={a} />)}

      <Card className={active.length ? '' : 'ring-2 ring-coral-200'}>
        <h2 className="mb-1 text-[15px] font-bold">{active.length ? 'Emergency numbers' : 'In an emergency, call first'}</h2>
        <EmergencyCalls />
        <CallNote className="mt-2" />
        {!active.length && <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-3 text-sm text-slate-600">Press SOS to choose the emergency type and who to alert. Nothing is sent until you confirm.</p>
          <SosButton size="lg" className="w-full sm:w-auto" /></div>}
        {active.length > 0 && <div className="mt-4 border-t border-slate-100 pt-4"><p className="mb-2 text-sm text-slate-600">Need to raise an alert for someone else?</p><SosButton /></div>}
      </Card>

      <p className="flex items-start gap-2 rounded-xl bg-slate-800 p-3 text-xs font-semibold text-white"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{SIMULATED_NOTICE} A real service would need a backend (see README).</p>

      <Card title="Alert settings" action={<button onClick={() => navigate('contacts')} className="text-xs font-bold text-teal-600">Emergency contacts</button>}>
        <label className="flex cursor-pointer items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-teal-600" checked={sosPrefs.simulateFailure} onChange={(e) => setSosPrefs({ simulateFailure: e.target.checked })} />
          <span><b>Demo: make simulated notifications fail.</b> <span className="text-xs text-slate-500">Use this to test the Failed status and Retry. It affects only simulated notifications.</span></span></label>
      </Card>

      <Card title="Alert history" action={past.length > 0 && <button onClick={async () => (await confirm({ title: 'Delete the record of past alerts?', body: 'Active alerts are kept.', confirmLabel: 'Delete records' })) && clearAlertHistory()} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-coral-600"><Trash2 size={13} />Clear</button>}>
        {past.length === 0 ? <Empty>No past alerts.</Empty> : <ul className="space-y-2">{past.map((a) => <PastAlert key={a.id} a={a} />)}</ul>}
      </Card>
    </div>
  );
}

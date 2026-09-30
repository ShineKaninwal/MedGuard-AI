import { useState } from 'react';
import { Activity as ActivityIcon, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Notice, PageHeader } from '../components/ui';
import { timeAgo } from '../utils/dates';

const AGENTS = [
  ['Audit Agent', 'Runs the AI Medicine Audit: expiry, duplicates, missing information, prescription comparison.'],
  ['Inventory Agent', 'Records changes you make to medicines, prescriptions, reminders and appointments.'],
  ['Emergency Agent', 'Creates SOS alerts and runs the simulated contact notifications.'],
];

export default function Activity() {
  const { activity } = useApp();
  const [agent, setAgent] = useState('all');
  const agents = [...new Set(activity.map((a) => a.agent))];
  const shown = activity.filter((a) => agent === 'all' || a.agent === agent);
  return (
    <div className="space-y-5">
      <PageHeader icon={ActivityIcon} title="Agent Activity" subtitle="A record of what the app's automated helpers did, newest first." />
      <Notice tone="teal">The "agents" are rule-based helpers that follow fixed checks on your data. They are not autonomous and cannot contact anyone or change medicines by themselves. The log keeps the latest 20 entries in this browser.</Notice>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div role="group" aria-label="Filter by agent" className="flex flex-wrap gap-1.5">
            {['all', ...agents].map((k) => <button key={k} aria-pressed={agent === k} onClick={() => setAgent(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${agent === k ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}>{k === 'all' ? `All (${activity.length})` : k}</button>)}
          </div>
          <Card>
            {shown.length === 0 ? <Empty icon={ActivityIcon}>No activity yet. Run an audit or change a medicine and it will be logged here.</Empty> : (
              <ol className="divide-y divide-slate-100">
                {shown.map((a) => (
                  <li key={a.id} className="flex gap-3 py-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
                    <div className="min-w-0 flex-1"><p className="text-sm"><span className="font-bold">{a.agent}:</span> {a.text} {a.sample && <Badge>Sample entry</Badge>}</p>
                      <p className="text-xs text-slate-500"><time dateTime={new Date(a.ts).toISOString()}>{new Date(a.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</time> ({timeAgo(a.ts)})</p></div>
                  </li>))}
              </ol>)}
          </Card>
        </div>
        <Card title="What the agents do" className="h-fit">
          <ul className="space-y-3">{AGENTS.map(([n, d]) => <li key={n} className="flex gap-2.5"><Bot size={16} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" /><div><p className="text-sm font-bold">{n}</p><p className="text-xs text-slate-600">{d}</p></div></li>)}</ul>
        </Card>
      </div>
    </div>
  );
}

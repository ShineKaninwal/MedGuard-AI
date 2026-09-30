import { RefreshCw, MessageSquare, Bell } from 'lucide-react';
import { Badge } from '../ui';
import { STATUS_LABEL, CHANNEL_LABEL, fmtClock, countStatus } from '../../services/notifications';

const tone = { sent: 'green', pending: 'amber', failed: 'red' };
export const SimBadge = () => <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">Simulated</span>;

export function StatusSummary({ notifications }) {
  const c = countStatus(notifications);
  return <span className="flex flex-wrap gap-1.5"><Badge tone="green">{c.sent} simulated sent</Badge><Badge tone={c.pending ? 'amber' : 'slate'}>{c.pending} pending</Badge><Badge tone={c.failed ? 'red' : 'slate'}>{c.failed} failed</Badge></span>;
}

// One row per recipient and channel: recipient, channel, status, timestamp, and Retry when failed.
export default function NotificationList({ notifications, onRetry, canRetry = true, compact }) {
  if (!notifications.length) return <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No contacts were selected, so no notifications were created. Use the call buttons to reach someone.</p>;
  return (
    <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-100" aria-live="polite">
      {notifications.map((n) => {
        const Icon = n.channel === 'sms' ? MessageSquare : Bell;
        return (
          <li key={n.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm">
            <Icon size={15} className="shrink-0 text-slate-500" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{n.contactName} <span className="font-normal text-slate-500">{compact ? '' : n.contactPhone}</span></p>
              <p className="text-xs text-slate-500"><SimBadge /> {CHANNEL_LABEL[n.channel]}{n.kind === 'update' ? ' status update' : ' alert'}, {n.status === 'pending' ? 'started' : n.status === 'sent' ? 'simulated at' : 'failed at'} {fmtClock(n.at)}{n.error ? `. ${n.error}` : ''}</p>
            </div>
            <Badge tone={tone[n.status]}>{STATUS_LABEL[n.status]}</Badge>
            {n.status === 'failed' && canRetry && onRetry && <button onClick={() => onRetry(n.id)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"><RefreshCw size={12} />Retry</button>}
          </li>
        );
      })}
    </ul>
  );
}

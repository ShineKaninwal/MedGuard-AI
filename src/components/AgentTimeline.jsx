import { Loader2, CheckCircle2, AlertTriangle, MinusCircle, Circle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ICON = {
  running: <Loader2 size={18} className="animate-spin text-teal-700" aria-hidden="true" />, done: <CheckCircle2 size={18} className="text-teal-500" aria-hidden="true" />,
  warning: <AlertTriangle size={18} className="text-amber-600" aria-hidden="true" />, skipped: <MinusCircle size={18} className="text-slate-500" aria-hidden="true" />,
  pending: <Circle size={18} className="text-slate-400" aria-hidden="true" />, error: <XCircle size={18} className="text-red-500" aria-hidden="true" />,
};
// Text labels as well as icons, so status never depends on colour alone.
const LABEL = { running: 'Running', done: 'Done', warning: 'Needs review', skipped: 'Skipped', pending: 'Pending', error: 'Failed' };
const CHIP = { warning: 'bg-amber-50 text-amber-800', error: 'bg-red-50 text-red-700', done: 'bg-teal-50 text-teal-700', running: 'bg-slate-100 text-navy-700' };

// The green line beside the steps grows only as steps really finish (finished / total). It is never driven by a timer.
export default function AgentTimeline({ steps }) {
  const finished = steps.filter((s) => !['pending', 'running'].includes(s.status)).length;
  const share = steps.length ? finished / steps.length : 0;
  const hasError = steps.some((s) => s.status === 'error');
  return (
    <ol className="relative space-y-4" aria-label={`${finished} of ${steps.length} steps finished`}>
      <span aria-hidden="true" className="absolute bottom-2 left-[8px] top-2 w-0.5 rounded-full bg-mint-200" />
      <motion.span aria-hidden="true" className={`absolute left-[8px] top-2 w-0.5 origin-top rounded-full ${hasError ? 'bg-coral-500' : 'bg-teal-600'}`} style={{ bottom: 8 }}
        initial={{ scaleY: 0 }} animate={{ scaleY: share }} transition={{ duration: 0.5, ease: 'easeOut' }} />
      {steps.map((s) => (
        <motion.li key={s.id} layout initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="relative flex gap-3">
          <span className="z-10 grid h-[18px] w-[18px] place-items-center rounded-full bg-white ring-2 ring-white">{ICON[s.status]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold">{s.agent}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CHIP[s.status] || 'bg-slate-100 text-slate-600'}`}>{LABEL[s.status]}</span>
              {typeof s.durationMs === 'number' && s.status !== 'running' && <span className="text-[11px] tabular-nums text-slate-500">{s.durationMs} ms</span>}
            </div>
            <p className="text-xs text-slate-500">{s.action}</p>
            {s.result && s.status !== 'running' && <p className="mt-0.5 text-xs font-semibold text-navy-800">{s.result}</p>}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

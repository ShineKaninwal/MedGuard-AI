import { motion } from 'framer-motion';
import { daysRemaining } from '../utils/agentTools';
import { longDate } from '../utils/medicine';

const HORIZON = 365; // bars cover one year; longer than that is drawn full
const tone = (d) => (d === null ? ['bg-slate-300', 'text-slate-600'] : d < 0 ? ['bg-coral-500', 'text-coral-700'] : d <= 60 ? ['bg-amber-400', 'text-amber-800'] : ['bg-teal-500', 'text-teal-700']);

// One bar per medicine: how long until its RECORDED expiry date. Text says the same thing as the bar, so colour is never the only signal.
export default function ExpiryRunway({ meds }) {
  const rows = meds.map((m) => ({ m, d: daysRemaining(m.expiry) })).sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
  if (!rows.length) return null;
  return (
    <ul className="space-y-3" aria-label="Days until each medicine reaches its recorded expiry date">
      {rows.map(({ m, d }, i) => {
        const [bar, txt] = tone(d); const w = d === null ? 0 : d < 0 ? 100 : Math.max(3, Math.min(100, (d / HORIZON) * 100));
        return (
          <li key={m.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate font-semibold">{m.name}</span>
              <span className={`shrink-0 text-xs font-bold tabular-nums ${txt}`}>{d === null ? 'No expiry date' : d < 0 ? `Expired ${-d} d ago` : `${d} d left`}<span className="ml-1 font-normal text-slate-500">{m.expiry ? longDate(m.expiry) : ''}</span></span></div>
            <div className="h-2 overflow-hidden rounded-full bg-mint-100"><motion.div className={`h-full rounded-full ${bar}`} initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }} /></div>
          </li>);
      })}
    </ul>
  );
}

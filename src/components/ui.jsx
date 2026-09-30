import { useEffect, useRef } from 'react';
import { X, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { MedPattern } from './illustrations';

// Cards come in a few treatments so a page is not a wall of identical boxes: plain (white), sage (secondary), ivory (quiet, bordered),
// forest (important, dark) and gold (highlight). `hover` lifts the card slightly on devices that hover.
const cardTone = {
  plain: 'bg-white ring-1 ring-slate-200/70',
  sage: 'bg-mint-100/70 ring-1 ring-mint-200',
  ivory: 'bg-ivory-50 ring-1 ring-ivory-300',
  gold: 'bg-gold-50 ring-1 ring-gold-200',
  forest: 'bg-navy-900 text-white ring-1 ring-navy-700',
};
export const Card = ({ title, action, children, className = '', tone = 'plain', hover = true }) => (
  <section className={`rounded-2xl p-5 shadow-card ${cardTone[tone] || cardTone.plain} ${hover ? 'card-hover' : ''} ${className}`}>
    {(title || action) && (
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className={`text-[15px] font-bold ${tone === 'forest' ? 'text-white' : 'text-navy-900'}`}>{title}</h2>
        {action}
      </header>
    )}
    {children}
  </section>
);

const tones = {
  teal: 'bg-teal-50 text-teal-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-800',
  red: 'bg-coral-50 text-coral-700', slate: 'bg-slate-100 text-slate-600', dark: 'bg-navy-900 text-white', gold: 'bg-gold-100 text-gold-700',
};
export const Badge = ({ tone = 'slate', children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone] || tones.slate}`}>{children}</span>
);

const statTone = { teal: 'text-teal-700 bg-teal-50', green: 'text-emerald-700 bg-emerald-50', amber: 'text-amber-700 bg-amber-50', red: 'text-coral-700 bg-coral-50', navy: 'text-navy-700 bg-mint-100', gold: 'text-gold-700 bg-gold-100' };
const statCls = 'card-hover flex items-start justify-between rounded-2xl bg-white p-4 text-left shadow-card ring-1 ring-slate-200/70';
// A card is a button only when it goes somewhere. A card with no action is plain text, never a dead button.
export const StatCard = ({ label, value, hint, icon: Icon, tone = 'navy', onClick, flat = false }) => {
  const body = (<>
    <div>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </div>
    <span className={`rounded-xl p-2.5 ${statTone[tone] || statTone.navy}`}><Icon size={18} aria-hidden="true" /></span>
  </>);
  // flat = sits inside a shared strip (the Dashboard) instead of being its own card.
  const base = flat ? 'flex items-start justify-between p-4 text-left' : statCls;
  return onClick
    ? <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClick} className={`${base} w-full transition ${flat ? 'hover:bg-mint-100/50' : 'hover:ring-teal-500/40'}`}>{body}</motion.button>
    : <div className={base}>{body}</div>;
};

export const Empty = ({ icon: Icon, action, children }) => (
  <div className="rounded-xl bg-mint-50 p-5 text-center text-sm text-slate-600 ring-1 ring-mint-100">
    {Icon && <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200"><Icon size={18} aria-hidden="true" /></span>}
    <p className="mx-auto max-w-md">{children}</p>
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export const Skeleton = ({ className = '' }) => <div aria-hidden="true" className={`animate-pulse rounded-xl bg-mint-200/60 ${className}`} />;

const noticeTone = {
  teal: ['bg-mint-100/70 text-teal-900 ring-mint-200', Info], amber: ['bg-amber-50 text-amber-900 ring-amber-200', AlertTriangle],
  red: ['bg-coral-50 text-coral-900 ring-coral-100', ShieldAlert], slate: ['bg-slate-100 text-slate-700 ring-slate-200', Info],
};
// Inline message. Always paired with an icon, so meaning never depends on colour alone.
export const Notice = ({ tone = 'slate', icon, className = '', children }) => {
  const [cls, Def] = noticeTone[tone] || noticeTone.slate; const Icon = icon || Def;
  return <div role="note" className={`flex items-start gap-2.5 rounded-xl p-3.5 text-sm ring-1 ${cls} ${className}`}><Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><div className="min-w-0">{children}</div></div>;
};

export const PageHeader = ({ icon: Icon, title, subtitle, actions }) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
      {Icon && <span className="mt-0.5 hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-navy-900 text-gold-400 shadow-card sm:grid"><Icon size={20} aria-hidden="true" /></span>}
      <div className="min-w-0"><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>{subtitle && <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>}</div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const FieldError = ({ show = true, children }) => (show && children ? <p role="alert" className="mt-1 text-xs font-semibold text-coral-700">{children}</p> : null);


export const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 aria-[invalid=true]:border-coral-600';
export const Field = ({ label, children, className = '' }) => (
  <label className={`block text-xs font-semibold text-slate-600 ${className}`}>{label}<div className="mt-1">{children}</div></label>
);
export function Modal({ title, onClose, children, wide }) {
  const box = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    if (box.current && !box.current.contains(document.activeElement)) box.current.focus();
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); if (prev instanceof HTMLElement && document.contains(prev)) prev.focus(); };
  }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/60 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div ref={box} tabIndex={-1} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl outline-none ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} aria-hidden="true" /></button></div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// Tells the person what is still missing when a Save button is disabled. Each item is [isDone, "what is needed"].
export const Needs = ({ list, className = '' }) => {
  const missing = list.filter(([done]) => !done).map(([, label]) => label);
  return missing.length ? <p role="status" className={`text-xs font-semibold text-slate-600 ${className}`}>To save, still needed: {missing.join(', ')}.</p> : null;
};

// Banner at the top of a main page: forest panel with a soft pattern, title, subtitle and optional actions. `children` sits under the text.
export const PageBanner = ({ icon: Icon, title, subtitle, actions, children }) => (
  <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-5 text-white shadow-card sm:p-6">
    <MedPattern className="pointer-events-none absolute -right-4 -top-4 h-40 w-64 text-mint-200/15" />
    <div className="relative flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold-400 text-navy-900"><Icon size={21} aria-hidden="true" /></span>}
        <div className="min-w-0"><h1 className="!text-white text-2xl font-extrabold tracking-tight">{title}</h1>{subtitle && <p className="mt-1 max-w-2xl text-sm text-mint-100">{subtitle}</p>}</div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children && <div className="relative mt-4">{children}</div>}
  </div>
);

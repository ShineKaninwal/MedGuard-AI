import { Component, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, RotateCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from './ui';
import ConfirmDialog from './sos/ConfirmDialog';

// Shown while a page's code loads.
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-5">
      <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      <div className="grid gap-5 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// A crash in one page must never blank the whole app or hide the SOS button.
export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error('Page error:', error); }
  render() {
    if (!this.state.error) return this.props.children;
    const chunk = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(String(this.state.error?.message));
    return (
      <div role="alert" className="mx-auto mt-10 max-w-lg rounded-2xl bg-white p-6 text-center shadow-card ring-1 ring-red-100">
        <AlertTriangle className="mx-auto text-red-600" size={28} aria-hidden="true" />
        <h1 className="mt-3 text-xl font-extrabold">{chunk ? 'This page could not be loaded' : 'Something went wrong on this page'}</h1>
        <p className="mt-1 text-sm text-slate-500">{chunk ? 'Check your internet connection and try again.' : 'Your saved data is safe. Try again, or go back to the dashboard.'}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button onClick={() => (chunk ? window.location.reload() : this.setState({ error: null }))} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"><RotateCw size={15} />Try again</button>
          <a href="#/dashboard" onClick={() => this.setState({ error: null })} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-navy-900 ring-1 ring-slate-200 hover:bg-slate-50">Go to dashboard</a>
        </div>
        <p className="mt-4 text-xs text-slate-500">Emergency? Call 112 from your phone. The SOS button is still available.</p>
      </div>
    );
  }
}

const TOAST = { ok: ['bg-navy-900 text-white', CheckCircle2], warn: ['bg-amber-100 text-amber-900', AlertTriangle], info: ['bg-slate-800 text-white', Info] };
// The live region always exists so screen readers announce each new message.
export function Toaster({ toast, onClose }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (() => { const [cls, Icon] = TOAST[toast.tone] || TOAST.ok; return (
          <motion.div key={toast.id} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ${cls}`}>
            <Icon size={16} className="shrink-0" aria-hidden="true" /><span>{toast.text}</span>
            <button onClick={onClose} aria-label="Dismiss message" className="-mr-1 rounded p-1 opacity-70 hover:opacity-100"><X size={14} /></button>
          </motion.div>); })()}
      </AnimatePresence>
    </div>
  );
}

// useConfirm() -> await confirm({ title, body, confirmLabel, tone }) resolves true or false. Replaces window.confirm.
const CC = createContext(() => Promise.resolve(false));
export const useConfirm = () => useContext(CC);
export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null);
  const ask = useCallback((opts) => new Promise((resolve) => setReq({ ...opts, resolve })), []);
  const done = (v) => { req?.resolve(v); setReq(null); };
  return (
    <CC.Provider value={ask}>
      {children}
      {req && <ConfirmDialog title={req.title} confirmLabel={req.confirmLabel || 'Confirm'} tone={req.tone ?? 'red'} onClose={() => done(false)} onConfirm={() => done(true)}>{typeof req.body === 'string' ? <p>{req.body}</p> : req.body}</ConfirmDialog>}
    </CC.Provider>
  );
}

// useToast() -> toast('Saved'), toast('Could not save', 'warn'). One short message at a time, announced to screen readers.
const TC = createContext(() => {});
export const useToast = () => useContext(TC);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); const timer = useRef(null);
  const close = useCallback(() => setToast(null), []);
  const show = useCallback((text, tone = 'ok') => { clearTimeout(timer.current); setToast({ id: Date.now(), text, tone }); timer.current = setTimeout(() => setToast(null), tone === 'warn' ? 7000 : 4000); }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <TC.Provider value={show}>{children}<Toaster toast={toast} onClose={close} /></TC.Provider>;
}

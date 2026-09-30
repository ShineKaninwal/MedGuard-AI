import { useEffect } from 'react';
export default function ConfirmDialog({ title, children, confirmLabel, tone = 'red', onConfirm, onClose }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-navy-900/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="alertdialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-extrabold">{title}</h2>
        <div className="mt-2 space-y-2 text-sm text-slate-600">{children}</div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button autoFocus onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Go back</button>
          <button onClick={onConfirm} className={`rounded-xl px-5 py-2.5 text-sm font-extrabold text-white ${tone === 'red' ? 'bg-coral-600 hover:bg-coral-700' : 'bg-navy-900 hover:bg-navy-800'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

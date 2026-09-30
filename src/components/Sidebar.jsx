import { useEffect, useRef } from 'react';
import { X, Leaf } from 'lucide-react';
import { NAV, GROUPS } from '../config/nav';
import { useApp } from '../context/AppContext';
import { SosButton } from './sos/SosUi';
import { LogoMark } from './illustrations';

export default function Sidebar({ open, onClose }) {
  const { page, role, setRole, emergencyAlerts } = useApp();
  const activeCount = emergencyAlerts.filter((a) => a.active).length;
  const closeRef = useRef(null);

  // On a phone the menu is a drawer: Escape closes it and focus moves inside it while it is open.
  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden" onClick={onClose} aria-hidden="true" />}
      {/* When closed on a phone the drawer is hidden from keyboards and screen readers as well as from view. */}
      <aside aria-label="Main" className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ivory-300 bg-white text-slate-600 shadow-[6px_0_24px_-16px_rgba(18,59,50,.35)] transition-transform lg:visible lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full max-lg:invisible'}`}>
        <div className="flex items-center justify-between px-5 py-5">
          <a href="#/dashboard" onClick={onClose} className="flex items-center gap-2.5 text-navy-900">
            <LogoMark size={40} />
            <span className="leading-tight"><span className="block text-lg font-extrabold tracking-tight">MedGuard <span className="text-teal-600">AI</span></span><span className="block text-[11px] font-medium text-slate-500">Smarter medicine care</span></span>
          </a>
          <button ref={closeRef} className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onClose} aria-label="Close menu"><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="px-3 pb-3"><SosButton className="w-full" /></div>
        <nav aria-label="Pages" className="flex-1 overflow-y-auto px-3 pb-4">
          {GROUPS.map((g) => (
            <div key={g} className="mb-2">
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{g}</p>
              <ul className="space-y-0.5">
                {NAV.filter((n) => n.group === g).map(({ id, label, icon: Icon, danger }) => {
                  const active = page === id;
                  return (
                    <li key={id}>
                      <a href={`#/${id}`} onClick={onClose} aria-current={active ? 'page' : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition ${active ? 'bg-navy-900 text-white shadow-card' : danger ? 'text-coral-700 hover:bg-coral-50' : 'hover:bg-mint-100/70 hover:text-navy-900'}`}>
                        <Icon size={17} aria-hidden="true" className={`shrink-0 ${active ? 'text-gold-400' : ''}`} /> <span className="min-w-0">{label}</span>
                        {id === 'sos' && activeCount > 0 && <span className="ml-auto rounded-full bg-coral-600 px-2 py-0.5 text-[10px] font-extrabold text-white">ACTIVE</span>}
                      </a>
                    </li>);
                })}
              </ul>
            </div>))}
        </nav>
        <a href="#/waste" onClick={onClose} className="mx-3 mb-3 flex items-center gap-3 rounded-2xl bg-mint-100 p-3 text-navy-900 transition hover:bg-mint-200">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-teal-700"><Leaf size={18} aria-hidden="true" /></span>
          <span className="text-xs leading-snug"><b className="block text-[13px]">Less waste, safer homes</b>Open Waste Analytics</span>
        </a>
        <div className="border-t border-ivory-300 p-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Simulated role</p>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Role">
            {[['caregiver', 'Caregiver'], ['patient', 'Patient']].map(([k, l]) => (
              <button key={k} type="button" aria-pressed={role === k} onClick={() => setRole(k)} className={`rounded-lg py-1.5 text-xs font-bold ${role === k ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-white'}`}>{l}</button>))}
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-slate-500">Demo only. There is no login or real access control, so this does not protect anyone's data.</p>
        </div>
      </aside>
    </>
  );
}

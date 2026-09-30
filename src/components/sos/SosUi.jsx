import { createContext, useContext, useState, useCallback } from 'react';
import { Siren, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NUMBERS, typeLabel } from '../../config/sos';
import { fmtClock } from '../../services/notifications';
import { telHref } from '../../utils/phone';
import SosConfirm from './SosConfirm';

const Ui = createContext({ open: () => {}, close: () => {}, isOpen: false });
export const useSosUi = () => useContext(Ui);

// Holds the "confirmation screen is open" flag so the SOS button on any page can open it without navigating away.
export function SosUiProvider({ children }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []); const close = useCallback(() => setOpen(false), []);
  return <Ui.Provider value={{ isOpen, open, close }}>{children}{isOpen && <SosConfirm onClose={close} />}</Ui.Provider>;
}

// Big red button. Opens the confirmation screen; it never sends anything by itself.
export function SosButton({ className = '', size = 'md' }) {
  const { open } = useSosUi();
  const big = size === 'lg';
  return (
    <button onClick={open} aria-haspopup="dialog" className={`flex items-center justify-center gap-2 rounded-2xl bg-coral-600 font-extrabold uppercase tracking-wide text-white shadow-card ring-4 ring-coral-600/20 transition hover:bg-coral-700 active:scale-[0.98] ${big ? 'px-8 py-5 text-2xl' : 'px-4 py-2.5 text-sm'} ${className}`}>
      <Siren size={big ? 28 : 17} />SOS
    </button>
  );
}

// Visible on every page while any alert is active. Includes calling without leaving the page.
export function ActiveBanner() {
  const { emergencyAlerts, navigate, page } = useApp();
  const active = emergencyAlerts.filter((a) => a.active);
  if (!active.length || page === 'sos') return null;
  return (
    <div role="alert" className="space-y-px">
      {active.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-coral-600 px-4 py-2 text-white">
          <Siren size={18} className="shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm font-bold">SOS ACTIVE: {a.patientName}, {typeLabel(a.type)}, since {fmtClock(a.createdAt)}</p>
          <a href={telHref(NUMBERS.general)} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-extrabold text-coral-700"><Phone size={13} />Call {NUMBERS.general}</a>
          <button onClick={() => navigate('sos')} className="rounded-lg bg-coral-800 px-3 py-1.5 text-xs font-extrabold hover:bg-coral-900">View alert</button>
        </div>
      ))}
    </div>
  );
}

import { Phone, AlertTriangle } from 'lucide-react';
import { NUMBERS } from '../../config/sos';
import { telHref } from '../../utils/phone';

// A tel: link. It only opens the phone's dialer. This app cannot place calls or know whether one connected.
export function CallLink({ number, children, className = '', label }) {
  return <a href={telHref(number)} aria-label={label || `Call ${number}`} className={`inline-flex items-center justify-center gap-2 rounded-xl font-extrabold ${className}`}><Phone size={18} />{children}</a>;
}

export const CALL_NOTE = 'These buttons open your phone dialer. This app cannot place calls or tell whether a call connected. On a computer, dial from your phone. Numbers are for India; use your local emergency number elsewhere.';
export const CallNote = ({ className = '' }) => <p className={`flex items-start gap-1.5 text-[11px] leading-snug text-slate-600 ${className}`}><AlertTriangle size={12} className="mt-0.5 shrink-0" />{CALL_NOTE}</p>;

// Always-visible emergency numbers. Never gated behind an alert, a form or a confirmation.
export function EmergencyCalls({ size = 'lg' }) {
  const pad = size === 'lg' ? 'px-4 py-4 text-base' : 'px-3 py-2.5 text-sm';
  return (
    <div className="grid grid-cols-2 gap-2">
      <CallLink number={NUMBERS.general} className={`${pad} bg-coral-600 text-white hover:bg-coral-700`}>Call {NUMBERS.general}<span className="hidden text-xs font-semibold sm:inline">Emergency</span></CallLink>
      <CallLink number={NUMBERS.ambulance} className={`${pad} bg-white text-coral-700 ring-2 ring-coral-300 hover:bg-coral-50`}>Call {NUMBERS.ambulance}<span className="hidden text-xs font-semibold sm:inline">Ambulance</span></CallLink>
    </div>
  );
}

// Picks the contact to dial for a role group: primary first, then first with a phone number.
export const pickContact = (contacts, cats) => { const l = contacts.filter((c) => cats.includes(c.category) && c.phone); return l.find((c) => c.primary) || l[0] || null; };

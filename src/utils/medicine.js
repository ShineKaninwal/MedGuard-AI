import { daysUntil } from './dates';
export const expiryStatus = (iso) => {
  const days = daysUntil(iso);
  if (days < 0) return { key: 'expired', label: 'Expired', tone: 'red', bar: 'bg-coral-500', days };
  if (days <= 60) return { key: 'expiring', label: 'Expiring soon', tone: 'amber', bar: 'bg-amber-400', days };
  return { key: 'valid', label: 'Valid', tone: 'green', bar: 'bg-teal-500', days };
};
export const longDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

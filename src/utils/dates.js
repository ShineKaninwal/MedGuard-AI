// Dates are local calendar days as YYYY-MM-DD strings.
export const todayKey = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
export const addDays = (k, n) => new Date(new Date(k).getTime() + n * 864e5).toISOString().slice(0, 10);
export const daysFromNow = (n) => addDays(todayKey(), n);
export const daysUntil = (iso) => Math.ceil((new Date(iso) - new Date(todayKey())) / 864e5);
export const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
export const timeAgo = (ts) => {
  const m = Math.max(1, Math.round((Date.now() - ts) / 6e4));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

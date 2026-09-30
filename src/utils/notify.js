import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { dosesOn, nowHM } from './schedule';
import { todayKey } from './dates';

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

// Prototype: fires only while the app is open, and only if permission was granted.
export function useReminderNotifier() {
  const { reminders, medicines, patients } = useApp();
  const sent = useRef(new Set()); const ref = useRef({});
  ref.current = { reminders, medicines, patients };
  useEffect(() => {
    if (!notificationsSupported()) return undefined;
    const t = setInterval(() => {
      if (Notification.permission !== 'granted') return;
      const { reminders, medicines, patients } = ref.current; const k = todayKey(); const now = nowHM();
      dosesOn(reminders, k).filter((r) => r.time === now).forEach((r) => {
        const key = `${r.id}${k}${now}`; if (sent.current.has(key)) return; sent.current.add(key);
        new Notification('MedGuard AI reminder', { body: `${medicines.find((m) => m.id === r.medicineId)?.name || 'Medicine'} for ${patients.find((p) => p.id === r.patientId)?.name}. ${r.dose || ''}`.trim() });
      });
    }, 20000);
    return () => clearInterval(t);
  }, []);
}

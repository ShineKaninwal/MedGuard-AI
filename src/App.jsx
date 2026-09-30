import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import { motion, MotionConfig } from 'framer-motion';
import Sidebar from './components/Sidebar';
import { SosUiProvider, SosButton, ActiveBanner } from './components/sos/SosUi';
import { ErrorBoundary, PageSkeleton } from './components/Feedback';
import { useReminderNotifier } from './utils/notify';
import { NAV } from './config/nav';
import { useApp } from './context/AppContext';
import NotFound from './pages/NotFound';
import { LogoMark } from './components/illustrations';

// Each page loads on demand, so the first screen is quick and a failed page load cannot take the rest of the app down.
const page = (loader) => lazy(loader);
// Register new pages here and in src/config/nav.js. Both lists are checked by the link test in the README.
export const PAGES = {
  dashboard: page(() => import('./pages/Dashboard')), settings: page(() => import('./pages/Settings')), inventory: page(() => import('./pages/Inventory')),
  prescriptions: page(() => import('./pages/Prescriptions')), box: page(() => import('./pages/MedicineBox')), audit: page(() => import('./pages/Audit')),
  tracker: page(() => import('./pages/Tracker')), reminders: page(() => import('./pages/Reminders')), refill: page(() => import('./pages/Refill')),
  family: page(() => import('./pages/Family')), caregiver: page(() => import('./pages/Caregiver')), appointments: page(() => import('./pages/Appointments')),
  assistant: page(() => import('./pages/Assistant')), contacts: page(() => import('./pages/Contacts')), sos: page(() => import('./pages/Sos')),
  agents: page(() => import('./pages/Activity')), notifications: page(() => import('./pages/Notifications')),
  waste: page(() => import('./pages/Waste')), disposal: page(() => import('./pages/Disposal')), whatif: page(() => import('./pages/WhatIf')),
  compare: page(() => import('./pages/Compare')), demo: page(() => import('./pages/Demo')),
};

export default function App() {
  const { page: id } = useApp();
  useReminderNotifier();
  const [open, setOpen] = useState(false);
  const mainRef = useRef(null); const first = useRef(true);
  const Page = PAGES[id];
  const label = NAV.find((n) => n.id === id)?.label;

  // After every navigation: update the tab title, go to the top, and move keyboard and screen-reader focus to the new page.
  useEffect(() => {
    document.title = `${Page ? label : 'Page not found'} | MedGuard AI`;
    window.scrollTo(0, 0);
    if (first.current) { first.current = false; return; }
    mainRef.current?.focus({ preventScroll: true });
  }, [id, Page, label]);

  return (
    <MotionConfig reducedMotion="user">
    <SosUiProvider>
      <div className="min-h-screen">
        <a href="#main-content" className="skip-link" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to main content</a>
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="lg:pl-64">
          <div className="sticky top-0 z-20">
            <header className="flex items-center gap-3 border-b border-ivory-300 bg-ivory-100/95 px-4 py-2.5 backdrop-blur lg:hidden">
              <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="rounded-lg p-1.5 text-navy-900 hover:bg-mint-100"><Menu size={22} aria-hidden="true" /></button>
              <span className="flex flex-1 items-center gap-2 font-extrabold text-navy-900"><LogoMark size={28} />MedGuard AI</span>
              <SosButton />
            </header>
            <ActiveBanner />
          </div>
          <main id="main-content" ref={mainRef} tabIndex={-1} className="mx-auto max-w-7xl p-4 lg:p-8">
            <ErrorBoundary key={id}>
              <Suspense fallback={<PageSkeleton />}>
                <motion.div key={id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }}>{Page ? <Page /> : <NotFound id={id} />}</motion.div>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SosUiProvider>
    </MotionConfig>
  );
}

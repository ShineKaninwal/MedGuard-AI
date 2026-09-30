import { LayoutDashboard, ShieldCheck, FileText, Pill, Package, CalendarCheck, Bell, RefreshCw, HeartHandshake, Users, CalendarDays, Bot, Activity, BellRing, BarChart3, Trash2, Scale, FlaskConical, Phone, Siren, Settings, PlayCircle } from 'lucide-react';

// Every entry here has a page registered in App.jsx (checked by the link test). `group` only decides the heading in the sidebar.
export const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'notifications', label: 'Notifications', icon: BellRing, group: 'Overview' },
  { id: 'demo', label: 'Demo Guide', icon: PlayCircle, group: 'Overview' },

  { id: 'inventory', label: 'Medicine Inventory', icon: Pill, group: 'Medicines' },
  { id: 'box', label: 'Digital Medicine Box', icon: Package, group: 'Medicines' },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText, group: 'Medicines' },
  { id: 'audit', label: 'AI Medicine Audit', icon: ShieldCheck, group: 'Medicines' },
  { id: 'agents', label: 'Agent Activity', icon: Activity, group: 'Medicines' },

  { id: 'tracker', label: 'Daily Medication Tracker', icon: CalendarCheck, group: 'Daily care' },
  { id: 'reminders', label: 'Reminders', icon: Bell, group: 'Daily care' },
  { id: 'refill', label: 'Supply and Refill Planner', icon: RefreshCw, group: 'Daily care' },
  { id: 'assistant', label: 'AI Health Assistant', icon: Bot, group: 'Daily care' },

  { id: 'caregiver', label: 'Caregiver Dashboard', icon: HeartHandshake, group: 'Family' },
  { id: 'family', label: 'Family Profiles', icon: Users, group: 'Family' },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays, group: 'Family' },

  { id: 'waste', label: 'Waste Analytics', icon: BarChart3, group: 'Sustainability' },
  { id: 'disposal', label: 'Medicine Disposal Guide', icon: Trash2, group: 'Sustainability' },
  { id: 'whatif', label: 'What-If Simulator', icon: FlaskConical, group: 'Sustainability' },
  { id: 'compare', label: 'Price Comparison (demo)', icon: Scale, group: 'Sustainability' },

  { id: 'contacts', label: 'Emergency Contacts', icon: Phone, group: 'Safety' },
  { id: 'sos', label: 'Emergency SOS', icon: Siren, group: 'Safety', danger: true },

  { id: 'settings', label: 'Settings', icon: Settings, group: 'Other' },
];
export const GROUPS = [...new Set(NAV.map((n) => n.group))];

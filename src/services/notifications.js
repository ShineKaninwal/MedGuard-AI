// Stage 7 notification service. All UI and state code talks only to this module, so a real
// backend (SMS gateway, push service) can replace the provider without touching components.
//
// Provider contract:  send({ notification, message }) => Promise<{ status: 'sent' | 'failed', error?: string }>
// The bundled 'simulated' provider NEVER contacts anyone. Its 'sent' status means "simulated sent".
import { NOTIFY_PROVIDER } from '../config/sos';
import { validPhone } from '../utils/phone';
import { typeLabel } from '../config/sos';

const uid = () => Math.random().toString(36).slice(2, 9);
export const fmtDateTime = (ts) => new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });
export const fmtClock = (ts) => new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' });

export const newAlertId = (ts = Date.now()) => {
  const d = new Date(ts); const p = (n) => String(n).padStart(2, '0');
  return `SOS-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

// One SMS per recipient. Push is only planned for people who would use the app (family, caregivers).
export const channelsFor = (contact) => (['family', 'caregiver'].includes(contact.category) ? ['sms', 'push'] : ['sms']);

export function buildNotifications(contacts, kind = 'alert') {
  const at = Date.now();
  return contacts.flatMap((c) => channelsFor(c).map((channel) => ({
    id: `n${at.toString(36)}${uid()}`, kind, channel, contactId: c.id, contactName: c.name, contactPhone: c.phone, contactRole: c.category,
    status: 'pending', createdAt: at, at, error: null, simulated: true,
  })));
}

// Text that WOULD be sent. Medical details appear only if the user ticked them for this alert.
export function buildMessage(a, kind = 'alert') {
  if (kind === 'update') {
    return `MedGuard AI update: the SOS alert ${a.id} for ${a.patientName} was ${a.status === 'resolved' ? 'marked resolved' : 'cancelled'} at ${fmtDateTime(a.closedAt || Date.now())}.`;
  }
  const lines = [`MedGuard AI SOS: ${a.patientName} needs help.`, `Emergency type: ${typeLabel(a.type)}.`, `Alert time: ${fmtDateTime(a.createdAt)}. Alert ID: ${a.id}.`];
  if (a.location?.status === 'shared') lines.push(`Location: https://maps.google.com/?q=${a.location.lat},${a.location.lng}`);
  const s = a.shared || {}; const bits = [];
  if (s.age != null) bits.push(`Age ${s.age}`);
  if (s.conditions) bits.push(`Conditions: ${s.conditions.join(', ') || 'none recorded'}`);
  if (s.allergies) bits.push(`Allergies: ${s.allergies.join(', ') || 'none recorded'}`);
  if (s.medicines) bits.push(`Medicines: ${s.medicines.join(', ') || 'none recorded'}`);
  if (bits.length) lines.push(`Shared with the patient's permission: ${bits.join('. ')}.`);
  lines.push('Please call them now. If it is life-threatening, call 112.');
  return lines.join('\n');
}

const simulatedProvider = {
  name: 'simulated',
  send: ({ notification, options = {} }) => new Promise((resolve) => {
    const wait = 600 + Math.random() * 1600;
    setTimeout(() => {
      if (options.simulateFailure) return resolve({ status: 'failed', error: 'Demo setting: simulated failure' });
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return resolve({ status: 'failed', error: 'Device is offline (simulated check)' });
      if (notification.channel === 'sms' && !validPhone(notification.contactPhone)) return resolve({ status: 'failed', error: 'Phone number looks invalid' });
      return resolve({ status: 'sent' });
    }, wait);
  }),
};
const PROVIDERS = { simulated: simulatedProvider };
export const provider = () => PROVIDERS[NOTIFY_PROVIDER] || simulatedProvider;

export async function deliver(notification, alert, options) {
  try { return await provider().send({ notification, message: buildMessage(alert, notification.kind), options }); }
  catch (e) { return { status: 'failed', error: e?.message || 'Delivery failed' }; }
}

export const STATUS_LABEL = { sent: 'Simulated sent', pending: 'Pending', failed: 'Failed' };
export const CHANNEL_LABEL = { sms: 'SMS', push: 'Push' };
export const countStatus = (list = []) => ({ sent: list.filter((n) => n.status === 'sent').length, pending: list.filter((n) => n.status === 'pending').length, failed: list.filter((n) => n.status === 'failed').length });

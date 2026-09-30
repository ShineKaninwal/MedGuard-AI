// Stage 7: Emergency SOS configuration.
import { EMERGENCY_NUMBERS } from '../utils/safety';

// India: 112 is the national emergency response number, 108 is the ambulance line in many states.
// Confirm the correct numbers for your region before any real-world use.
export const NUMBERS = { general: EMERGENCY_NUMBERS.general, ambulance: EMERGENCY_NUMBERS.ambulance };

export const EMERGENCY_TYPES = [
  { id: 'general', label: 'General emergency', hint: 'Not sure, or need help right now' },
  { id: 'medical', label: 'Medical emergency', hint: 'Sudden serious health problem' },
  { id: 'accident', label: 'Accident', hint: 'Fall, crash, burn or injury' },
  { id: 'symptoms', label: 'Severe symptoms', hint: 'Symptoms that are getting worse fast' },
  { id: 'other', label: 'Other emergency', hint: 'Any other urgent danger' },
];
export const typeLabel = (id) => EMERGENCY_TYPES.find((t) => t.id === id)?.label || 'General emergency';

export const CONTACT_ROLES = [
  { id: 'family', label: 'Family member' },
  { id: 'caregiver', label: 'Caregiver' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'hospital', label: 'Hospital' },
  { id: 'ambulance', label: 'Ambulance service' },
];
export const roleLabel = (id) => CONTACT_ROLES.find((r) => r.id === id)?.label || 'Contact';

// Medical details that can be added to an alert. Every one is OFF unless the user ticks it.
export const SHARE_FIELDS = [
  { id: 'age', label: 'Age' },
  { id: 'conditions', label: 'Medical conditions' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'medicines', label: 'Current medicines (names only)' },
];

// Notification provider. 'simulated' never contacts anyone. To integrate a backend, add a provider
// in src/services/notifications.js (see README) and switch this value.
export const NOTIFY_PROVIDER = 'simulated';
export const SIMULATED_NOTICE = 'SIMULATED: this prototype does not send real SMS or push notifications. Nobody has been contacted by this app.';

import { longDate } from './medicine';

export const SUGGESTED_QUESTIONS = [
  'What might be causing these symptoms?',
  'Are any tests or examinations needed?',
  'Could any of my current medicines be related?',
  'What signs should make me come back or seek urgent care?',
  'How long should I expect this to last?',
];

// Plain-text notes built only from what the person entered. No advice, no suggested treatment.
export function buildNotes({ patient, entries, meds, questions, notes, appt }) {
  const L = [`NOTES FOR DOCTOR VISIT: ${patient.name}, age ${patient.age}`];
  if (appt) L.push(`Appointment: ${appt.doctor}${appt.specialty ? ` (${appt.specialty})` : ''}, ${longDate(appt.date)} ${appt.time}`);
  L.push('', 'Conditions on record: ' + (patient.conditions.join(', ') || 'none recorded'), 'Allergies on record: ' + (patient.allergies.join(', ') || 'none recorded'));
  L.push('', 'Medicines on record in MedGuard (may be incomplete, please confirm):', ...(meds.length ? meds.map((m) => `- ${m.name}`) : ['- none recorded']));
  L.push('', 'Symptoms as reported by me (oldest first):');
  if (!entries.length) L.push('- none selected');
  entries.forEach((e) => L.push(`- ${longDate(e.date)}: ${e.text}. Duration: ${e.duration}. My severity rating: ${e.severity}/10.${e.notes ? ` Notes: ${e.notes}` : ''}`));
  if (questions.length) L.push('', 'Questions I want to ask:', ...questions.map((q, i) => `${i + 1}. ${q}`));
  if (notes.trim()) L.push('', 'Other notes:', notes.trim());
  L.push('', 'Prepared by the user with MedGuard AI (prototype). Symptom entries are self-reported and are not a diagnosis or medical advice.');
  return L.join('\n');
}

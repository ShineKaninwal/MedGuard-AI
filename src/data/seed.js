// Centralized sample data (fictional). Dates are relative to today so the demo always looks current.
import { daysFromNow, todayKey } from '../utils/dates';

export const seed = () => ({
  selectedPatientId: 'p1',
  patients: [
    { id: 'p1', name: 'Ravi Kumar', age: 64, relation: 'Father', conditions: ['Type 2 Diabetes', 'Hypertension'], allergies: ['Penicillin'] },
    { id: 'p2', name: 'Meena Kumar', age: 60, relation: 'Mother', conditions: ['Hypothyroidism', 'Arthritis'], allergies: [] },
    { id: 'p3', name: 'Arjun Kumar', age: 9, relation: 'Son', conditions: ['Seasonal asthma'], allergies: ['Dust'] },
  ],
  medicines: [
    { id: 'm1', patientId: 'p1', name: 'Metformin 500mg', generic: 'Metformin', form: 'Tablet', qty: 42, minQty: 20, expiry: daysFromNow(210), cost: 180 },
    { id: 'm2', patientId: 'p1', name: 'Amlodipine 5mg', generic: 'Amlodipine', form: 'Tablet', qty: 9, minQty: 14, expiry: daysFromNow(140), cost: 95 },
    { id: 'm3', patientId: 'p1', name: 'Paracetamol 500mg', generic: 'Paracetamol', form: 'Tablet', qty: 16, minQty: 10, expiry: daysFromNow(25), cost: 30 },
    { id: 'm4', patientId: 'p1', name: 'Dolo 650', generic: 'Paracetamol', form: 'Tablet', qty: 12, minQty: 10, expiry: daysFromNow(300), cost: 34 },
    { id: 'm5', patientId: 'p1', name: 'Cough Syrup DX', generic: 'Dextromethorphan', form: 'Syrup', qty: 1, minQty: 1, expiry: daysFromNow(-12), cost: 110 },
    { id: 'm6', patientId: 'p2', name: 'Thyroxine 50mcg', generic: 'Levothyroxine', form: 'Tablet', qty: 5, minQty: 14, expiry: daysFromNow(400), cost: 210 },
    { id: 'm7', patientId: 'p2', name: 'Diclofenac Gel', generic: 'Diclofenac', form: 'Gel', qty: 1, minQty: 1, expiry: daysFromNow(48), cost: 85 },
    { id: 'm8', patientId: 'p3', name: 'Salbutamol Inhaler', generic: 'Salbutamol', form: 'Inhaler', qty: 60, minQty: 40, expiry: daysFromNow(180), cost: 165 },
    { id: 'm9', patientId: 'p3', name: 'Cetirizine Syrup', generic: 'Cetirizine', form: 'Syrup', qty: 1, minQty: 1, expiry: daysFromNow(35), cost: 60 },
  ],
  reminders: [
    { id: 'r1', patientId: 'p1', medicineId: 'm1', time: '08:00', dose: '1 tablet after breakfast', takenOn: todayKey() },
    { id: 'r2', patientId: 'p1', medicineId: 'm2', time: '09:00', dose: '1 tablet', takenOn: null },
    { id: 'r3', patientId: 'p1', medicineId: 'm1', time: '20:00', dose: '1 tablet after dinner', takenOn: null },
    { id: 'r4', patientId: 'p2', medicineId: 'm6', time: '06:30', dose: '1 tablet, empty stomach', takenOn: null },
    { id: 'r5', patientId: 'p3', medicineId: 'm8', time: '21:00', dose: '2 puffs', takenOn: null },
  ],
  prescriptions: [
    { id: 'rx1', patientId: 'p1', doctor: 'Dr. Anitha Rao', date: daysFromNow(-20), medicineIds: ['m1', 'm2'] },
    { id: 'rx2', patientId: 'p2', doctor: 'Dr. S. Mehta', date: daysFromNow(-45), medicineIds: ['m6', 'm7'] },
  ],
  appointments: [
    { id: 'a1', patientId: 'p1', doctor: 'Dr. Anitha Rao', specialty: 'Endocrinology', date: daysFromNow(3), time: '10:30' },
    { id: 'a2', patientId: 'p2', doctor: 'Dr. S. Mehta', specialty: 'Rheumatology', date: daysFromNow(9), time: '16:00' },
    { id: 'a3', patientId: 'p3', doctor: 'Dr. Kiran Patel', specialty: 'Pediatrics', date: daysFromNow(15), time: '11:15' },
  ],
  alerts: [],
  activity: [
    { id: 'ac1', sample: true, agent: 'Expiry Agent', text: 'Scanned 9 medicines for expiry dates', ts: Date.now() - 36e5 * 2 },
    { id: 'ac2', sample: true, agent: 'Refill Agent', text: 'Flagged Thyroxine 50mcg as running low', ts: Date.now() - 36e5 * 5 },
    { id: 'ac3', sample: true, agent: 'Reminder Agent', text: 'Sent 08:00 reminder for Ravi Kumar', ts: Date.now() - 36e5 * 8 },
  ],
  disposals: [],
});

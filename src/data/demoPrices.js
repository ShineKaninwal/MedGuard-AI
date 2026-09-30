// FICTIONAL demo prices. They were made up for this prototype. They are not real prices, not from any pharmacy, brand, manufacturer or price
// database, and must never be shown without the "Demo data" label. Product names are generic placeholders on purpose.
export const DEMO_LABEL = 'Demo data';

const A = 'Sample brand A'; const B = 'Sample generic B'; const C = 'Sample store label C';
const T = { A: 'Branded product', B: 'Generic-named product', C: 'Store label product' };
const item = (id, label, type, strength, pack, packSize, price) => ({ id, label, type, strength, pack, packSize, price });

export const DEMO_PRICES = [
  { ingredient: 'Metformin', form: 'Tablet', unit: 'tablet', items: [
    item('met-a', A, T.A, '500 mg', 'Strip of 10', 10, 32), item('met-b', B, T.B, '500 mg', 'Strip of 10', 10, 19), item('met-c', C, T.C, '850 mg', 'Strip of 10', 10, 26)] },
  { ingredient: 'Amlodipine', form: 'Tablet', unit: 'tablet', items: [
    item('aml-a', A, T.A, '5 mg', 'Strip of 15', 15, 48), item('aml-b', B, T.B, '5 mg', 'Strip of 15', 15, 22), item('aml-c', C, T.C, '10 mg', 'Strip of 15', 15, 35)] },
  { ingredient: 'Paracetamol', form: 'Tablet', unit: 'tablet', items: [
    item('par-a', A, T.A, '500 mg', 'Strip of 10', 10, 18), item('par-b', B, T.B, '500 mg', 'Strip of 10', 10, 9), item('par-c', C, T.C, '650 mg', 'Strip of 15', 15, 28)] },
  { ingredient: 'Levothyroxine', form: 'Tablet', unit: 'tablet', items: [
    item('lev-a', A, T.A, '50 mcg', 'Bottle of 100', 100, 185), item('lev-b', B, T.B, '50 mcg', 'Bottle of 100', 100, 120), item('lev-c', C, T.C, '25 mcg', 'Bottle of 100', 100, 95)] },
  { ingredient: 'Amoxicillin', form: 'Capsule', unit: 'capsule', items: [
    item('amo-a', A, T.A, '250 mg', 'Strip of 10', 10, 68), item('amo-b', B, T.B, '250 mg', 'Strip of 10', 10, 42), item('amo-c', C, T.C, '500 mg', 'Strip of 10', 10, 78)] },
  { ingredient: 'Cetirizine', form: 'Syrup', unit: 'ml', items: [
    item('cet-a', A, T.A, '5 mg per 5 ml', 'Bottle of 60 ml', 60, 62), item('cet-b', B, T.B, '5 mg per 5 ml', 'Bottle of 60 ml', 60, 38)] },
  { ingredient: 'Dextromethorphan', form: 'Syrup', unit: 'ml', items: [
    item('dex-a', A, T.A, '10 mg per 5 ml', 'Bottle of 100 ml', 100, 110), item('dex-b', B, T.B, '10 mg per 5 ml', 'Bottle of 100 ml', 100, 72)] },
  { ingredient: 'Diclofenac', form: 'Gel', unit: 'g', items: [
    item('dic-a', A, T.A, '1% w/w', 'Tube of 30 g', 30, 85), item('dic-b', B, T.B, '1% w/w', 'Tube of 30 g', 30, 52)] },
  { ingredient: 'Salbutamol', form: 'Inhaler', unit: 'dose', items: [
    item('sal-a', A, T.A, '100 mcg per dose', 'Inhaler, 200 doses', 200, 165), item('sal-b', B, T.B, '100 mcg per dose', 'Inhaler, 200 doses', 200, 120)] },
];

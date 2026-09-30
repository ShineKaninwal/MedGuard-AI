import { useMemo, useState } from 'react';
import { Scale, Search, MessageCircleQuestion, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Notice, PageHeader, inputCls } from '../components/ui';
import { DEMO_PRICES, DEMO_LABEL } from '../data/demoPrices';

const perUnit = (i) => i.price / i.packSize;
const fmtUnit = (n) => `₹${n < 1 ? n.toFixed(2) : n.toFixed(n < 10 ? 2 : 1)}`;
const DemoTag = () => <span className="ml-1.5 rounded bg-slate-800 px-1.5 py-0.5 align-middle text-[11px] font-extrabold uppercase tracking-wide text-white">Demo</span>;

const QUESTIONS = [
  'Is this product the right strength and form for me, given my prescription?',
  'Is it appropriate for me to use a different product, and who should decide that?',
  'Do the inactive ingredients matter for my allergies?',
  'Is there anything to watch for if the product I use changes?',
  'Where can I check the real price at a licensed pharmacy?',
];

export default function Compare() {
  const { medicines } = useApp();
  const [q, setQ] = useState(''); const [pick, setPick] = useState(DEMO_PRICES[0].ingredient); const [sort, setSort] = useState('name');
  const matches = useMemo(() => DEMO_PRICES.filter((d) => d.ingredient.toLowerCase().includes(q.trim().toLowerCase())), [q]);
  const sel = DEMO_PRICES.find((d) => d.ingredient === pick && matches.includes(d)) || matches[0];
  const mine = sel ? medicines.filter((m) => (m.generic || '').toLowerCase() === sel.ingredient.toLowerCase()) : [];
  const items = sel ? [...sel.items].sort((a, b) => (sort === 'price' ? perUnit(a) - perUnit(b) : a.label.localeCompare(b.label))) : [];
  const strengths = sel ? [...new Set(sel.items.map((i) => i.strength))] : [];
  const inInventory = new Set(medicines.map((m) => (m.generic || '').toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader icon={Scale} title="Price Comparison" subtitle="A prototype of how a medicine price comparison could look." />

      <div role="note" className="rounded-2xl bg-slate-800 p-4 text-white">
        <p className="flex items-center gap-2 text-base font-extrabold"><AlertTriangle size={18} aria-hidden="true" />{DEMO_LABEL}: these prices are fictional</p>
        <p className="mt-1 text-sm text-slate-200">Every price on this page was made up for the demo. They are not real prices and do not come from any pharmacy, brand or price database. Real prices vary by pharmacy, place, pack size and time.</p>
      </div>
      <Notice tone="red">Products that share an active ingredient are <b>not necessarily interchangeable</b>. Strength, form, brand, ingredients and your own health all matter. This page does not recommend switching or changing any medicine. Only your prescriber or pharmacist can advise on that.</Notice>

      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block text-xs font-semibold text-slate-600">Find an active ingredient
            <div className="relative mt-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-500" aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="For example, Metformin" className={`${inputCls} pl-9`} /></div></label>
          <label className="block text-xs font-semibold text-slate-600">Sort rows by
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${inputCls} mt-1`}><option value="name">Product name</option><option value="price">Demo price per unit</option></select></label>
        </div>
        <div role="group" aria-label="Active ingredients with demo prices" className="mt-3 flex flex-wrap gap-1.5">
          {matches.map((d) => (
            <button key={d.ingredient} aria-pressed={sel?.ingredient === d.ingredient} onClick={() => setPick(d.ingredient)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${sel?.ingredient === d.ingredient ? 'bg-navy-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}>
              {d.ingredient}{inInventory.has(d.ingredient.toLowerCase()) && <span className="ml-1.5 font-semibold opacity-80">(in your inventory)</span>}</button>))}
        </div>
      </Card>

      {!sel ? <Empty icon={Search}>No demo prices for "{q}". This prototype has sample prices for only a few ingredients: {DEMO_PRICES.map((d) => d.ingredient).join(', ')}.</Empty> : (
        <Card title={`${sel.ingredient} (${sel.form.toLowerCase()}) sample products`} action={<Badge tone="dark">{DEMO_LABEL}</Badge>}>
          {strengths.length > 1 && <Notice tone="amber" className="mb-3">The products below come in different strengths ({strengths.join(', ')}). A different strength is a different product for treatment purposes. Do not treat these as equivalent.</Notice>}
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Fictional demo prices for {sel.ingredient} products</caption>
              <thead className="text-xs text-slate-500"><tr>{['Product', 'Type', 'Strength', 'Pack', 'Demo price', `Demo price per ${sel.unit}`].map((h) => <th key={h} scope="col" className="px-2 py-2 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{items.map((i) => (
                <tr key={i.id} className="border-t border-slate-100">
                  <th scope="row" className="px-2 py-3 font-semibold">{i.label}</th>
                  <td className="px-2 py-3 text-slate-600">{i.type}</td><td className="px-2 py-3 tabular-nums">{i.strength}</td><td className="px-2 py-3 text-slate-600">{i.pack}</td>
                  <td className="px-2 py-3 font-bold tabular-nums">₹{i.price}<DemoTag /></td>
                  <td className="px-2 py-3 tabular-nums">{fmtUnit(perUnit(i))}<DemoTag /></td>
                </tr>))}</tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Price per unit is the demo pack price divided by the pack size. It is shown for arithmetic only, and says nothing about which product suits you.</p>
          {mine.length > 0 && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><b>In your inventory:</b> {mine.map((m) => `${m.name}${m.strength && !m.name.includes(m.strength.replace(/\s/g, '')) ? ` (${m.strength})` : ''}`).join(', ')}. Keep using what your prescriber and pharmacist gave you.</p>}
        </Card>)}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Reading this list">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            <li>"Branded", "generic-named" and "store label" describe how a product is sold, not whether it is right for you.</li>
            <li>A lower or higher price does not tell you anything about quality or suitability.</li>
            <li>MedGuard never orders, sells or switches medicines.</li>
            <li>Never stop, swap or change a dose because of a price.</li>
          </ul>
        </Card>
        <Card title="Questions to ask your pharmacist or doctor">
          <ul className="space-y-2 text-sm text-slate-600">{QUESTIONS.map((t) => <li key={t} className="flex gap-2"><MessageCircleQuestion size={16} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />{t}</li>)}</ul>
        </Card>
      </div>
    </div>
  );
}

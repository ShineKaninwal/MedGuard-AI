import { Trash2, AlertTriangle, Ban, ExternalLink, ShieldAlert, ChevronDown, Phone, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, Notice, PageHeader } from '../components/ui';
import { useConfirm } from '../components/Feedback';
import { DISPOSAL_TYPES, NEVER, TRASH_STEPS, SOURCES, typeFor } from '../config/disposal';
import { NUMBERS } from '../config/sos';
import { telHref } from '../utils/phone';
import { expiryStatus, longDate } from '../utils/medicine';

const STEPS = [
  ['Keep taking medicines you still need', 'If a medicine you rely on has expired, contact your pharmacist or doctor for a replacement. Do not go without it.'],
  ['Set expired medicines aside', 'Put them in a separate, closed container, out of reach of children and pets, so nobody takes them by mistake.'],
  ['Ask your pharmacy about take-back', 'Returning unused medicines to a pharmacy or an authorised collection point is generally the best option. Ask what they accept.'],
  ['Check local and government guidance', 'India\'s drug regulator (CDSCO) has issued guidance on disposing of expired and unused medicines, and some states run take-back programmes. Availability differs by place, so ask your local pharmacy, drug-control department or municipal body.'],
  ['Follow their instructions for anything else', 'If there is no take-back option, ask what your local rules allow before using household waste (see below).'],
  ['Protect your privacy', 'Remove or scratch out your name and prescription details on labels before discarding empty packaging.'],
];

export default function Disposal() {
  const { medicines, patients, recordDisposal } = useApp();
  const confirm = useConfirm();
  const expired = medicines.filter((m) => expiryStatus(m.expiry).key === 'expired').sort((a, b) => a.expiry.localeCompare(b.expiry));
  const who = (id) => patients.find((p) => p.id === id)?.name.split(' ')[0];

  const markDisposed = async (m) => {
    const ok = await confirm({ title: `Record disposal of ${m.name}?`, confirmLabel: "Yes, I've disposed of it", tone: 'navy',
      body: (<><p>This removes {m.name} and its reminders from your inventory and adds a disposal record for Waste Analytics.</p>
        <p className="font-semibold text-slate-800">It does not dispose of the medicine for you. Do that safely first, using the guide on this page.</p>
        <p>If you still need this medicine, contact your pharmacist or doctor for a replacement.</p></>) });
    if (ok) recordDisposal(m.id, 'expired');
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={Trash2} title="Medicine Disposal Guide" subtitle="General guidance on getting rid of expired or unused medicines safely." />
      <Notice tone="amber">This is general information, not legal or medical advice. Rules and collection options differ by state, city and type of medicine. Always follow the advice of your local pharmacy, your doctor, and your local or national health and waste authorities.</Notice>

      <Card title="Safe disposal, step by step">
        <ol className="space-y-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-extrabold text-white" aria-hidden="true">{i + 1}</span>
              <div><p className="text-sm font-bold">{t}</p><p className="text-sm text-slate-600">{d}</p></div></li>))}
        </ol>
      </Card>

      <Card title="Your expired medicines" action={<Badge tone={expired.length ? 'red' : 'green'}>{expired.length}</Badge>}>
        {expired.length === 0 ? (
          <Empty icon={CheckCircle2}>None of the medicines in your inventory are past their expiry date, so there is nothing to dispose of right now.</Empty>
        ) : (<>
          <p className="mb-3 text-sm text-slate-600">These are past their recorded expiry date. Set them aside now, then dispose of them using the guidance for their type.</p>
          <ul className="space-y-3">
            {expired.map((m) => { const t = typeFor(m.form); return (
              <li key={m.id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-bold">{m.name} <Badge tone="red">Expired {-expiryStatus(m.expiry).days} days ago</Badge></p>
                    <p className="text-xs text-slate-500">{[m.strength, m.form].filter(Boolean).join(', ')}. {who(m.patientId)}. Expired {longDate(m.expiry)}. {m.qty} in stock.</p></div>
                  <button onClick={() => markDisposed(m)} className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800">I've disposed of this</button>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-700">{t.label}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">{t.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </li>); })}
          </ul>
        </>)}
      </Card>

      <Card title="Guidance by type of medicine">
        <div className="space-y-2">
          {DISPOSAL_TYPES.map((t) => (
            <details key={t.id} className="group rounded-xl ring-1 ring-slate-100">
              <summary className="flex items-center justify-between px-4 py-3 text-sm font-bold">{t.label}<ChevronDown size={16} className="transition group-open:rotate-180" aria-hidden="true" /></summary>
              <ul className="list-disc space-y-1 border-t border-slate-100 px-4 py-3 pl-9 text-sm text-slate-600">{t.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </details>))}
          <details className="group rounded-xl ring-1 ring-slate-100">
            <summary className="flex items-center justify-between px-4 py-3 text-sm font-bold">Strong, controlled or cancer medicines<ChevronDown size={16} className="transition group-open:rotate-180" aria-hidden="true" /></summary>
            <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">Some medicines have special rules because they can be harmful to others or can be misused. Ask the pharmacist or clinic that supplied them how to return them. Do not put them in household waste unless they tell you to.</p>
          </details>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Never do these">
          <ul className="space-y-2">{NEVER.map((n) => <li key={n} className="flex gap-2 text-sm text-slate-700"><Ban size={16} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />{n}</li>)}</ul>
        </Card>
        <div className="space-y-5">
          <Card title="No take-back option nearby?">
            <p className="mb-2 text-sm text-slate-600">First ask your pharmacist or local authority what is allowed. <b>Only if they confirm that household waste is acceptable</b> for that medicine, common public guidance for tablets and capsules is:</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">{TRASH_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="mt-2 text-xs text-slate-500">This does not apply to sharps, inhalers, liquids or medicines with special instructions. See the sections above.</p>
          </Card>
          <Card className="!bg-red-50 ring-red-100">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-red-800"><ShieldAlert size={17} aria-hidden="true" />Someone swallowed a medicine by mistake?</h2>
            <p className="mt-1 text-sm text-red-900">Treat it as an emergency. Call for help straight away. Do not wait for symptoms.</p>
            <a href={telHref(NUMBERS.general)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-red-700"><Phone size={16} aria-hidden="true" />Call {NUMBERS.general}</a>
            <p className="mt-2 text-xs text-red-900">Opens your phone dialer. This app cannot place calls. Use your local emergency number outside India.</p>
          </Card>
        </div>
      </div>

      <Card title="Where this guidance comes from">
        <p className="mb-2 text-sm text-slate-600">Summarised from public guidance from health and environment authorities. It has not been reviewed by a pharmacist or regulator for this app, so check the official pages and your local rules.</p>
        <ul className="space-y-1.5 text-sm">{SOURCES.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-teal-600 underline">{s.label}<ExternalLink size={13} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></a> <span className="text-xs text-slate-500">{s.note}</span></li>)}</ul>
        <p className="mt-3 flex items-start gap-2 text-xs text-slate-500"><AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />Two of these sources describe US practice. Use them for general principles only.</p>
      </Card>
    </div>
  );
}

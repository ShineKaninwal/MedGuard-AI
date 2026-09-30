import { CheckCircle2, XCircle, UserCheck, FileText, FlaskConical, Fingerprint, Cpu } from 'lucide-react';
import { POLICY, CAMERA_CAPTURE_APPROVED, CAMERA_NOTICE } from '../config/policy';
import { Card, Notice } from './ui';

const List = ({ items, icon: Icon, cls }) => (
  <ul className="space-y-2 text-sm">{items.map((t) => <li key={t} className="flex items-start gap-2"><Icon size={16} className={`mt-0.5 shrink-0 ${cls}`} aria-hidden="true" /><span>{t}</span></li>)}</ul>
);
const Block = ({ icon: Icon, title, children }) => (
  <div><h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold"><Icon size={16} className="text-teal-600" aria-hidden="true" />{title}</h3>{children}</div>
);
const Plain = ({ items }) => <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">{items.map((t) => <li key={t}>{t}</li>)}</ul>;

// The written policy. It describes what the code in this project actually does; keep it in sync with config/policy.js.
export default function AgentPolicy() {
  return (
    <Card title="Agent Safety Policy" className="scroll-mt-4" >
      <div id="agent-policy" className="space-y-6">
        <p className="text-sm text-slate-700">MedGuard AI helps you keep track of medicines. It is a hackathon prototype. It is not a medical device and has not been reviewed by clinicians or regulators.</p>
        <div className="grid gap-6 md:grid-cols-2">
          <Block icon={CheckCircle2} title="What the AI can do"><List items={POLICY.can} icon={CheckCircle2} cls="text-teal-600" /></Block>
          <Block icon={XCircle} title="What the AI cannot do"><List items={POLICY.cannot} icon={XCircle} cls="text-red-600" /></Block>
        </div>
        <Block icon={UserCheck} title="Actions that need your confirmation">
          <dl className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-100">{POLICY.confirm.map(([a, b]) => (
            <div key={a} className="grid gap-1 px-3 py-2.5 text-sm sm:grid-cols-2"><dt className="font-semibold">{a}</dt><dd className="text-slate-600">{b}</dd></div>))}</dl>
        </Block>
        <div className="grid gap-6 md:grid-cols-2">
          <Block icon={FileText} title="How prescription information is handled">
            <Plain items={POLICY.prescriptions} />
            <Notice tone={CAMERA_CAPTURE_APPROVED ? 'amber' : 'slate'} className="mt-3">{CAMERA_CAPTURE_APPROVED ? 'Camera capture is flagged as approved in config/policy.js.' : CAMERA_NOTICE}</Notice>
          </Block>
          <Block icon={Cpu} title="What is real, and what is not">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Real (deterministic code)</p><Plain items={POLICY.real} />
            <p className="mb-1 mt-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><FlaskConical size={12} aria-hidden="true" />Simulated</p><Plain items={POLICY.simulated} />
          </Block>
        </div>
        <Block icon={Fingerprint} title="What is fictional in this demo"><Plain items={POLICY.fictional} /></Block>
      </div>
    </Card>
  );
}

// Short reminder for the top of the Audit and Assistant pages.
export const PolicyLink = () => <a href="#/settings" className="font-bold underline underline-offset-2">Read the Agent Safety Policy</a>;

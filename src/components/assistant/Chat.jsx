import { useEffect, useRef, useState } from 'react';
import { Send, Trash2, Bot, User, BookmarkPlus, ClipboardList, FlaskConical } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../ui';
import { useConfirm } from '../Feedback';
import { EmergencyCard } from './EmergencyCard';
import { checkConversation } from '../../utils/safety';
import { generateReply, mk, SUGGESTED } from '../../utils/assistant';
import { HAS_AI_SERVICE, SAMPLE_LABEL } from '../../config/assistant';

const Dots = () => (
  <div className="flex items-end gap-2" role="status"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600"><Bot size={16} /></span>
    <div className="flex gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">{[0, 150, 300].map((d) => <span key={d} style={{ animationDelay: `${d}ms` }} className="h-2 w-2 animate-bounce rounded-full bg-slate-400 motion-reduce:animate-none" />)}</div>
    <span className="sr-only">The assistant is typing</span></div>
);

const Lines = ({ text }) => text.split('\n').map((l, i) => (l.startsWith('- ') ? <li key={i} className="ml-4 list-disc">{l.slice(2)}</li> : l ? <p key={i} className="mt-1.5 first:mt-0">{l}</p> : null));

function Bubble({ m, onChip, onSave, onPrep, last }) {
  if (m.role === 'user') return (
    <div className="flex items-end justify-end gap-2"><div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-navy-900 px-4 py-2.5 text-sm text-white">{m.text}</div>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-900 text-white"><User size={15} /></span></div>);
  if (m.kind === 'emergency') return <EmergencyCard rule={m.rule} level={m.level} />;
  return (
    <div className="flex items-end gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600"><Bot size={16} /></span>
      <div className="max-w-[88%]">
        <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5 text-sm leading-relaxed"><Lines text={m.text} /></div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700"><FlaskConical size={11} />{m.source === 'service' ? 'AI service reply, not clinically validated' : SAMPLE_LABEL}</span>
          {m.guarded && <span>Reply replaced by a safety filter</span>}
        </div>
        {m.draft && <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => onSave(m.draft)} className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700"><BookmarkPlus size={14} />Save to symptom history</button>
          <button onClick={onPrep} className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-navy-900 ring-1 ring-slate-200 hover:bg-slate-50"><ClipboardList size={14} />Prepare for a doctor visit</button></div>}
        {last && m.chips && <div className="mt-2 flex flex-wrap gap-1.5">{m.chips.map((c) => <button key={c} onClick={() => onChip(c)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-500/40 hover:bg-teal-50">{c}</button>)}</div>}
      </div></div>
  );
}

export default function Chat({ onSave, onPrep }) {
  const { patient, chats, addChat, clearChat, settings } = useApp();
  const confirm = useConfirm();
  const msgs = chats[patient.id] || [];
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false);
  const end = useRef(null); const box = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, busy]);
  useEffect(() => { setText(''); }, [patient.id]);

  const send = async (raw) => {
    const t = (raw ?? text).trim(); if (!t || busy) return; setText('');
    const pid = patient.id; const user = mk('user', t);
    // Safety first: emergency rules win over any generated reply and skip follow-up questions and the loading delay.
    const s = checkConversation(t, msgs);
    if (s.level === 'emergency') { addChat(pid, user, mk('assistant', '', { kind: 'emergency', level: 'emergency', rule: { id: s.rule.id, title: s.rule.title, crisis: !!s.rule.crisis }, source: 'rule' })); return; }
    // Urgent (not emergency) signs: the guidance card appears immediately, before the loading delay.
    const urgent = s.level === 'urgent' ? [mk('assistant', '', { kind: 'emergency', level: 'urgent', rule: { id: s.rule.id, title: s.rule.title }, source: 'rule' })] : [];
    addChat(pid, user, ...urgent); setBusy(true);
    const [r] = await Promise.all([generateReply(t, msgs, patient, { shareProfile: Boolean(settings?.shareProfileWithService) }), new Promise((res) => setTimeout(res, HAS_AI_SERVICE ? 300 : 900))]);
    addChat(pid, mk('assistant', r.text, r)); setBusy(false);
  };
  const clear = async () => { if (msgs.length && await confirm({ title: `Clear the chat with ${patient.name.split(' ')[0]}?`, body: 'Saved symptom history is not affected.', confirmLabel: 'Clear chat' })) clearChat(patient.id); };

  return (
    <div className="flex h-[calc(100vh-15rem)] min-h-[440px] flex-col rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-teal-600 text-white"><Bot size={18} /></span>
          <div><p className="text-sm font-extrabold leading-tight">Health assistant</p><p className="text-[11px] text-slate-500">Talking about <b>{patient.name}</b></p></div></div>
        <button onClick={clear} disabled={!msgs.length} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-40"><Trash2 size={14} />Clear chat</button>
      </div>
      <div ref={box} role="log" aria-live="polite" aria-label="Conversation" className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!msgs.length && (
          <div className="mx-auto max-w-md pt-4 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600"><Bot size={24} /></span>
            <p className="mt-3 font-extrabold">Describe how {patient.name.split(' ')[0]} is feeling</p>
            <p className="mt-1 text-sm text-slate-500">Write in your own words. I share general information only. I can't diagnose, recommend medicines or doses, or say a symptom is harmless.</p>
            <div className="mt-2 flex justify-center"><Badge tone="amber">{HAS_AI_SERVICE ? 'AI service connected, not clinically validated' : 'Prototype: replies are pre-written samples'}</Badge></div>
          </div>)}
        {msgs.map((m, i) => <Bubble key={m.id} m={m} last={i === msgs.length - 1 && !busy} onChip={send} onSave={onSave} onPrep={onPrep} />)}
        {busy && <Dots />}
        <div ref={end} />
      </div>
      <div className="border-t border-slate-100 p-3">
        {msgs.length < 2 && <div className="mb-2 flex flex-wrap gap-1.5" aria-label="Suggested questions">{SUGGESTED(patient).map((q) => <button key={q} disabled={busy} onClick={() => send(q)} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50">{q}</button>)}</div>}
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
          <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} aria-label={`Describe symptoms for ${patient.name}`}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Describe symptoms for ${patient.name.split(' ')[0]}...`} className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500" />
          <button disabled={!text.trim() || busy} aria-label="Send message" className="grid h-11 w-11 place-items-center rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40"><Send size={18} /></button>
        </form>
        <p className="mt-1.5 text-[11px] text-slate-500">Enter to send, Shift+Enter for a new line. Chats are stored in this browser.</p>
      </div>
    </div>
  );
}

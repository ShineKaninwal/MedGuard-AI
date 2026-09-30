import { useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, Timer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, Badge, Empty } from '../ui';
import { useConfirm } from '../Feedback';
import { SymptomModal, sevLabel, sevTone } from './SymptomModal';
import { longDate } from '../../utils/medicine';

export default function SymptomHistory() {
  const { symptoms, patients, patient, role, deleteSymptom } = useApp();
  const confirm = useConfirm();
  const [all, setAll] = useState(false); const [modal, setModal] = useState(null);
  const showAll = all && role === 'caregiver';
  const list = symptoms.filter((s) => showAll || s.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  const name = (id) => patients.find((p) => p.id === id)?.name;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{showAll ? 'Entries for the whole family.' : `Entries for ${patient.name}.`} Severity is the rating you gave, not a medical assessment.</p>
        <div className="flex items-center gap-2">
          {role === 'caregiver' && <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="accent-teal-500" />Whole family</label>}
          <button onClick={() => setModal({})} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"><Plus size={16} />Add entry</button>
        </div>
      </div>
      {list.length === 0 ? <Empty>No symptom entries yet. Add one here, or describe symptoms in the chat and choose "Save to symptom history".</Empty> : (
        <ul className="space-y-3">{list.map((e) => (
          <li key={e.id}><Card>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{e.text}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={13} />{longDate(e.date)}</span>
                  <span className="flex items-center gap-1"><Timer size={13} />{e.duration}</span>
                  <Badge tone={sevTone(e.severity)}>You rated it {e.severity}/10 ({sevLabel(e.severity)})</Badge>
                  {showAll && <Badge tone="teal">{name(e.patientId)}</Badge>}
                  {e.sample && <Badge>Sample entry</Badge>}
                </div>
                {e.notes && <p className="mt-2 text-xs text-slate-500">{e.notes}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button aria-label="Edit entry" onClick={() => setModal(e)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>
                <button aria-label="Delete entry" onClick={async () => (await confirm({ title: 'Delete this symptom entry?', confirmLabel: 'Delete entry' })) && deleteSymptom(e.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            </div>
          </Card></li>))}</ul>)}
      {modal && <SymptomModal initial={modal.id ? modal : undefined} onClose={() => setModal(null)} />}
    </div>
  );
}

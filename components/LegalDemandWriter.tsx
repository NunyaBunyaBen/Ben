import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  Download,
  FileText,
  Loader,
  Plus,
  Printer,
  Save,
  Trash2,
  Upload,
  Wand2,
  X
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type DemandCase = {
  id: string;
  client_name: string;
  case_number?: string | null;
  injury_type?: string | null;
  incident_date?: string | null;
  status?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type DemandDocument = {
  id: string;
  case_id: string;
  file_name: string;
  file_path?: string | null;
  file_size?: number | null;
  uploaded_at?: string | null;
};

type GeneratedDemand = {
  id: string;
  case_id: string;
  content: string;
  version: number;
  generated_at?: string | null;
};

type BuilderState = {
  letter_date: string;
  sender_firm: string;
  sender_name: string;
  sender_address: string;
  sender_phone: string;
  sender_email: string;
  recipient_name: string;
  recipient_company: string;
  recipient_address: string;
  claim_number: string;
  policy_number: string;
  insured_name: string;
  loss_location: string;
  incident_description: string;
  liability_summary: string;
  injuries_summary: string;
  treatment_summary: string;
  medical_specials: string;
  wage_loss: string;
  general_damages: string;
  demand_amount: string;
  response_deadline_days: string;
  delivery_method: string;
};

const LOCAL_KEYS = {
  cases: 'nbhq_demand_cases_v1',
  docs: (caseId: string) => `nbhq_demand_documents_v1_${caseId}`,
  demands: (caseId: string) => `nbhq_generated_demands_v1_${caseId}`
};

function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function formatCurrency(value: unknown) {
  const n =
    typeof value === 'number'
      ? value
      : Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatIsoDate(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function buildPersonalInjuryDemandLetter(caseItem: DemandCase, builder: BuilderState) {
  const today = builder.letter_date ? formatIsoDate(builder.letter_date) : formatIsoDate(new Date().toISOString());
  const incidentDate = caseItem.incident_date ? formatIsoDate(caseItem.incident_date) : '';

  const demandAmount = formatCurrency(builder.demand_amount);
  const specials = formatCurrency(builder.medical_specials);
  const wageLoss = formatCurrency(builder.wage_loss);
  const deadlineDays = builder.response_deadline_days || '15';

  const senderBlock = [
    builder.sender_firm,
    builder.sender_name,
    builder.sender_address,
    builder.sender_phone ? `Phone: ${builder.sender_phone}` : '',
    builder.sender_email ? `Email: ${builder.sender_email}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  const recipientBlock = [builder.recipient_name, builder.recipient_company, builder.recipient_address]
    .filter(Boolean)
    .join('\n');

  const subjectParts = [
    builder.claim_number ? `Claim No.: ${builder.claim_number}` : '',
    builder.policy_number ? `Policy No.: ${builder.policy_number}` : '',
    builder.insured_name ? `Insured: ${builder.insured_name}` : ''
  ].filter(Boolean);

  const caseLine = [
    caseItem.case_number ? `Our File: ${caseItem.case_number}` : '',
    caseItem.client_name ? `Client: ${caseItem.client_name}` : ''
  ].filter(Boolean);

  const incidentLine = [
    incidentDate ? `Date of Loss: ${incidentDate}` : '',
    builder.loss_location ? `Location: ${builder.loss_location}` : ''
  ].filter(Boolean);

  const intro = `Please accept this correspondence as a formal demand for settlement regarding the injuries and damages sustained by ${
    caseItem.client_name || 'our client'
  }${incidentDate ? ` on ${incidentDate}` : ''}.`;

  const liability = builder.liability_summary?.trim()
    ? builder.liability_summary.trim()
    : 'Liability is clear based on the available facts and evidence.';

  const incident = builder.incident_description?.trim() ? builder.incident_description.trim() : '';
  const injuries = builder.injuries_summary?.trim()
    ? builder.injuries_summary.trim()
    : caseItem.injury_type
      ? `Injuries include: ${caseItem.injury_type}.`
      : '';
  const treatment = builder.treatment_summary?.trim() ? builder.treatment_summary.trim() : '';

  const damagesLines = [
    specials ? `Medical Specials: ${specials}` : '',
    wageLoss ? `Wage Loss: ${wageLoss}` : '',
    builder.general_damages?.trim()
      ? `General Damages (pain/suffering, inconvenience, loss of enjoyment): ${builder.general_damages.trim()}`
      : ''
  ].filter(Boolean);

  const damagesSection = damagesLines.length
    ? `Damages\n\n${damagesLines.map((l) => `- ${l}`).join('\n')}`
    : '';

  const demandSection = demandAmount
    ? `Demand\n\nAccordingly, we hereby demand the total sum of ${demandAmount} to settle this matter in full.`
    : `Demand\n\nAccordingly, we hereby demand that you tender your best offer to settle this matter in full.`;

  const delivery = builder.delivery_method?.trim() ? builder.delivery_method.trim() : '';

  const closing = [
    `Please respond within ${deadlineDays} days of receipt of this letter.`,
    delivery ? `This demand is transmitted via ${delivery}.` : '',
    'If you require additional information to evaluate this claim, please contact us promptly.'
  ]
    .filter(Boolean)
    .join(' ');

  const lines = [
    senderBlock,
    senderBlock ? '' : '',
    today,
    '',
    recipientBlock,
    recipientBlock ? '' : '',
    'RE: Settlement Demand',
    ...caseLine,
    ...subjectParts,
    ...incidentLine,
    '',
    'To Whom It May Concern:',
    '',
    intro,
    '',
    incident ? `Incident Summary\n\n${incident}\n` : '',
    `Liability\n\n${liability}\n`,
    injuries ? `Injuries\n\n${injuries}\n` : '',
    treatment ? `Treatment\n\n${treatment}\n` : '',
    damagesSection ? `${damagesSection}\n` : '',
    `${demandSection}\n`,
    closing,
    '',
    'Sincerely,',
    '',
    builder.sender_name || builder.sender_firm || ''
  ];

  return (
    lines
      .filter((l) => l !== '')
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}

function downloadTextFile(filename: string, contents: string, mimeType?: string) {
  const blob = new Blob([contents], { type: mimeType || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadAsWordDoc(filename: string, plainText: string) {
  const escaped = String(plainText)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${filename}</title>
    <style>
      body { font-family: "Times New Roman", Times, serif; font-size: 12pt; }
      pre { white-space: pre-wrap; word-wrap: break-word; }
    </style>
  </head>
  <body>
    <pre>${escaped}</pre>
  </body>
</html>`;

  downloadTextFile(filename, html, 'application/msword');
}

function localGetCases(): DemandCase[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<DemandCase[]>(window.localStorage.getItem(LOCAL_KEYS.cases) || '[]', []);
}

function localSetCases(cases: DemandCase[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_KEYS.cases, JSON.stringify(cases));
}

function localGetDocs(caseId: string): DemandDocument[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<DemandDocument[]>(window.localStorage.getItem(LOCAL_KEYS.docs(caseId)) || '[]', []);
}

function localSetDocs(caseId: string, docs: DemandDocument[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_KEYS.docs(caseId), JSON.stringify(docs));
}

function localGetDemands(caseId: string): GeneratedDemand[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<GeneratedDemand[]>(window.localStorage.getItem(LOCAL_KEYS.demands(caseId)) || '[]', []);
}

function localSetDemands(caseId: string, demands: GeneratedDemand[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_KEYS.demands(caseId), JSON.stringify(demands));
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">{label}</label>
    {children}
  </div>
);

export const LegalDemandWriter: React.FC = () => {
  const [cases, setCases] = useState<DemandCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCase, setShowNewCase] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        const localCases = localGetCases().sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setCases(localCases);
        return;
      }

      const { data, error } = await supabase
        .from('demand_cases')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCases((data as DemandCase[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCases();
  }, []);

  return (
    <div className="h-full">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black italic tracking-wide text-white">
            Legal <span className="text-nb-lime">Demand Writer</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Draft, version, and export demand letters (Supabase optional).</p>
        </div>
        <button
          onClick={() => setShowNewCase(true)}
          className="inline-flex items-center gap-2 bg-nb-lime text-black font-black px-4 py-2 rounded-lg hover:bg-lime-300 transition-colors"
        >
          <Plus size={18} /> New Case
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 bg-yellow-900/20 border border-yellow-800 text-yellow-200 rounded-xl p-4 text-sm">
          <div className="font-bold mb-1">Local Draft Mode</div>
          Supabase env vars aren’t set, so cases/letters will be saved to this browser’s local storage.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader className="animate-spin text-nb-lime" />
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <FileText className="w-14 h-14 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No cases yet</h3>
          <p className="text-sm text-zinc-400 mb-6">Create a case to start drafting demand letters.</p>
          <button
            onClick={() => setShowNewCase(true)}
            className="inline-flex items-center gap-2 bg-nb-pink text-white font-bold px-4 py-2 rounded-lg hover:bg-pink-500 transition-colors"
          >
            <Plus size={18} /> Create First Case
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <CaseCard key={c.id} caseItem={c} onUpdate={loadCases} />
          ))}
        </div>
      )}

      {showNewCase && <NewCaseModal onClose={() => setShowNewCase(false)} onSuccess={loadCases} />}
    </div>
  );
};

const CaseCard: React.FC<{ caseItem: DemandCase; onUpdate: () => Promise<void> }> = ({ caseItem, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [documents, setDocuments] = useState<DemandDocument[]>([]);
  const [generatedDemand, setGeneratedDemand] = useState<GeneratedDemand | null>(null);
  const [letterDraft, setLetterDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const [builder, setBuilder] = useState<BuilderState>(() => ({
    letter_date: new Date().toISOString().slice(0, 10),
    sender_firm: '',
    sender_name: '',
    sender_address: '',
    sender_phone: '',
    sender_email: '',
    recipient_name: '',
    recipient_company: '',
    recipient_address: '',
    claim_number: '',
    policy_number: '',
    insured_name: '',
    loss_location: '',
    incident_description: '',
    liability_summary: '',
    injuries_summary: caseItem.injury_type || '',
    treatment_summary: '',
    medical_specials: '',
    wage_loss: '',
    general_damages: '',
    demand_amount: '',
    response_deadline_days: '15',
    delivery_method: 'Email and Certified Mail'
  }));

  const statusColors = useMemo(
    () =>
      ({
        draft: 'bg-zinc-700',
        processing: 'bg-yellow-600',
        generated: 'bg-nb-teal',
        sent: 'bg-green-600',
        resolved: 'bg-purple-600'
      }) as Record<string, string>,
    []
  );

  const loadDocuments = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setDocuments(localGetDocs(caseItem.id));
      return;
    }

    const { data, error } = await supabase
      .from('demand_documents')
      .select('*')
      .eq('case_id', caseItem.id)
      .order('uploaded_at', { ascending: false });
    if (error) {
      console.error(error);
      setDocuments([]);
      return;
    }
    setDocuments((data as DemandDocument[]) || []);
  };

  const loadGeneratedDemand = async () => {
    if (!isSupabaseConfigured || !supabase) {
      const demands = localGetDemands(caseItem.id);
      const latest = demands.sort((a, b) => (b.version || 0) - (a.version || 0))[0] || null;
      setGeneratedDemand(latest);
      setLetterDraft(latest?.content || '');
      return;
    }

    const { data, error } = await supabase
      .from('generated_demands')
      .select('*')
      .eq('case_id', caseItem.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error(error);
      setGeneratedDemand(null);
      setLetterDraft('');
      return;
    }
    setGeneratedDemand((data as GeneratedDemand) || null);
    setLetterDraft((data as GeneratedDemand | null)?.content || '');
  };

  useEffect(() => {
    if (!expanded) return;
    void loadDocuments();
    void loadGeneratedDemand();
  }, [expanded]);

  const saveGeneratedDemand = async (content: string) => {
    if (!content.trim()) throw new Error('Letter content is empty.');

    if (!isSupabaseConfigured || !supabase) {
      const demands = localGetDemands(caseItem.id);
      const nextVersion = (demands.reduce((m, d) => Math.max(m, d.version || 0), 0) || 0) + 1;
      const newDemand: GeneratedDemand = {
        id: crypto.randomUUID(),
        case_id: caseItem.id,
        content,
        version: nextVersion,
        generated_at: new Date().toISOString()
      };
      localSetDemands(caseItem.id, [newDemand, ...demands]);

      const cases = localGetCases();
      localSetCases(
        cases.map((c) => (c.id === caseItem.id ? { ...c, status: 'generated', updated_at: new Date().toISOString() } : c))
      );

      setGeneratedDemand(newDemand);
      setLetterDraft(content);
      return;
    }

    const { data: existing } = await supabase
      .from('generated_demands')
      .select('version')
      .eq('case_id', caseItem.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = ((existing as any)?.version || 0) + 1;

    const { data, error } = await supabase
      .from('generated_demands')
      .insert([{ case_id: caseItem.id, content, version: nextVersion }])
      .select()
      .single();
    if (error) throw error;

    await supabase.from('demand_cases').update({ status: 'generated', updated_at: new Date().toISOString() }).eq('id', caseItem.id);

    setGeneratedDemand(data as GeneratedDemand);
    setLetterDraft(content);
  };

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;

    if (!isSupabaseConfigured || !supabase) {
      const existingDocs = localGetDocs(caseItem.id);
      const newDocs: DemandDocument[] = files.map((file) => ({
        id: crypto.randomUUID(),
        case_id: caseItem.id,
        file_name: file.name,
        file_path: '',
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      }));
      localSetDocs(caseItem.id, [...newDocs, ...existingDocs]);
      setDocuments([...newDocs, ...existingDocs]);
      return;
    }

    for (const file of files) {
      const filePath = `demands/${caseItem.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('demand-documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: docError } = await supabase
        .from('demand_documents')
        .insert([{ case_id: caseItem.id, file_name: file.name, file_path: filePath, file_size: file.size }]);
      if (docError) throw docError;
    }
    await loadDocuments();
  };

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const letter = buildPersonalInjuryDemandLetter(caseItem, builder);
      await saveGeneratedDemand(letter);
      await onUpdate();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveVersion = async () => {
    setBusy(true);
    try {
      await saveGeneratedDemand(letterDraft);
      await onUpdate();
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letterDraft || '');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = letterDraft || '';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const escaped = String(letterDraft || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    w.document.write(
      `<!doctype html><html><head><title>Demand Letter</title><style>body{font-family:Times New Roman,Times,serif;padding:24px;}pre{white-space:pre-wrap;}</style></head><body><pre>${escaped}</pre></body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
  };

  const handleUploadMore: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setBusy(true);
    try {
      await uploadFiles(files);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!confirm('Delete this case and all associated drafts?')) return;
    setBusy(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        const next = localGetCases().filter((c) => c.id !== caseItem.id);
        localSetCases(next);
        window.localStorage.removeItem(LOCAL_KEYS.docs(caseItem.id));
        window.localStorage.removeItem(LOCAL_KEYS.demands(caseItem.id));
        await onUpdate();
        return;
      }
      const { error } = await supabase.from('demand_cases').delete().eq('id', caseItem.id);
      if (error) throw error;
      await onUpdate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-5 flex items-center justify-between hover:bg-zinc-900/70 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div className={`px-3 py-1 rounded-full text-[11px] font-bold text-white ${statusColors[caseItem.status || 'draft'] || 'bg-zinc-700'}`}>
            {caseItem.status || 'draft'}
          </div>
          <div>
            <h3 className="text-white font-bold">{caseItem.client_name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {caseItem.case_number ? `Case #${caseItem.case_number} • ` : ''}
              {new Date(caseItem.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-zinc-500 font-bold">{expanded ? '▼' : '▶'}</div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Injury Type</div>
              <div className="text-sm text-zinc-200">{caseItem.injury_type || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Incident Date</div>
              <div className="text-sm text-zinc-200">{caseItem.incident_date || 'Not specified'}</div>
            </div>
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <h4 className="font-black italic text-white tracking-wide">Documents</h4>
              <div className="flex items-center gap-2">
                <input ref={uploadRef} type="file" className="hidden" multiple accept=".pdf" onChange={handleUploadMore} />
                <button
                  onClick={() => uploadRef.current?.click()}
                  disabled={busy}
                  className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload PDFs
                </button>
              </div>
            </div>

            {documents.length === 0 ? (
              <p className="text-sm text-zinc-500">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-nb-teal" />
                      <div>
                        <div className="text-sm text-white">{d.file_name}</div>
                        <div className="text-xs text-zinc-500">
                          {d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSupabaseConfigured && (
              <p className="text-[11px] text-zinc-600 mt-2">
                Local draft mode: PDFs are listed for reference, but not uploaded anywhere.
              </p>
            )}
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h4 className="font-black italic text-white tracking-wide">Demand Letter Builder</h4>
              <button
                onClick={handleGenerate}
                disabled={busy}
                className="inline-flex items-center gap-2 bg-nb-lime text-black font-black px-4 py-2 rounded-lg hover:bg-lime-300 disabled:opacity-50 transition-colors"
              >
                {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generate
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Letter Date">
                <input
                  type="date"
                  value={builder.letter_date}
                  onChange={(e) => setBuilder({ ...builder, letter_date: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Location of Loss">
                <input
                  type="text"
                  value={builder.loss_location}
                  onChange={(e) => setBuilder({ ...builder, loss_location: e.target.value })}
                  placeholder="City, State (or address)"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Sender Firm">
                <input
                  type="text"
                  value={builder.sender_firm}
                  onChange={(e) => setBuilder({ ...builder, sender_firm: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Sender Name">
                <input
                  type="text"
                  value={builder.sender_name}
                  onChange={(e) => setBuilder({ ...builder, sender_name: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Sender Address">
                <input
                  type="text"
                  value={builder.sender_address}
                  onChange={(e) => setBuilder({ ...builder, sender_address: e.target.value })}
                  placeholder="Street, City, State ZIP"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Sender Phone / Email">
                <input
                  type="text"
                  value={[builder.sender_phone, builder.sender_email].filter(Boolean).join(' • ')}
                  onChange={(e) => {
                    const parts = e.target.value.split('•').map((p) => p.trim());
                    setBuilder({ ...builder, sender_phone: parts[0] || '', sender_email: parts[1] || '' });
                  }}
                  placeholder="(555) 555-5555 • name@firm.com"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Recipient Name">
                <input
                  type="text"
                  value={builder.recipient_name}
                  onChange={(e) => setBuilder({ ...builder, recipient_name: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Recipient Company">
                <input
                  type="text"
                  value={builder.recipient_company}
                  onChange={(e) => setBuilder({ ...builder, recipient_company: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Recipient Address">
                <input
                  type="text"
                  value={builder.recipient_address}
                  onChange={(e) => setBuilder({ ...builder, recipient_address: e.target.value })}
                  placeholder="Street, City, State ZIP"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Claim / Policy / Insured">
                <input
                  type="text"
                  value={[builder.claim_number, builder.policy_number, builder.insured_name].filter(Boolean).join(' • ')}
                  onChange={(e) => {
                    const parts = e.target.value.split('•').map((p) => p.trim());
                    setBuilder({
                      ...builder,
                      claim_number: parts[0] || '',
                      policy_number: parts[1] || '',
                      insured_name: parts[2] || ''
                    });
                  }}
                  placeholder="Claim # • Policy # • Insured"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Medical Specials (USD)">
                <input
                  type="text"
                  value={builder.medical_specials}
                  onChange={(e) => setBuilder({ ...builder, medical_specials: e.target.value })}
                  placeholder="$12,345.67"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Wage Loss (USD)">
                <input
                  type="text"
                  value={builder.wage_loss}
                  onChange={(e) => setBuilder({ ...builder, wage_loss: e.target.value })}
                  placeholder="$0.00"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Demand Amount (USD)">
                <input
                  type="text"
                  value={builder.demand_amount}
                  onChange={(e) => setBuilder({ ...builder, demand_amount: e.target.value })}
                  placeholder="$100,000"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Response Deadline (days)">
                <input
                  type="number"
                  min={1}
                  value={builder.response_deadline_days}
                  onChange={(e) => setBuilder({ ...builder, response_deadline_days: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
                />
              </Field>

              <Field label="Incident Summary">
                <textarea
                  value={builder.incident_description}
                  onChange={(e) => setBuilder({ ...builder, incident_description: e.target.value })}
                  rows={5}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none resize-none"
                />
              </Field>

              <Field label="Liability Summary">
                <textarea
                  value={builder.liability_summary}
                  onChange={(e) => setBuilder({ ...builder, liability_summary: e.target.value })}
                  rows={5}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none resize-none"
                />
              </Field>

              <Field label="Injuries Summary">
                <textarea
                  value={builder.injuries_summary}
                  onChange={(e) => setBuilder({ ...builder, injuries_summary: e.target.value })}
                  rows={4}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none resize-none"
                />
              </Field>

              <Field label="Treatment Summary">
                <textarea
                  value={builder.treatment_summary}
                  onChange={(e) => setBuilder({ ...builder, treatment_summary: e.target.value })}
                  rows={4}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none resize-none"
                />
              </Field>

              <div className="lg:col-span-2">
                <Field label="General Damages">
                  <textarea
                    value={builder.general_damages}
                    onChange={(e) => setBuilder({ ...builder, general_damages: e.target.value })}
                    rows={3}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none resize-none"
                  />
                </Field>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 mt-3">
              Note: This tool drafts a letter from your inputs; it’s not legal advice.
            </p>
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
              <div>
                <h4 className="font-black italic text-white tracking-wide">Demand Letter</h4>
                {generatedDemand?.version ? (
                  <p className="text-xs text-zinc-500">
                    Version {generatedDemand.version}
                    {generatedDemand.generated_at ? ` • ${new Date(generatedDemand.generated_at).toLocaleString()}` : ''}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">No draft yet. Generate one above.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!letterDraft}
                  className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button
                  onClick={handlePrint}
                  disabled={!letterDraft}
                  className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={() => downloadAsWordDoc(`demand-letter-${caseItem.client_name || 'client'}.doc`, letterDraft)}
                  disabled={!letterDraft}
                  className="inline-flex items-center gap-2 bg-nb-teal text-black px-3 py-2 rounded-lg text-sm font-black disabled:opacity-50 hover:opacity-90"
                >
                  <Download className="w-4 h-4" /> Export .doc
                </button>
                <button
                  onClick={() => downloadTextFile(`demand-letter-${caseItem.client_name || 'client'}.txt`, letterDraft)}
                  disabled={!letterDraft}
                  className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Export .txt
                </button>
                <button
                  onClick={handleSaveVersion}
                  disabled={busy || !letterDraft}
                  className="inline-flex items-center gap-2 bg-nb-pink text-white px-3 py-2 rounded-lg text-sm font-black disabled:opacity-50 hover:bg-pink-500"
                >
                  {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Version
                </button>
              </div>
            </div>

            <textarea
              value={letterDraft}
              onChange={(e) => setLetterDraft(e.target.value)}
              rows={16}
              placeholder="Your demand letter will appear here..."
              className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 font-mono focus:border-nb-lime outline-none resize-y"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleDeleteCase}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> Delete Case
            </button>
            {busy && (
              <div className="text-xs text-zinc-500 flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" /> Working…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const NewCaseModal: React.FC<{ onClose: () => void; onSuccess: () => Promise<void> }> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    case_number: '',
    injury_type: '',
    incident_date: '',
    notes: ''
  });
  const [files, setFiles] = useState<File[]>([]);

  const createLocalCase = async () => {
    const now = new Date().toISOString();
    const newCase: DemandCase = {
      id: crypto.randomUUID(),
      client_name: form.client_name,
      case_number: form.case_number,
      injury_type: form.injury_type,
      incident_date: form.incident_date,
      notes: form.notes,
      status: 'draft',
      created_at: now,
      updated_at: now
    };
    localSetCases([newCase, ...localGetCases()]);

    if (files.length) {
      const docs: DemandDocument[] = files.map((f) => ({
        id: crypto.randomUUID(),
        case_id: newCase.id,
        file_name: f.name,
        file_path: '',
        file_size: f.size,
        uploaded_at: new Date().toISOString()
      }));
      localSetDocs(newCase.id, docs);
    }
  };

  const uploadSupabaseFiles = async (caseId: string) => {
    for (const f of files) {
      const filePath = `demands/${caseId}/${Date.now()}-${f.name}`;
      const { error: uploadError } = await supabase!.storage.from('demand-documents').upload(filePath, f);
      if (uploadError) throw uploadError;

      const { error: docError } = await supabase!.from('demand_documents').insert([
        { case_id: caseId, file_name: f.name, file_path: filePath, file_size: f.size }
      ]);
      if (docError) throw docError;
    }
  };

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        await createLocalCase();
        await onSuccess();
        onClose();
        return;
      }

      const { data, error } = await supabase
        .from('demand_cases')
        .insert([{ ...form, status: 'draft' }])
        .select()
        .single();
      if (error) throw error;

      if (files.length) {
        setUploading(true);
        await uploadSupabaseFiles((data as DemandCase).id);
      }

      await onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to create case');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-black italic text-white tracking-wide">New Demand Case</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isSupabaseConfigured && (
            <div className="bg-yellow-900/20 border border-yellow-800 text-yellow-200 rounded-xl p-3 text-sm">
              Saving locally (Supabase not configured).
            </div>
          )}

          <Field label="Client Name *">
            <input
              required
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Case Number">
              <input
                value={form.case_number}
                onChange={(e) => setForm({ ...form, case_number: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
              />
            </Field>
            <Field label="Incident Date">
              <input
                type="date"
                value={form.incident_date}
                onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
              />
            </Field>
          </div>

          <Field label="Injury Type">
            <input
              value={form.injury_type}
              onChange={(e) => setForm({ ...form, injury_type: e.target.value })}
              placeholder="e.g., Car accident, Slip and fall"
              className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none"
            />
          </Field>

          <Field label="Documents (PDFs)">
            <div className="border border-dashed border-zinc-700 rounded-xl p-4 bg-black/40">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-zinc-400">Attach PDFs (optional)</div>
                <label className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-bold cursor-pointer">
                  <Upload className="w-4 h-4" /> Select
                  <input
                    className="hidden"
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
                  />
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, idx) => (
                    <div key={`${f.name}-${idx}`} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                      <div className="text-sm text-white">{f.name}</div>
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-nb-lime outline-none resize-none"
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-nb-pink hover:bg-pink-500 text-white font-black px-4 py-2 rounded-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {(loading || uploading) && <Loader className="w-4 h-4 animate-spin" />}
              {uploading ? 'Uploading…' : loading ? 'Creating…' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


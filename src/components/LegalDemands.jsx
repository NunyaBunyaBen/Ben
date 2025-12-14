import React, { useEffect, useMemo, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
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
} from 'lucide-react'

const LOCAL_KEYS = {
  cases: 'nbhq_demand_cases_v1',
  docs: (caseId) => `nbhq_demand_documents_v1_${caseId}`,
  demands: (caseId) => `nbhq_generated_demands_v1_${caseId}`
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

function formatCurrency(value) {
  const n = typeof value === 'number' ? value : Number(String(value || '').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n)) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function formatIsoDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function buildPersonalInjuryDemandLetter({ caseItem, builder }) {
  const today = builder.letter_date ? formatIsoDate(builder.letter_date) : formatIsoDate(new Date().toISOString())
  const incidentDate = caseItem?.incident_date ? formatIsoDate(caseItem.incident_date) : ''

  const demandAmount = formatCurrency(builder.demand_amount)
  const specials = formatCurrency(builder.medical_specials)
  const wageLoss = formatCurrency(builder.wage_loss)
  const deadlineDays = builder.response_deadline_days || '15'

  const senderBlock = [
    builder.sender_firm,
    builder.sender_name,
    builder.sender_address,
    builder.sender_phone ? `Phone: ${builder.sender_phone}` : '',
    builder.sender_email ? `Email: ${builder.sender_email}` : ''
  ]
    .filter(Boolean)
    .join('\n')

  const recipientBlock = [
    builder.recipient_name,
    builder.recipient_company,
    builder.recipient_address
  ]
    .filter(Boolean)
    .join('\n')

  const subjectParts = [
    builder.claim_number ? `Claim No.: ${builder.claim_number}` : '',
    builder.policy_number ? `Policy No.: ${builder.policy_number}` : '',
    builder.insured_name ? `Insured: ${builder.insured_name}` : ''
  ].filter(Boolean)

  const caseLine = [
    caseItem?.case_number ? `Our File: ${caseItem.case_number}` : '',
    caseItem?.client_name ? `Client: ${caseItem.client_name}` : ''
  ].filter(Boolean)

  const incidentLine = [
    incidentDate ? `Date of Loss: ${incidentDate}` : '',
    builder.loss_location ? `Location: ${builder.loss_location}` : ''
  ].filter(Boolean)

  const intro = `Please accept this correspondence as a formal demand for settlement regarding the injuries and damages sustained by ${caseItem?.client_name || 'our client'}${incidentDate ? ` on ${incidentDate}` : ''}.`

  const liability = builder.liability_summary
    ? builder.liability_summary.trim()
    : `Liability is clear based on the available facts and evidence.`

  const incident = builder.incident_description
    ? builder.incident_description.trim()
    : ''

  const injuries = builder.injuries_summary
    ? builder.injuries_summary.trim()
    : caseItem?.injury_type
      ? `Injuries include: ${caseItem.injury_type}.`
      : ''

  const treatment = builder.treatment_summary
    ? builder.treatment_summary.trim()
    : ''

  const damagesLines = [
    specials ? `Medical Specials: ${specials}` : '',
    wageLoss ? `Wage Loss: ${wageLoss}` : '',
    builder.general_damages ? `General Damages (pain/suffering, inconvenience, loss of enjoyment): ${builder.general_damages.trim()}` : ''
  ].filter(Boolean)

  const damagesSection = damagesLines.length
    ? `Damages\n\n${damagesLines.map((l) => `- ${l}`).join('\n')}`
    : ''

  const demandSection = demandAmount
    ? `Demand\n\nAccordingly, we hereby demand the total sum of ${demandAmount} to settle this matter in full.`
    : `Demand\n\nAccordingly, we hereby demand that you tender your best offer to settle this matter in full.`

  const delivery = builder.delivery_method ? builder.delivery_method.trim() : ''

  const closing = [
    `Please respond within ${deadlineDays} days of receipt of this letter.`,
    delivery ? `This demand is transmitted via ${delivery}.` : '',
    `If you require additional information to evaluate this claim, please contact us promptly.`
  ].filter(Boolean).join(' ')

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
  ]

  return lines
    .filter((l) => l !== '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n'
}

function downloadTextFile({ filename, contents, mimeType }) {
  const blob = new Blob([contents], { type: mimeType || 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function downloadAsWordDoc({ filename, plainText }) {
  const escaped = String(plainText)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

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
</html>`

  downloadTextFile({ filename, contents: html, mimeType: 'application/msword' })
}

function localGetCases() {
  if (typeof window === 'undefined') return []
  return safeJsonParse(window.localStorage.getItem(LOCAL_KEYS.cases) || '[]', [])
}

function localSetCases(cases) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_KEYS.cases, JSON.stringify(cases))
}

function localGetDocs(caseId) {
  if (typeof window === 'undefined') return []
  return safeJsonParse(window.localStorage.getItem(LOCAL_KEYS.docs(caseId)) || '[]', [])
}

function localSetDocs(caseId, docs) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_KEYS.docs(caseId), JSON.stringify(docs))
}

function localGetDemands(caseId) {
  if (typeof window === 'undefined') return []
  return safeJsonParse(window.localStorage.getItem(LOCAL_KEYS.demands(caseId)) || '[]', [])
}

function localSetDemands(caseId, demands) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_KEYS.demands(caseId), JSON.stringify(demands))
}

export default function LegalDemands() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewCase, setShowNewCase] = useState(false)

  const loadCases = async () => {
    setLoading(true)
    try {
      if (!isSupabaseConfigured || !supabase) {
        const localCases = localGetCases().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setCases(localCases)
        return
      }

      const { data, error } = await supabase
        .from('demand_cases')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCases(data || [])
    } catch (error) {
      console.error('Error loading cases:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Legal Demand Writer</h1>
          <p className="text-gray-400">Draft, version, and export demand letters (Supabase optional).</p>
        </div>
        <button
          onClick={() => setShowNewCase(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Case
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 bg-yellow-900/20 border border-yellow-800 text-yellow-200 rounded-xl p-4 text-sm">
          <div className="font-semibold mb-1">Local Draft Mode</div>
          Supabase env vars aren’t set, so cases/letters will be saved to this browser’s local storage.
        </div>
      )}

      {/* Cases List */}
      <div className="grid gap-4">
        {cases.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No cases yet</h3>
            <p className="text-gray-400 mb-6">Create your first case to start drafting demand letters.</p>
            <button
              onClick={() => setShowNewCase(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create First Case
            </button>
          </div>
        ) : (
          cases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} onUpdate={loadCases} />
          ))
        )}
      </div>

      {/* New Case Modal */}
      {showNewCase && (
        <NewCaseModal onClose={() => setShowNewCase(false)} onSuccess={loadCases} />
      )}
    </div>
  )
}

function CaseCard({ caseItem, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [documents, setDocuments] = useState([])
  const [generatedDemand, setGeneratedDemand] = useState(null)
  const [letterDraft, setLetterDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const uploadInputRef = useRef(null)

  const [builder, setBuilder] = useState(() => ({
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
    injuries_summary: caseItem?.injury_type || '',
    treatment_summary: '',
    medical_specials: '',
    wage_loss: '',
    general_damages: '',
    demand_amount: '',
    response_deadline_days: '15',
    delivery_method: 'Email and Certified Mail'
  }))

  const statusColors = useMemo(() => ({
    draft: 'bg-gray-600',
    processing: 'bg-yellow-600',
    generated: 'bg-blue-600',
    sent: 'bg-green-600',
    resolved: 'bg-purple-600'
  }), [])

  const loadDocuments = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setDocuments(localGetDocs(caseItem.id))
      return
    }

    const { data, error } = await supabase
      .from('demand_documents')
      .select('*')
      .eq('case_id', caseItem.id)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
      return
    }
    setDocuments(data || [])
  }

  const loadGeneratedDemand = async () => {
    if (!isSupabaseConfigured || !supabase) {
      const demands = localGetDemands(caseItem.id)
      const latest = demands.sort((a, b) => (b.version || 0) - (a.version || 0))[0] || null
      setGeneratedDemand(latest)
      setLetterDraft(latest?.content || '')
      return
    }

    const { data, error } = await supabase
      .from('generated_demands')
      .select('*')
      .eq('case_id', caseItem.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error loading generated demand:', error)
      setGeneratedDemand(null)
      setLetterDraft('')
      return
    }

    setGeneratedDemand(data || null)
    setLetterDraft(data?.content || '')
  }

  useEffect(() => {
    if (expanded) {
      loadDocuments()
      loadGeneratedDemand()
    }
  }, [expanded])

  const saveGeneratedDemand = async (content) => {
    if (!content || !content.trim()) throw new Error('Letter content is empty.')

    if (!isSupabaseConfigured || !supabase) {
      const demands = localGetDemands(caseItem.id)
      const nextVersion = (demands.reduce((m, d) => Math.max(m, d.version || 0), 0) || 0) + 1
      const newDemand = {
        id: crypto.randomUUID(),
        case_id: caseItem.id,
        content,
        version: nextVersion,
        generated_at: new Date().toISOString()
      }
      localSetDemands(caseItem.id, [newDemand, ...demands])

      const cases = localGetCases()
      const updatedCases = cases.map((c) => (c.id === caseItem.id ? { ...c, status: 'generated', updated_at: new Date().toISOString() } : c))
      localSetCases(updatedCases)

      setGeneratedDemand(newDemand)
      setLetterDraft(content)
      return
    }

    const { data: existing } = await supabase
      .from('generated_demands')
      .select('version')
      .eq('case_id', caseItem.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = (existing?.version || 0) + 1

    const { data, error } = await supabase
      .from('generated_demands')
      .insert([
        {
          case_id: caseItem.id,
          content,
          version: nextVersion
        }
      ])
      .select()
      .single()

    if (error) throw error

    await supabase
      .from('demand_cases')
      .update({ status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', caseItem.id)

    setGeneratedDemand(data)
    setLetterDraft(content)
  }

  const handleGenerateLetter = async () => {
    setLoading(true)
    try {
      const letter = buildPersonalInjuryDemandLetter({ caseItem, builder })
      await saveGeneratedDemand(letter)
      await onUpdate()
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Failed to generate letter')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEditsAsNewVersion = async () => {
    setLoading(true)
    try {
      await saveGeneratedDemand(letterDraft)
      await onUpdate()
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Failed to save new version')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letterDraft || '')
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = letterDraft || ''
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
  }

  const handlePrint = () => {
    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) return
    const escaped = String(letterDraft || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    w.document.write(`<!doctype html><html><head><title>Demand Letter</title><style>body{font-family:Times New Roman,Times,serif;padding:24px;}pre{white-space:pre-wrap;}</style></head><body><pre>${escaped}</pre></body></html>`)
    w.document.close()
    w.focus()
    w.print()
  }

  const uploadFiles = async (files) => {
    if (!files?.length) return

    if (!isSupabaseConfigured || !supabase) {
      const existingDocs = localGetDocs(caseItem.id)
      const newDocs = files.map((file) => ({
        id: crypto.randomUUID(),
        case_id: caseItem.id,
        file_name: file.name,
        file_path: '',
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      }))
      localSetDocs(caseItem.id, [...newDocs, ...existingDocs])
      setDocuments([...newDocs, ...existingDocs])
      return
    }

    for (const file of files) {
      const filePath = `demands/${caseItem.id}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('demand-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { error: docError } = await supabase
        .from('demand_documents')
        .insert([
          {
            case_id: caseItem.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size
          }
        ])

      if (docError) throw docError
    }

    await loadDocuments()
  }

  const handleUploadMore = async (e) => {
    const selected = Array.from(e.target.files || [])
    e.target.value = ''
    setLoading(true)
    try {
      await uploadFiles(selected)
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCase = async () => {
    if (!confirm('Delete this case and all associated drafts?')) return

    setLoading(true)
    try {
      if (!isSupabaseConfigured || !supabase) {
        const cases = localGetCases().filter((c) => c.id !== caseItem.id)
        localSetCases(cases)
        window.localStorage.removeItem(LOCAL_KEYS.docs(caseItem.id))
        window.localStorage.removeItem(LOCAL_KEYS.demands(caseItem.id))
        await onUpdate()
        return
      }

      const { error } = await supabase.from('demand_cases').delete().eq('id', caseItem.id)
      if (error) throw error
      await onUpdate()
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Failed to delete case')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[caseItem.status] || 'bg-gray-600'}`}>
            {caseItem.status || 'draft'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{caseItem.client_name}</h3>
            <p className="text-sm text-gray-400">
              {caseItem.case_number && `Case #${caseItem.case_number} • `}
              {new Date(caseItem.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-gray-400">{expanded ? '▼' : '▶'}</div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-800 p-6 space-y-6">
          {/* Case Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Injury Type</label>
              <p className="text-white">{caseItem.injury_type || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Incident Date</label>
              <p className="text-white">{caseItem.incident_date || 'Not specified'}</p>
            </div>
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Documents ({documents.length})</h4>
              <div className="flex items-center gap-2">
                <input
                  ref={uploadInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  className="hidden"
                  onChange={handleUploadMore}
                />
                <button
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload PDFs
                </button>
              </div>
            </div>

            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-white text-sm">{doc.file_name}</p>
                        {doc.file_size ? (
                          <p className="text-gray-400 text-xs">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                        ) : (
                          <p className="text-gray-500 text-xs">Size unknown</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No documents uploaded yet.</p>
            )}

            {!isSupabaseConfigured && (
              <p className="text-gray-500 text-xs mt-2">
                Local draft mode: PDFs are listed for reference, but not uploaded anywhere.
              </p>
            )}
          </div>

          {/* Builder */}
          <div className="bg-gray-950/40 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">Demand Letter Builder</h4>
              <button
                onClick={handleGenerateLetter}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generate Letter
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Letter Date">
                <input
                  type="date"
                  value={builder.letter_date}
                  onChange={(e) => setBuilder({ ...builder, letter_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </Field>

              <Field label="Location of Loss">
                <input
                  type="text"
                  value={builder.loss_location}
                  onChange={(e) => setBuilder({ ...builder, loss_location: e.target.value })}
                  placeholder="City, State (or address)"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </Field>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Sender Firm">
                  <input
                    type="text"
                    value={builder.sender_firm}
                    onChange={(e) => setBuilder({ ...builder, sender_firm: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Sender Name">
                  <input
                    type="text"
                    value={builder.sender_name}
                    onChange={(e) => setBuilder({ ...builder, sender_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Sender Address">
                  <input
                    type="text"
                    value={builder.sender_address}
                    onChange={(e) => setBuilder({ ...builder, sender_address: e.target.value })}
                    placeholder="Street, City, State ZIP"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Sender Phone / Email">
                  <input
                    type="text"
                    value={[builder.sender_phone, builder.sender_email].filter(Boolean).join(' • ')}
                    onChange={(e) => {
                      const v = e.target.value
                      const parts = v.split('•').map((p) => p.trim())
                      setBuilder({
                        ...builder,
                        sender_phone: parts[0] || '',
                        sender_email: parts[1] || ''
                      })
                    }}
                    placeholder="(555) 555-5555 • name@firm.com"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Recipient Name">
                  <input
                    type="text"
                    value={builder.recipient_name}
                    onChange={(e) => setBuilder({ ...builder, recipient_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Recipient Company">
                  <input
                    type="text"
                    value={builder.recipient_company}
                    onChange={(e) => setBuilder({ ...builder, recipient_company: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Recipient Address">
                  <input
                    type="text"
                    value={builder.recipient_address}
                    onChange={(e) => setBuilder({ ...builder, recipient_address: e.target.value })}
                    placeholder="Street, City, State ZIP"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Claim / Policy / Insured">
                  <input
                    type="text"
                    value={[builder.claim_number, builder.policy_number, builder.insured_name].filter(Boolean).join(' • ')}
                    onChange={(e) => {
                      const v = e.target.value
                      const parts = v.split('•').map((p) => p.trim())
                      setBuilder({
                        ...builder,
                        claim_number: parts[0] || '',
                        policy_number: parts[1] || '',
                        insured_name: parts[2] || ''
                      })
                    }}
                    placeholder="Claim # • Policy # • Insured"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Medical Specials (USD)">
                  <input
                    type="text"
                    value={builder.medical_specials}
                    onChange={(e) => setBuilder({ ...builder, medical_specials: e.target.value })}
                    placeholder="$12,345.67"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Wage Loss (USD)">
                  <input
                    type="text"
                    value={builder.wage_loss}
                    onChange={(e) => setBuilder({ ...builder, wage_loss: e.target.value })}
                    placeholder="$0.00"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Demand Amount (USD)">
                  <input
                    type="text"
                    value={builder.demand_amount}
                    onChange={(e) => setBuilder({ ...builder, demand_amount: e.target.value })}
                    placeholder="$100,000"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>

                <Field label="Response Deadline (days)">
                  <input
                    type="number"
                    min="1"
                    value={builder.response_deadline_days}
                    onChange={(e) => setBuilder({ ...builder, response_deadline_days: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>
              </div>

              <Field label="Incident Summary">
                <textarea
                  value={builder.incident_description}
                  onChange={(e) => setBuilder({ ...builder, incident_description: e.target.value })}
                  rows={5}
                  placeholder="Brief narrative of what happened..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </Field>

              <Field label="Liability Summary">
                <textarea
                  value={builder.liability_summary}
                  onChange={(e) => setBuilder({ ...builder, liability_summary: e.target.value })}
                  rows={5}
                  placeholder="Why liability is clear..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </Field>

              <Field label="Injuries Summary">
                <textarea
                  value={builder.injuries_summary}
                  onChange={(e) => setBuilder({ ...builder, injuries_summary: e.target.value })}
                  rows={4}
                  placeholder="Injuries and symptoms..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </Field>

              <Field label="Treatment Summary">
                <textarea
                  value={builder.treatment_summary}
                  onChange={(e) => setBuilder({ ...builder, treatment_summary: e.target.value })}
                  rows={4}
                  placeholder="Treatment timeline and prognosis..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </Field>

              <div className="lg:col-span-2">
                <Field label="General Damages">
                  <textarea
                    value={builder.general_damages}
                    onChange={(e) => setBuilder({ ...builder, general_damages: e.target.value })}
                    rows={3}
                    placeholder="Pain/suffering, loss of enjoyment, inconvenience..."
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </Field>
              </div>
            </div>

            <p className="text-gray-500 text-xs mt-3">
              Note: This tool drafts a letter from your inputs; it’s not legal advice.
            </p>
          </div>

          {/* Generated Demand */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <div>
                <h4 className="text-white font-medium">Demand Letter</h4>
                {generatedDemand?.version ? (
                  <p className="text-gray-500 text-xs">Version {generatedDemand.version}{generatedDemand.generated_at ? ` • ${new Date(generatedDemand.generated_at).toLocaleString()}` : ''}</p>
                ) : (
                  <p className="text-gray-500 text-xs">No draft yet. Generate one above.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!letterDraft}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>

                <button
                  onClick={handlePrint}
                  disabled={!letterDraft}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>

                <button
                  onClick={() => downloadAsWordDoc({ filename: `demand-letter-${caseItem.client_name || 'client'}.doc`, plainText: letterDraft })}
                  disabled={!letterDraft}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export .doc
                </button>

                <button
                  onClick={() => downloadTextFile({ filename: `demand-letter-${caseItem.client_name || 'client'}.txt`, contents: letterDraft })}
                  disabled={!letterDraft}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export .txt
                </button>

                <button
                  onClick={handleSaveEditsAsNewVersion}
                  disabled={loading || !letterDraft}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Version
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg">
              <textarea
                value={letterDraft}
                onChange={(e) => setLetterDraft(e.target.value)}
                rows={18}
                placeholder="Your demand letter will appear here..."
                className="w-full text-sm text-gray-200 whitespace-pre-wrap font-mono bg-transparent focus:outline-none resize-y"
              />
            </div>
          </div>

          {/* Danger */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleDeleteCase}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Case
            </button>
            {loading && (
              <div className="text-gray-400 text-sm flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Working…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      {children}
    </div>
  )
}

function NewCaseModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    client_name: '',
    case_number: '',
    injury_type: '',
    incident_date: '',
    notes: ''
  })
  const [files, setFiles] = useState([])

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles([...files, ...selectedFiles])
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const createCaseLocal = async () => {
    const now = new Date().toISOString()
    const newCase = {
      id: crypto.randomUUID(),
      client_name: formData.client_name,
      case_number: formData.case_number,
      injury_type: formData.injury_type,
      incident_date: formData.incident_date,
      notes: formData.notes,
      status: 'draft',
      created_at: now,
      updated_at: now
    }

    const existing = localGetCases()
    localSetCases([newCase, ...existing])

    if (files.length > 0) {
      const newDocs = files.map((file) => ({
        id: crypto.randomUUID(),
        case_id: newCase.id,
        file_name: file.name,
        file_path: '',
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      }))
      localSetDocs(newCase.id, newDocs)
    }

    return newCase
  }

  const uploadFilesSupabase = async (caseId) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filePath = `demands/${caseId}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('demand-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { error: docError } = await supabase
        .from('demand_documents')
        .insert([
          {
            case_id: caseId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size
          }
        ])

      if (docError) throw docError
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!isSupabaseConfigured || !supabase) {
        await createCaseLocal()
        onSuccess()
        onClose()
        return
      }

      const { data: caseData, error: caseError } = await supabase
        .from('demand_cases')
        .insert([
          {
            ...formData,
            status: 'draft'
          }
        ])
        .select()
        .single()

      if (caseError) throw caseError

      if (files.length > 0) {
        setUploading(true)
        await uploadFilesSupabase(caseData.id)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating case:', error)
      alert('Error creating case: ' + (error?.message || 'Unknown error'))
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">New Demand Case</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!isSupabaseConfigured && (
            <div className="bg-yellow-900/20 border border-yellow-800 text-yellow-200 rounded-xl p-4 text-sm">
              Saving locally (Supabase not configured).
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Client Name *</label>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Case Number</label>
            <input
              type="text"
              value={formData.case_number}
              onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Injury Type</label>
            <input
              type="text"
              value={formData.injury_type}
              onChange={(e) => setFormData({ ...formData, injury_type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Car accident, Slip and fall"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Incident Date</label>
            <input
              type="date"
              value={formData.incident_date}
              onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Documents (PDFs)</label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">Click to select PDFs</p>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                Select Files
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-white text-sm">{file.name}</p>
                        <p className="text-gray-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Additional case details..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(loading || uploading) && <Loader className="w-5 h-5 animate-spin" />}
              {uploading ? 'Uploading...' : loading ? 'Creating...' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

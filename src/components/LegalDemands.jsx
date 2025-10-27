import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, FileText, Loader, Trash2, Download, Plus, X } from 'lucide-react'

export default function LegalDemands() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewCase, setShowNewCase] = useState(false)

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    try {
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Legal Demands</h1>
          <p className="text-gray-400">Automate demand letter generation from medical records</p>
        </div>
        <button
          onClick={() => setShowNewCase(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Case
        </button>
      </div>

      {/* Cases List */}
      <div className="grid gap-4">
        {cases.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No cases yet</h3>
            <p className="text-gray-400 mb-6">Create your first demand case to get started</p>
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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (expanded) {
      loadDocuments()
      loadGeneratedDemand()
    }
  }, [expanded])

  const loadDocuments = async () => {
    const { data } = await supabase
      .from('demand_documents')
      .select('*')
      .eq('case_id', caseItem.id)
    setDocuments(data || [])
  }

  const loadGeneratedDemand = async () => {
    const { data } = await supabase
      .from('generated_demands')
      .select('*')
      .eq('case_id', caseItem.id)
      .order('version', { ascending: false })
      .limit(1)
      .single()
    setGeneratedDemand(data)
  }

  const statusColors = {
    draft: 'bg-gray-600',
    processing: 'bg-yellow-600',
    generated: 'bg-blue-600',
    sent: 'bg-green-600',
    resolved: 'bg-purple-600'
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[caseItem.status]}`}>
            {caseItem.status}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{caseItem.client_name}</h3>
            <p className="text-sm text-gray-400">
              {caseItem.case_number && `Case #${caseItem.case_number} • `}
              {new Date(caseItem.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-gray-400">
          {expanded ? '▼' : '▶'}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-800 p-6 space-y-6">
          {/* Case Details */}
          <div className="grid grid-cols-2 gap-4">
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
            <h4 className="text-white font-medium mb-3">Medical Documents ({documents.length})</h4>
            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-white text-sm">{doc.file_name}</p>
                        <p className="text-gray-400 text-xs">
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No documents uploaded yet</p>
            )}
          </div>

          {/* Generated Demand */}
          {generatedDemand && (
            <div>
              <h4 className="text-white font-medium mb-3">Generated Demand Letter</h4>
              <div className="p-4 bg-gray-800 rounded-lg">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {generatedDemand.content}
                </pre>
              </div>
              <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Export as DOCX
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              Upload More Documents
            </button>
            {documents.length > 0 && !generatedDemand && (
              <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                Generate Demand Letter
              </button>
            )}
          </div>
        </div>
      )}
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
  const [uploadProgress, setUploadProgress] = useState({})

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles([...files, ...selectedFiles])
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create case (no user_id needed for single-user app)
      const { data: caseData, error: caseError } = await supabase
        .from('demand_cases')
        .insert([{
          ...formData,
          status: 'draft'
        }])
        .select()
        .single()

      if (caseError) throw caseError

      // Upload files if any
      if (files.length > 0) {
        setUploading(true)
        await uploadFiles(caseData.id)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating case:', error)
      alert('Error creating case: ' + error.message)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const uploadFiles = async (caseId) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filePath = `demands/${caseId}/${file.name}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('demand-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create document record
      await supabase
        .from('demand_documents')
        .insert([{
          case_id: caseId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size
        }])

      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">New Demand Case</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Case Number */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Case Number
            </label>
            <input
              type="text"
              value={formData.case_number}
              onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Injury Type */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Injury Type
            </label>
            <input
              type="text"
              value={formData.injury_type}
              onChange={(e) => setFormData({ ...formData, injury_type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Car accident, Slip and fall"
            />
          </div>

          {/* Incident Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Incident Date
            </label>
            <input
              type="date"
              value={formData.incident_date}
              onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Medical Documents (PDFs)
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">Click or drag PDFs here to upload</p>
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

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-white text-sm">{file.name}</p>
                        <p className="text-gray-400 text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Additional case details..."
            />
          </div>

          {/* Buttons */}
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

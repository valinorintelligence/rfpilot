import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadZone } from '../components/ui/UploadZone'
import { Button } from '../components/ui/Button'
import { useRFPStore } from '../store/rfpStore'

export default function NewRFP() {
  const navigate = useNavigate()
  const { createRFP, uploadFile, analyzeRFP, matchCapability } = useRFPStore()

  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [department, setDepartment] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [deadline, setDeadline] = useState('')

  const [rfpFiles, setRfpFiles] = useState<File[]>([])
  const [capabilityFiles, setCapabilityFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!title || !clientName || rfpFiles.length === 0) {
      setError('Please fill in title, client name, and upload an RFP document')
      return
    }
    setError('')
    setLoading(true)
    try {
      const rfpId = await createRFP({
        title,
        client_name: clientName,
        department: department || undefined,
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : undefined,
        submission_deadline: deadline || undefined,
      })

      // Upload RFP document
      for (const file of rfpFiles) {
        await uploadFile(rfpId, file, 'rfp')
      }

      // Upload capability docs
      for (const file of capabilityFiles) {
        await uploadFile(rfpId, file, 'capability')
      }

      // Run analysis
      await analyzeRFP(rfpId)

      navigate(`/rfp/${rfpId}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create RFP')
    } finally {
      setLoading(false)
    }
  }

  const handleMatch = async () => {
    if (!title || !clientName || rfpFiles.length === 0 || capabilityFiles.length === 0) {
      setError('Please fill in details, upload RFP and capability documents')
      return
    }
    setError('')
    setLoading(true)
    try {
      const rfpId = await createRFP({
        title,
        client_name: clientName,
        department: department || undefined,
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : undefined,
        submission_deadline: deadline || undefined,
      })

      for (const file of rfpFiles) {
        await uploadFile(rfpId, file, 'rfp')
      }
      for (const file of capabilityFiles) {
        await uploadFile(rfpId, file, 'capability')
      }

      await analyzeRFP(rfpId)
      await matchCapability(rfpId)

      navigate(`/rfp/${rfpId}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <h2 className="mb-8">Create New RFP</h2>

      {error && (
        <div className="mb-6 p-4 border-2 border-[#8B0000] bg-white text-[#8B0000] text-sm">{error}</div>
      )}

      {/* RFP Details */}
      <div className="mb-12">
        <h3 className="mb-6">RFP Details</h3>
        <div className="border border-[#CCCCCC] p-6 bg-white space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">RFP Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]"
                placeholder="e.g., Cybersecurity SOC Implementation" required />
            </div>
            <div>
              <label className="block mb-2">Client Name</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]"
                placeholder="e.g., Ministry of Finance" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-2">Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]">
                <option value="">Select Department</option>
                <option value="Government">Government</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Technology">Technology</option>
                <option value="Telecom">Telecom</option>
                <option value="Education">Education</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Estimated Value ($)</label>
              <input type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]"
                placeholder="e.g., 2500000" />
            </div>
            <div>
              <label className="block mb-2">Submission Deadline</label>
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]" />
            </div>
          </div>
        </div>
      </div>

      {/* Upload RFP Document */}
      <div className="mb-12">
        <h3 className="mb-6">Section 1: Upload RFP Document</h3>
        <UploadZone label="RFP Document" accept=".pdf,.docx,.pptx,.txt" multiple={false} onFilesChange={setRfpFiles} />
      </div>

      {/* Upload Capability Documents */}
      <div className="mb-12">
        <h3 className="mb-6">Section 2: Upload Capability Documents (Engine B)</h3>
        <div className="grid grid-cols-2 gap-6">
          <UploadZone label="Company Profile / Capability Docs" accept=".pdf,.docx" multiple={true} onFilesChange={setCapabilityFiles} />
          <UploadZone label="Past Proposals / Case Studies" accept=".pdf,.docx" multiple={true} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleAnalyze} disabled={loading || rfpFiles.length === 0}>
          {loading ? 'Processing...' : 'Analyze RFP (Engine A)'}
        </Button>
        <Button variant="secondary" onClick={handleMatch}
          disabled={loading || rfpFiles.length === 0 || capabilityFiles.length === 0}>
          Run Capability Match (Engine B)
        </Button>
      </div>
    </div>
  )
}

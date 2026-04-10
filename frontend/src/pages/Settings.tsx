import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Upload } from 'lucide-react'
import api from '../api/client'

export default function Settings() {
  const [companyName, setCompanyName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/settings').then(res => {
      setCompanyName(res.data.company_name || '')
      setHasApiKey(res.data.has_api_key)
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const data: any = { company_name: companyName }
      if (apiKey) data.claude_api_key = apiKey
      await api.put('/settings', data)
      setMessage('Settings saved successfully')
      if (apiKey) { setHasApiKey(true); setApiKey('') }
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    try {
      await api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMessage('Logo uploaded successfully')
    } catch {
      setMessage('Failed to upload logo')
    }
  }

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    try {
      await api.post('/settings/template', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMessage('Template uploaded successfully')
    } catch {
      setMessage('Failed to upload template')
    }
  }

  return (
    <div className="p-8 max-w-[1000px]">
      <h2 className="mb-8">Settings</h2>

      {message && (
        <div className={`mb-6 p-4 border-2 ${message.includes('Failed') ? 'border-[#8B0000] text-[#8B0000]' : 'border-[#1A5C1A] text-[#1A5C1A]'} bg-white text-sm`}>
          {message}
        </div>
      )}

      {/* Company Information */}
      <div className="mb-12">
        <h3 className="mb-6">Company Information</h3>
        <div className="border border-[#CCCCCC] p-6 bg-white space-y-6">
          <div>
            <label htmlFor="companyName" className="block mb-2">Company Name</label>
            <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]" />
          </div>
          <div>
            <label className="block mb-2">Company Logo</label>
            <div className="border-2 border-dashed border-[#CCCCCC] p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-3 text-[#555555]" />
              <p className="text-sm text-[#555555] mb-3">Upload company logo</p>
              <input type="file" accept="image/*" className="hidden" id="logoUpload" onChange={handleLogoUpload} />
              <label htmlFor="logoUpload" className="inline-block px-6 py-2 border border-[#0A0A0A] cursor-pointer hover:bg-[#F5F0DC]">
                Select File
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Template */}
      <div className="mb-12">
        <h3 className="mb-6">Proposal Template</h3>
        <div className="border border-[#CCCCCC] p-6 bg-white">
          <label className="block mb-2">Word Template (.docx)</label>
          <div className="border-2 border-dashed border-[#CCCCCC] p-8 text-center">
            <Upload className="w-8 h-8 mx-auto mb-3 text-[#555555]" />
            <p className="text-sm text-[#555555] mb-3">Upload custom Word template for proposal generation</p>
            <input type="file" accept=".docx" className="hidden" id="templateUpload" onChange={handleTemplateUpload} />
            <label htmlFor="templateUpload" className="inline-block px-6 py-2 border border-[#0A0A0A] cursor-pointer hover:bg-[#F5F0DC]">
              Select Template
            </label>
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="mb-12">
        <h3 className="mb-6">AI Settings</h3>
        <div className="border border-[#CCCCCC] p-6 bg-white">
          <label htmlFor="apiKey" className="block mb-2">Claude API Key</label>
          <input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasApiKey ? 'API key is configured (enter new key to update)' : 'Enter your Anthropic API key'}
            className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A] font-mono" />
          <p className="text-sm text-[#555555] mt-2">
            {hasApiKey ? 'API key is currently configured.' : 'Required for AI features.'} Get your key from console.anthropic.com
          </p>
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  )
}

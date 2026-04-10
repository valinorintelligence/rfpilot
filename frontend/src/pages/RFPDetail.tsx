import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { FileText, Download, MessageSquare, Loader2 } from 'lucide-react'
import { useRFPStore } from '../store/rfpStore'
import api from '../api/client'

export default function RFPDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentRFP, fetchRFP, analyzeRFP, matchCapability, generateProposal, addComment, updateStatus } = useRFPStore()
  const [commentText, setCommentText] = useState('')
  const [processing, setProcessing] = useState('')

  useEffect(() => {
    if (id) fetchRFP(id)
  }, [id])

  if (!currentRFP) {
    return <div className="p-8"><p className="text-[#555555]">Loading...</p></div>
  }

  const rfpAnalysis = currentRFP.extractions.find(e => e.extraction_type === 'rfp_analysis')
  const capMatch = currentRFP.extractions.find(e => e.extraction_type === 'capability_match')
  const analysisData = rfpAnalysis?.raw_json || {}
  const matchData = capMatch?.raw_json || null

  const handleAction = async (action: string) => {
    setProcessing(action)
    try {
      if (action === 'analyze') await analyzeRFP(id!)
      else if (action === 'match') await matchCapability(id!)
      else if (action === 'generate') await generateProposal(id!)
    } catch {} finally {
      setProcessing('')
    }
  }

  const handleDownload = async (proposalId: string, version: number) => {
    const res = await api.get(`/rfps/${id}/proposals/${proposalId}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `proposal_v${version}.docx`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    await addComment(id!, commentText)
    setCommentText('')
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="mb-2">{currentRFP.title}</h2>
          <p className="text-[#555555]">{currentRFP.client_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={currentRFP.status}>{currentRFP.status.replace('_', '-')}</Badge>
          <select value={currentRFP.status} onChange={(e) => updateStatus(id!, e.target.value)}
            className="px-3 py-2 border border-[#CCCCCC] bg-white text-sm focus:outline-none">
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-[#CCCCCC] p-4 bg-white">
          <div className="text-xs uppercase tracking-wider text-[#555555] mb-1 font-mono">Department</div>
          <div className="font-medium">{currentRFP.department || '-'}</div>
        </div>
        <div className="border border-[#CCCCCC] p-4 bg-white">
          <div className="text-xs uppercase tracking-wider text-[#555555] mb-1 font-mono">Estimated Value</div>
          <div className="font-mono text-xl">{currentRFP.estimated_value ? `$${currentRFP.estimated_value.toLocaleString()}` : '-'}</div>
        </div>
        <div className="border border-[#CCCCCC] p-4 bg-white">
          <div className="text-xs uppercase tracking-wider text-[#555555] mb-1 font-mono">Deadline</div>
          <div className="font-medium">{currentRFP.submission_deadline ? new Date(currentRFP.submission_deadline).toLocaleDateString() : '-'}</div>
        </div>
        <div className="border border-[#CCCCCC] p-4 bg-white">
          <div className="text-xs uppercase tracking-wider text-[#555555] mb-1 font-mono">Actions</div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleAction('analyze')} disabled={!!processing}
              className="text-xs px-2 py-1 border border-[#0A0A0A] hover:bg-[#F5F0DC] disabled:opacity-50">
              {processing === 'analyze' ? 'Analyzing...' : 'Analyze'}
            </button>
            <button onClick={() => handleAction('match')} disabled={!!processing}
              className="text-xs px-2 py-1 border border-[#0A0A0A] hover:bg-[#F5F0DC] disabled:opacity-50">
              {processing === 'match' ? 'Matching...' : 'Match'}
            </button>
            <button onClick={() => handleAction('generate')} disabled={!!processing}
              className="text-xs px-2 py-1 border border-[#0A0A0A] hover:bg-[#F5F0DC] disabled:opacity-50">
              {processing === 'generate' ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Uploaded Files */}
          <div>
            <h3 className="mb-4">Uploaded Files</h3>
            <div className="border border-[#CCCCCC] bg-white">
              {currentRFP.files.length === 0 && (
                <div className="px-4 py-6 text-center text-[#555555] text-sm">No files uploaded yet</div>
              )}
              {currentRFP.files.map((file) => (
                <div key={file.id} className="px-4 py-3 border-b border-[#CCCCCC] last:border-b-0 flex items-center justify-between hover:bg-[#F5F0DC]">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#555555]" />
                    <div>
                      <div className="font-mono text-sm">{file.original_filename}</div>
                      <div className="text-xs text-[#555555]">
                        {(file.file_size_bytes / 1024 / 1024).toFixed(1)} MB &bull; {file.file_type} &bull; {new Date(file.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Extractions */}
          {rfpAnalysis && (
            <div>
              <h3 className="mb-4">AI Extracted Insights</h3>
              <div className="space-y-3">
                {['client_name', 'scope_summary', 'budget_range', 'timeline', 'submission_deadline', 'complexity_rating'].map(field => {
                  const val = analysisData[field]
                  if (!val) return null
                  return (
                    <div key={field} className="bg-[#F5F0DC] border border-[#CCCCCC] p-4">
                      <div className="text-xs uppercase tracking-wider mb-1 text-[#555555] font-mono">
                        {field.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[#1A1A1A]">{val}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Capability Match */}
          {matchData && (
            <div>
              <h3 className="mb-4">Capability Match</h3>
              <div className="border-2 border-[#0A0A0A] p-6 bg-white">
                <div className="text-xs uppercase tracking-wider mb-2 text-[#555555] font-mono">Overall Match Score</div>
                <div className="text-5xl font-mono text-[#0A0A0A] mb-4">{matchData.overall_match_score || 0}%</div>
                {matchData.gaps && matchData.gaps.length > 0 && (
                  <div className="mt-4 border-t border-[#CCCCCC] pt-4">
                    <div className="text-xs uppercase tracking-wider mb-2 text-[#555555] font-mono">Gaps Identified</div>
                    {matchData.gaps.map((gap: any, i: number) => (
                      <div key={i} className="text-sm border-l-4 border-[#8B5E00] pl-3 mb-2">
                        <div className="font-medium">{gap.requirement}</div>
                        <div className="text-[#555555] text-xs">{gap.mitigation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Generated Proposals */}
          <div>
            <h3 className="mb-4">Generated Proposals</h3>
            <div className="border border-[#CCCCCC] bg-white">
              {currentRFP.proposals.length === 0 && (
                <div className="px-4 py-6 text-center text-[#555555] text-sm">No proposals generated yet</div>
              )}
              {currentRFP.proposals.map((p) => (
                <div key={p.id} className="px-4 py-3 border-b border-[#CCCCCC] last:border-b-0 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold">v{p.version}</div>
                    <div className="text-xs text-[#555555]">{new Date(p.generated_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => handleDownload(p.id, p.version)} className="p-2 hover:bg-[#F5F0DC]">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Key Requirements */}
          {analysisData.key_requirements && (
            <div>
              <h3 className="mb-4">Key Requirements</h3>
              <div className="bg-[#F5F0DC] border border-[#CCCCCC] p-4">
                <ul className="space-y-2">
                  {analysisData.key_requirements.map((req: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[#0A0A0A] font-mono mt-0.5">&#8226;</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Win Strategy */}
          {analysisData.win_strategy_tips && (
            <div>
              <h3 className="mb-4">Win Strategy</h3>
              <div className="bg-white border-2 border-[#1A5C1A] p-4">
                <ul className="space-y-2">
                  {analysisData.win_strategy_tips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[#1A5C1A] font-mono mt-0.5">&#10003;</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Risk Flags */}
          {analysisData.red_flags && analysisData.red_flags.length > 0 && (
            <div>
              <h3 className="mb-4">Risk Flags</h3>
              <div className="bg-white border-2 border-[#8B0000] p-4">
                <ul className="space-y-2">
                  {analysisData.red_flags.map((flag: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[#8B0000] font-mono mt-0.5">&#9888;</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="mb-4">Comments</h3>
            <div className="space-y-3 mb-4">
              {currentRFP.comments.map((comment) => (
                <div key={comment.id} className="border border-[#CCCCCC] p-4 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{comment.user_name || 'User'}</span>
                    <span className="text-xs text-[#555555]">&bull; {new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]"
                onKeyDown={(e) => e.key === 'Enter' && handleComment()} />
              <button onClick={handleComment} className="flex items-center gap-2 px-4 py-2 border border-[#CCCCCC] hover:bg-[#F5F0DC]">
                <MessageSquare className="w-4 h-4" /> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

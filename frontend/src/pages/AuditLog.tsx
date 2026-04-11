import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/client'

interface AuditEntry {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  metadata_json: any
  created_at: string
  user_name: string | null
}

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'upload', label: 'Upload' },
  { value: 'analyze', label: 'Analyze' },
  { value: 'match', label: 'Match' },
  { value: 'generate', label: 'Generate' },
  { value: 'download', label: 'Download' },
  { value: 'status_change', label: 'Status Change' },
]

const PAGE_SIZE = 25

export default function AuditLog() {
  const [items, setItems] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }
      if (actionFilter) params.action = actionFilter
      const res = await api.get('/audit', { params })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch {
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <h2 className="mb-8">Audit Log</h2>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#555555] mb-1 font-mono">
            Action Type
          </label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(0)
            }}
            className="border-2 border-[#0A0A0A] bg-white px-3 py-2 font-sans text-sm min-w-[180px]"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-sm text-[#555555] font-mono">
          {total} {total === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#CCCCCC] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#0A0A0A]">
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-mono text-[#555555]">
                Timestamp
              </th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-mono text-[#555555]">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-mono text-[#555555]">
                Action
              </th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-mono text-[#555555]">
                Resource
              </th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-mono text-[#555555]">
                Resource ID
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[#555555]">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[#555555]">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              items.map((entry) => (
                <tr key={entry.id} className="border-b border-[#CCCCCC] hover:bg-[#F5F0DC]">
                  <td className="px-4 py-3 text-sm font-mono whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {entry.user_name || '---'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block border border-[#0A0A0A] px-2 py-0.5 text-xs font-mono uppercase">
                      {formatAction(entry.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">
                    {entry.resource_type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-[#555555]">
                    {entry.resource_id ? entry.resource_id.slice(0, 8) + '...' : '---'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-[#555555] font-mono">
            Page {page + 1} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border border-[#0A0A0A] px-3 py-1.5 text-sm hover:bg-[#F5F0DC] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="border border-[#0A0A0A] px-3 py-1.5 text-sm hover:bg-[#F5F0DC] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

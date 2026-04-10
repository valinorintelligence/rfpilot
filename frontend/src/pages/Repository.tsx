import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Search } from 'lucide-react'
import { useRFPStore } from '../store/rfpStore'

export default function Repository() {
  const navigate = useNavigate()
  const { rfps, fetchRFPs, isLoading } = useRFPStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  useEffect(() => {
    fetchRFPs()
  }, [])

  const departments = ['all', ...Array.from(new Set(rfps.map((r) => r.department).filter(Boolean) as string[]))]
  const statuses = ['all', 'draft', 'in_progress', 'submitted', 'won', 'lost']

  const filteredData = rfps.filter((rfp) => {
    const matchesSearch = searchTerm === '' ||
      rfp.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || rfp.status === statusFilter
    const matchesDept = departmentFilter === 'all' || rfp.department === departmentFilter
    return matchesSearch && matchesStatus && matchesDept
  })

  const columns = [
    { key: 'client_name', label: 'Client', sortable: true },
    { key: 'title', label: 'RFP Title', sortable: true },
    { key: 'department', label: 'Department', sortable: true, render: (row: any) => row.department || '-' },
    { key: 'estimated_value', label: 'Estimated Value', sortable: true,
      render: (row: any) => row.estimated_value ? `$${(row.estimated_value).toLocaleString()}` : '-' },
    { key: 'submission_deadline', label: 'Deadline', sortable: true,
      render: (row: any) => row.submission_deadline ? new Date(row.submission_deadline).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status',
      render: (row: any) => <Badge status={row.status}>{row.status.replace('_', '-')}</Badge> },
    { key: 'assigned_user_name', label: 'Assigned', sortable: true, render: (row: any) => row.assigned_user_name || '-' },
    { key: 'created_at', label: 'Created', sortable: true,
      render: (row: any) => new Date(row.created_at).toLocaleDateString() },
  ]

  return (
    <div className="p-8 max-w-[1400px]">
      <h2 className="mb-8">RFP Repository</h2>

      <div className="mb-6 grid grid-cols-12 gap-4">
        <div className="col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555555]" />
          <input type="text" placeholder="Search by client or title..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]" />
        </div>
        <div className="col-span-3">
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]">
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</option>
            ))}
          </select>
        </div>
        <div className="col-span-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]">
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', '-')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 text-sm text-[#555555] font-mono">
        Showing {filteredData.length} of {rfps.length} RFPs
      </div>

      <Table columns={columns} data={filteredData} onRowClick={(row) => navigate(`/rfp/${row.id}`)} />
    </div>
  )
}

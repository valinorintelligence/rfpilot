import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatBox } from '../components/ui/StatBox'
import { Table } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useRFPStore } from '../store/rfpStore'
import api from '../api/client'

export default function Dashboard() {
  const navigate = useNavigate()
  const { rfps, fetchRFPs } = useRFPStore()
  const [analytics, setAnalytics] = React.useState<any>(null)

  useEffect(() => {
    fetchRFPs()
    api.get('/analytics/overview').then(res => setAnalytics(res.data)).catch(() => {})
  }, [])

  const stats = analytics ? [
    { label: 'Total RFPs', value: String(analytics.total_rfps), change: '', changeType: 'neutral' as const },
    { label: 'Active Proposals', value: String(analytics.active_proposals), changeType: 'neutral' as const },
    { label: 'Win Rate', value: `${analytics.win_rate}%`, changeType: 'positive' as const },
    { label: 'Pipeline Value', value: `$${(analytics.pipeline_value / 1000000).toFixed(1)}M`, changeType: 'positive' as const },
  ] : [
    { label: 'Total RFPs', value: '0' },
    { label: 'Active Proposals', value: '0' },
    { label: 'Win Rate', value: '0%' },
    { label: 'Pipeline Value', value: '$0' },
  ]

  const winLossData = analytics ? [
    { name: 'Won', value: analytics.won_count, fill: '#1A5C1A' },
    { name: 'Lost', value: analytics.lost_count, fill: '#8B0000' },
  ] : []

  const columns = [
    { key: 'client_name', label: 'Client', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'submission_deadline', label: 'Deadline', sortable: true,
      render: (row: any) => row.submission_deadline ? new Date(row.submission_deadline).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status',
      render: (row: any) => <Badge status={row.status}>{row.status.replace('_', '-')}</Badge> },
    { key: 'assigned_user_name', label: 'Assigned', sortable: true,
      render: (row: any) => row.assigned_user_name || '-' },
  ]

  return (
    <div className="p-8 max-w-[1400px]">
      <h2 className="mb-8">Dashboard</h2>

      <div className="grid grid-cols-4 gap-4 mb-12">
        {stats.map((stat) => (
          <StatBox key={stat.label} {...stat} />
        ))}
      </div>

      {winLossData.length > 0 && (
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="border border-[#CCCCCC] p-6 bg-white">
            <h4 className="mb-4">Win vs Loss Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={winLossData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}>
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-[#CCCCCC] p-6 bg-white">
            <h4 className="mb-4">Recent Activity</h4>
            <div className="space-y-3">
              {rfps.slice(0, 5).map((rfp) => (
                <div key={rfp.id} className="flex items-center justify-between border-b border-[#CCCCCC] pb-2">
                  <div>
                    <div className="text-sm font-medium">{rfp.title}</div>
                    <div className="text-xs text-[#555555]">{rfp.client_name}</div>
                  </div>
                  <Badge status={rfp.status}>{rfp.status.replace('_', '-')}</Badge>
                </div>
              ))}
              {rfps.length === 0 && (
                <p className="text-sm text-[#555555]">No RFPs yet. Create your first one!</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-4">Recent RFP Activity</h3>
        <Table columns={columns} data={rfps.slice(0, 10)} onRowClick={(row) => navigate(`/rfp/${row.id}`)} />
      </div>
    </div>
  )
}

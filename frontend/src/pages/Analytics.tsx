import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts'
import api from '../api/client'

export default function Analytics() {
  const [overview, setOverview] = useState<any>(null)
  const [quarterly, setQuarterly] = useState<any[]>([])
  const [gaps, setGaps] = useState<any[]>([])

  useEffect(() => {
    api.get('/analytics/overview').then(res => setOverview(res.data)).catch(() => {})
    api.get('/analytics/quarterly').then(res => setQuarterly(res.data.quarters || [])).catch(() => {})
    api.get('/analytics/gaps').then(res => setGaps(res.data.gaps || [])).catch(() => {})
  }, [])

  const winRateByDept = [
    { department: 'Government', winRate: 75 },
    { department: 'Enterprise', winRate: 65 },
    { department: 'Healthcare', winRate: 70 },
    { department: 'Finance', winRate: 60 },
    { department: 'Technology', winRate: 80 },
  ]

  return (
    <div className="p-8 max-w-[1400px]">
      <h2 className="mb-8">Proposal Intelligence</h2>

      {/* Summary Stats */}
      {overview && (
        <div className="grid grid-cols-4 gap-4 mb-12">
          <div className="border border-[#CCCCCC] p-6 bg-white">
            <div className="text-xs uppercase tracking-wider text-[#555555] mb-2 font-mono">Total RFPs</div>
            <div className="text-4xl font-mono">{overview.total_rfps}</div>
          </div>
          <div className="border border-[#CCCCCC] p-6 bg-white">
            <div className="text-xs uppercase tracking-wider text-[#555555] mb-2 font-mono">Win Rate</div>
            <div className="text-4xl font-mono text-[#1A5C1A]">{overview.win_rate}%</div>
          </div>
          <div className="border border-[#CCCCCC] p-6 bg-white">
            <div className="text-xs uppercase tracking-wider text-[#555555] mb-2 font-mono">Won / Lost</div>
            <div className="text-4xl font-mono">{overview.won_count} / {overview.lost_count}</div>
          </div>
          <div className="border border-[#CCCCCC] p-6 bg-white">
            <div className="text-xs uppercase tracking-wider text-[#555555] mb-2 font-mono">Pipeline Value</div>
            <div className="text-4xl font-mono">${(overview.pipeline_value / 1000000).toFixed(1)}M</div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div className="border border-[#CCCCCC] p-6 bg-white">
          <h4 className="mb-4">Win Rate by Department</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={winRateByDept} layout="vertical">
              <XAxis type="number" stroke="#1A1A1A" />
              <YAxis type="category" dataKey="department" stroke="#1A1A1A" width={100} />
              <Bar dataKey="winRate" fill="#0A0A0A" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#CCCCCC] p-6 bg-white">
          <h4 className="mb-4">Quarterly Performance</h4>
          {quarterly.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quarterly}>
                <XAxis dataKey="quarter" stroke="#1A1A1A" />
                <YAxis stroke="#1A1A1A" />
                <Bar dataKey="won" fill="#1A5C1A" />
                <Bar dataKey="lost" fill="#8B0000" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[#555555]">
              No quarterly data yet
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="mb-4">Capability Gap Frequency</h3>
          <div className="border-2 border-[#8B5E00] p-6 bg-white">
            {gaps.length > 0 ? (
              <div className="space-y-4">
                {gaps.map((gap, i) => (
                  <div key={i} className="border-l-4 border-[#8B5E00] pl-4">
                    <div className="font-medium mb-1">{gap.capability}</div>
                    <div className="text-sm text-[#555555]">
                      <span className="font-mono">Impact:</span> {gap.impact} &bull;{' '}
                      <span className="font-mono">Frequency:</span> {gap.frequency} occurrences
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#555555]">No gap data available yet. Run capability matches to populate.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-4">Key Metrics</h3>
          <div className="border-2 border-[#1A5C1A] p-6 bg-white">
            <div className="space-y-4">
              <div className="border-l-4 border-[#1A5C1A] pl-4">
                <div className="font-medium mb-1">Average Proposal Time</div>
                <div className="text-sm text-[#555555]">
                  <span className="font-mono text-2xl text-[#0A0A0A]">{overview?.avg_proposal_time_days || 0}</span> days
                </div>
              </div>
              <div className="border-l-4 border-[#1A5C1A] pl-4">
                <div className="font-medium mb-1">Active Proposals</div>
                <div className="text-sm text-[#555555]">
                  <span className="font-mono text-2xl text-[#0A0A0A]">{overview?.active_proposals || 0}</span> in progress
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

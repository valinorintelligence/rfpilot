import React from 'react'

interface StatBoxProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

export function StatBox({ label, value, change, changeType = 'neutral' }: StatBoxProps) {
  const changeColors = {
    positive: 'text-[#1A5C1A]',
    negative: 'text-[#8B0000]',
    neutral: 'text-[#555555]',
  }

  return (
    <div className="border border-[#CCCCCC] p-6 bg-white">
      <div className="text-xs uppercase tracking-wider text-[#555555] mb-2 font-mono">
        {label}
      </div>
      <div className="text-4xl font-mono mb-1 text-[#0A0A0A]">{value}</div>
      {change && (
        <div className={`text-sm font-mono ${changeColors[changeType]}`}>
          {change}
        </div>
      )}
    </div>
  )
}

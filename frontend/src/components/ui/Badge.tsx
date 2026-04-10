import React from 'react'

interface BadgeProps {
  status: string
  children: React.ReactNode
}

const statusClasses: Record<string, string> = {
  draft: 'border-[#CCCCCC] text-[#555555]',
  'in-progress': 'border-[#8B5E00] text-[#8B5E00]',
  in_progress: 'border-[#8B5E00] text-[#8B5E00]',
  submitted: 'border-[#555555] text-[#555555]',
  won: 'border-[#1A5C1A] text-[#1A5C1A]',
  lost: 'border-[#8B0000] text-[#8B0000]',
}

export function Badge({ status, children }: BadgeProps) {
  const classes = statusClasses[status] || statusClasses.draft

  return (
    <span className={`inline-block px-2 py-1 border text-xs uppercase tracking-wider font-mono ${classes}`}>
      {children}
    </span>
  )
}

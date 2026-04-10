import React, { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    const direction = sortDirection === 'asc' ? 1 : -1
    if (aVal < bVal) return -1 * direction
    if (aVal > bVal) return 1 * direction
    return 0
  })

  return (
    <div className="border border-[#CCCCCC] bg-white overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-[#0A0A0A]">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-4 py-3 text-left text-xs"
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <button
                      onClick={() => handleSort(String(column.key))}
                      className="p-1 hover:bg-[#F5F0DC]"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-[#CCCCCC] ${
                onRowClick ? 'cursor-pointer hover:bg-[#F5F0DC]' : ''
              }`}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3">
                  {column.render
                    ? column.render(row)
                    : row[String(column.key)]}
                </td>
              ))}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#555555]">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

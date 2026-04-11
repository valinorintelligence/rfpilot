import React, { useEffect, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { StatBox } from '../components/ui/StatBox'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import api from '../api/client'

interface UserRecord {
  id: string
  email: string
  full_name: string
  role: string
  department: string | null
  is_active: boolean
  created_at: string
}

interface InviteForm {
  email: string
  full_name: string
  password: string
  role: string
  department: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'border-[#0A0A0A] text-[#0A0A0A]',
  manager: 'border-[#8B5E00] text-[#8B5E00]',
  engineer: 'border-[#555555] text-[#555555]',
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<InviteForm>({
    email: '',
    full_name: '',
    password: '',
    role: 'engineer',
    department: '',
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/auth/users')
      setUsers(res.data)
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.is_active).length
  const adminCount = users.filter((u) => u.role === 'admin').length

  const stats = [
    { label: 'Total Users', value: String(totalUsers) },
    { label: 'Active Users', value: String(activeUsers) },
    { label: 'Admins', value: String(adminCount) },
  ]

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        department: form.department || null,
      })
      setShowInvite(false)
      setForm({ email: '', full_name: '', password: '', role: 'engineer', department: '' })
      await fetchUsers()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (user: UserRecord) => {
    try {
      await api.patch(`/auth/users/${user.id}`, { is_active: !user.is_active })
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      )
    } catch {
      setError('Failed to update user status')
    }
  }

  const columns = [
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (row: UserRecord) => (
        <span className="font-medium text-[#0A0A0A]">{row.full_name}</span>
      ),
    },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (row: UserRecord) => (
        <span
          className={`inline-block px-2 py-1 border text-xs uppercase tracking-wider font-mono ${
            ROLE_COLORS[row.role] || ROLE_COLORS.engineer
          }`}
        >
          {row.role}
        </span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (row: UserRecord) => (
        <span className="text-[#555555]">{row.department || '\u2014'}</span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row: UserRecord) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleActive(row)
          }}
          className="flex items-center gap-2 group"
        >
          <span
            className={`inline-block w-2 h-2 ${
              row.is_active ? 'bg-[#1A5C1A]' : 'bg-[#CCCCCC]'
            }`}
          />
          <span
            className={`text-xs uppercase tracking-wider font-mono ${
              row.is_active ? 'text-[#1A5C1A]' : 'text-[#555555]'
            } group-hover:underline`}
          >
            {row.is_active ? 'Active' : 'Inactive'}
          </span>
        </button>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (row: UserRecord) =>
        new Date(row.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
  ]

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex items-center justify-between mb-8">
        <h2>User Management</h2>
        <Button onClick={() => setShowInvite(true)}>
          <span className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Invite User
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-12">
        {stats.map((stat) => (
          <StatBox key={stat.label} {...stat} />
        ))}
      </div>

      {error && (
        <div className="border border-[#8B0000] bg-white px-4 py-3 mb-6 text-sm text-[#8B0000] flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="p-1 hover:bg-[#F5F0DC]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showInvite && (
        <div className="border border-[#CCCCCC] bg-white p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h4>Create New User</h4>
            <button
              onClick={() => setShowInvite(false)}
              className="p-2 hover:bg-[#F5F0DC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleInvite} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#555555] mb-2 font-mono">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-[#CCCCCC] px-4 py-3 bg-white text-sm focus:border-[#0A0A0A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#555555] mb-2 font-mono">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-[#CCCCCC] px-4 py-3 bg-white text-sm focus:border-[#0A0A0A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#555555] mb-2 font-mono">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-[#CCCCCC] px-4 py-3 bg-white text-sm focus:border-[#0A0A0A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#555555] mb-2 font-mono">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-[#CCCCCC] px-4 py-3 bg-white text-sm focus:border-[#0A0A0A] focus:outline-none"
              >
                <option value="engineer">Engineer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs uppercase tracking-wider text-[#555555] mb-2 font-mono">
                Department
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full border border-[#CCCCCC] px-4 py-3 bg-white text-sm focus:border-[#0A0A0A] focus:outline-none"
                placeholder="Optional"
              />
            </div>
            <div className="col-span-2 flex gap-3 justify-end pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h3 className="mb-4">All Users</h3>
        {loading ? (
          <div className="border border-[#CCCCCC] bg-white px-4 py-8 text-center text-[#555555]">
            Loading users...
          </div>
        ) : (
          <Table columns={columns} data={users} />
        )}
      </div>
    </div>
  )
}

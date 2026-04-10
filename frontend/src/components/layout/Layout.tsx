import React, { useEffect } from 'react'
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Database, BarChart3, Settings, User, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, fetchUser, logout } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!user) {
      fetchUser()
    }
  }, [isAuthenticated])

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'New RFP', path: '/new-rfp', icon: FileText },
    { label: 'Repository', path: '/repository', icon: Database },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#F7F5F0]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-2 border-[#0A0A0A] flex flex-col">
        <div className="p-6 border-b-2 border-[#0A0A0A]">
          <h1 className="text-2xl font-serif font-bold tracking-tight">RFPILOT</h1>
          <p className="text-xs text-[#555555] mt-1 font-mono uppercase tracking-wider">
            AI Powered RFP Response
          </p>
        </div>

        <nav className="flex-1 py-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 text-[#1A1A1A] hover:bg-[#F5F0DC] border-l-4 transition-colors ${
                  isActive ? 'border-[#0A0A0A] bg-[#F5F0DC]' : 'border-transparent'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-[#CCCCCC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0A0A0A] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{user?.full_name || 'Loading...'}</div>
              <div className="text-xs text-[#555555] font-mono capitalize">{user?.role || ''}</div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-[#F5F0DC]" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

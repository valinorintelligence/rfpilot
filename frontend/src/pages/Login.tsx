import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-serif font-bold mb-4 tracking-tight">RFPILOT</h1>
          <p className="text-[#555555] font-mono uppercase tracking-wider text-sm">
            AI Powered RFP Response Platform
          </p>
          <div className="mt-6 pt-6 border-t-2 border-[#0A0A0A]">
            <h2 className="text-2xl font-serif font-bold mb-2">Sign In</h2>
            <p className="text-[#555555] text-sm">Access your RFP response workspace</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border-2 border-[#8B0000] bg-white text-[#8B0000] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-center pt-6 border-t border-[#CCCCCC]">
            <p className="text-sm text-[#555555]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#0A0A0A] font-medium underline hover:no-underline">
                Create Account
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-[#CCCCCC]">
          <p className="text-xs text-center text-[#555555] font-mono uppercase tracking-wider">
            Enterprise RFP Intelligence Platform
          </p>
          <div className="mt-4 flex justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-serif font-bold">68%</div>
              <div className="text-xs text-[#555555]">Win Rate</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold">4.2d</div>
              <div className="text-xs text-[#555555]">Avg Time</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold">$42M</div>
              <div className="text-xs text-[#555555]">Pipeline</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

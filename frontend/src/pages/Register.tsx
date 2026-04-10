import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [formData, setFormData] = useState({
    fullName: '', email: '', company: '', jobTitle: '',
    password: '', confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        company: formData.company,
      })
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-serif font-bold mb-4 tracking-tight">RFPILOT</h1>
          <p className="text-[#555555] font-mono uppercase tracking-wider text-sm">
            AI Powered RFP Response Platform
          </p>
          <div className="mt-6 pt-6 border-t-2 border-[#0A0A0A] max-w-md mx-auto">
            <h2 className="text-2xl font-serif font-bold mb-2">Create Account</h2>
            <p className="text-[#555555] text-sm">Join enterprise teams accelerating their RFP response workflow</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border-2 border-[#8B0000] bg-white text-[#8B0000] text-sm max-w-2xl mx-auto">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block mb-2">Full Name</label>
              <input id="fullName" name="fullName" type="text" value={formData.fullName}
                onChange={handleChange} className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]" required />
            </div>
            <div>
              <label htmlFor="email" className="block mb-2">Email Address</label>
              <input id="email" name="email" type="email" value={formData.email}
                onChange={handleChange} className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="company" className="block mb-2">Company Name</label>
              <input id="company" name="company" type="text" value={formData.company}
                onChange={handleChange} className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]" required />
            </div>
            <div>
              <label htmlFor="jobTitle" className="block mb-2">Job Title</label>
              <input id="jobTitle" name="jobTitle" type="text" value={formData.jobTitle}
                onChange={handleChange} className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block mb-2">Password</label>
              <input id="password" name="password" type="password" value={formData.password}
                onChange={handleChange} className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]" required minLength={8} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block mb-2">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword}
                onChange={handleChange} className="w-full px-4 py-3 border border-[#CCCCCC] bg-white focus:outline-none focus:border-[#0A0A0A]" required minLength={8} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center pt-6 border-t border-[#CCCCCC]">
            <p className="text-sm text-[#555555]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0A0A0A] font-medium underline hover:no-underline">Sign In</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

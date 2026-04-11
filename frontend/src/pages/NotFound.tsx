import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-serif font-bold text-[#0A0A0A] mb-2">404</h1>
        <div className="border-t-2 border-[#0A0A0A] pt-4 mb-6">
          <p className="text-lg text-[#555555] font-serif">Page not found</p>
        </div>
        <p className="text-sm text-[#555555] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white px-6 py-3 font-medium hover:bg-[#333333] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

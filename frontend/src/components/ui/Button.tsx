import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon'
  children: React.ReactNode
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseClasses = 'px-6 py-3 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-[#0A0A0A] text-white border-[#0A0A0A] hover:bg-[#1A1A1A]',
    secondary: 'bg-transparent text-[#1A1A1A] border-[#CCCCCC] hover:bg-[#F5F0DC]',
    icon: 'p-2 bg-transparent border-[#CCCCCC] hover:bg-[#F5F0DC]',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

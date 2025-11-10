'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  className?: string
}

export default function SearchBar({
  placeholder = 'Cari...',
  value,
  onChange,
  onSubmit,
  className = '',
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit?.(e)
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-[#E5E7EB] p-4 ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003f7f] transition-colors text-sm font-semibold"
        >
          Cari
        </button>
      </form>
    </div>
  )
}


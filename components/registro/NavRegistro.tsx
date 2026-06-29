'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

interface NavRegistroProps {
  tipo: 'tienda' | 'productor'
}

export function NavRegistro({ tipo }: NavRegistroProps) {
  const accentColor = tipo === 'tienda' ? '#E8FF47' : '#FF6B35'

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: '#0A0A0F',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo variant="dark" className="h-8" linkTo="/" />
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-dm text-sm transition-colors duration-200"
          style={{ color: '#7A7A8A' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = accentColor
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#7A7A8A'
          }}
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>
      </div>
    </nav>
  )
}

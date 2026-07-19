'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

const navLinks = [
  { label: 'Para Tiendas', href: '#tiendas', route: false },
  { label: 'Para Productores', href: '#productores', route: false },
  { label: 'Agente Comercial', href: '/agente-comercial', route: true },
  { label: 'Calculadora', href: '#calculadora', route: false },
  { label: 'Cómo funciona', href: '#como-funciona', route: false },
]

const uneteOptions = [
  {
    label: 'Para Tiendas',
    desc: 'Monetiza tu espacio en tienda',
    href: '/registro-tienda',
    color: '#E8FF47',
  },
  {
    label: 'Para Marcas',
    desc: 'Entra al retail físico sin barreras',
    href: '/registro-productor',
    color: '#FF6B35',
  },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,10,15,0.92)' : 'rgba(10,10,15,0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Logo variant="dark" className="h-6 md:h-7" />

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.route ? (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-suu-text transition-colors duration-200 font-dm text-sm"
                style={{ color: '#FF6B35' }}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-suu-muted hover:text-suu-text transition-colors duration-200 font-dm text-sm"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* Únete dropdown + Mobile toggle */}
        <div className="flex items-center gap-3">
          {/* Desktop, dos botones directos a cada formulario (un clic, sin desplegable) */}
          <div className="hidden md:flex items-center gap-2.5">
            {uneteOptions.map((opt) => (
              <Link
                key={opt.label}
                href={opt.href}
                className="inline-flex items-center px-5 py-2 rounded-pill font-syne font-bold text-sm transition-all duration-200"
                style={{ background: opt.color, color: '#0A0A0F' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.88'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = ''
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-suu-text inline-flex items-center justify-center"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            style={{ width: '44px', height: '44px' }}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden overflow-hidden"
            style={{ background: 'rgba(10,10,15,0.98)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) =>
                link.route ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="font-dm text-base py-3 border-b border-white/5"
                    style={{ color: '#FF6B35' }}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-suu-text font-dm text-base py-3 border-b border-white/5"
                  >
                    {link.label}
                  </a>
                )
              )}
              <div className="flex flex-col gap-2 mt-2">
                {uneteOptions.map((opt) => (
                  <Link
                    key={opt.label}
                    href={opt.href}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-pill font-syne font-bold text-sm text-black"
                    style={{ background: opt.color }}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

const footerLinks = [
  { label: 'Para Tiendas', href: '#tiendas' },
  { label: 'Para Productores', href: '#productores' },
  { label: 'Calculadora', href: '#calculadora' },
  { label: 'Cómo funciona', href: '#como-funciona' },
]

export function Footer() {
  return (
    <footer
      className="py-16 px-6"
      style={{
        background: '#0A0A0F',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 mb-12">
          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-xs">
            <Logo variant="dark" className="h-8" />
            <p className="font-dm text-suu-muted" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.6 }}>
              Democratizando el punto de venta físico · México 2026
            </p>
            <a
              href="mailto:hola@suups.com.mx"
              className="font-dm text-suu-muted hover:text-suu-text transition-colors duration-200"
              style={{ fontSize: '14px' }}
            >
              hola@suups.com.mx
            </a>
            <div className="flex gap-4 mt-1">
              <a
                href="https://instagram.com/suuplai"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Suuplai"
                className="text-suu-muted hover:text-suu-text transition-colors duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-3">
            <span
              className="font-dm font-medium text-suu-muted mb-1"
              style={{ fontSize: '11px', letterSpacing: '2px' }}
            >
              NAVEGACIÓN
            </span>
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-dm text-suu-muted hover:text-suu-text transition-colors duration-200"
                style={{ fontSize: '14px' }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Register CTAs */}
          <div className="flex flex-col gap-3">
            <span
              className="font-dm font-medium text-suu-muted mb-1"
              style={{ fontSize: '11px', letterSpacing: '2px' }}
            >
              REGISTRARSE
            </span>
            <Link
              href="/registro-tienda"
              className="font-dm text-suu-muted hover:text-suu-tienda transition-colors duration-200"
              style={{ fontSize: '14px' }}
            >
              Soy tienda →
            </Link>
            <Link
              href="/registro-productor"
              className="font-dm text-suu-muted hover:text-suu-productor transition-colors duration-200"
              style={{ fontSize: '14px' }}
            >
              Soy productor →
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="font-dm text-suu-muted" style={{ fontSize: '13px' }}>
            © 2026 AL GRANO DELI, S.A. DE C.V. · Todos los derechos reservados
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacidad"
              className="font-dm text-suu-muted hover:text-suu-text transition-colors duration-200"
              style={{ fontSize: '13px' }}
            >
              Aviso de privacidad
            </Link>
            <Link
              href="/terminos"
              className="font-dm text-suu-muted hover:text-suu-text transition-colors duration-200"
              style={{ fontSize: '13px' }}
            >
              Términos de uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

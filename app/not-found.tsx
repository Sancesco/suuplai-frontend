'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Logo } from '@/components/shared/Logo'
import { WHATSAPP_URL } from '@/lib/constants'

const BG     = '#0A0A0F'
const LIME   = '#E8FF47'
const ORANGE = '#FF6B35'
const WHITE  = '#F0EFE8'
const WA     = '#25D366'

// Subtle "All of the Lights"-style flash on the 404, 1 second total
const flashKf = {
  initial: { color: BG },
  animate: { color: [BG, LIME, ORANGE, LIME, WHITE, LIME] },
  transition: {
    duration: 1,
    ease: 'linear',
    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
  },
}

export default function NotFound() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: BG }}
    >
      <div className="flex flex-col items-center text-center max-w-xl gap-6">
        {/* Logo */}
        <div className="mb-4">
          <Logo variant="dark" className="h-8" />
        </div>

        {/* 404 with flash animation */}
        <motion.h1
          className="font-syne font-extrabold leading-none"
          style={{
            fontSize: 'clamp(96px, 18vw, 160px)',
            letterSpacing: '-6px',
            color: LIME,
          }}
          initial={prefersReducedMotion ? false : flashKf.initial}
          animate={prefersReducedMotion ? { color: LIME } : flashKf.animate}
          transition={prefersReducedMotion ? { duration: 0 } : flashKf.transition}
        >
          404
        </motion.h1>

        {/* Subhead */}
        <h2
          className="font-syne font-bold"
          style={{
            fontSize: 'clamp(22px, 3.5vw, 40px)',
            color: WHITE,
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
          }}
        >
          Esta página no existe... todavía.
        </h2>

        {/* Body */}
        <p
          className="font-dm"
          style={{
            fontSize: '16px',
            color: 'rgba(240,239,232,0.6)',
            lineHeight: 1.6,
            maxWidth: '460px',
          }}
        >
          Si llegaste aquí siguiendo un link de la página, mándanos un mensaje y lo arreglamos.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-pill font-syne font-bold transition-all duration-200"
            style={{
              background: LIME,
              color: BG,
              padding: '14px 28px',
              minHeight: '48px',
              fontSize: '15px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.88'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = ''
            }}
          >
            Volver al inicio
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-pill font-syne font-bold transition-all duration-200"
            style={{
              background: WA,
              color: '#FFFFFF',
              padding: '14px 28px',
              minHeight: '48px',
              fontSize: '15px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.88'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = ''
            }}
          >
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}

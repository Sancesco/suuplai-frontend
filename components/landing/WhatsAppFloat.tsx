'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { WHATSAPP_URL } from '@/lib/constants'

export function WhatsAppFloat() {
  const [bounce, setBounce] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return
    const t = setTimeout(() => setBounce(true), 3000)
    return () => clearTimeout(t)
  }, [prefersReducedMotion])

  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      // Position: above sticky mobile CTA on mobile (sticky is ~72px), regular on desktop
      // Mobile: bottom-24 = 96px keeps WhatsApp clear of the 72px sticky CTA
      className="fixed right-5 bottom-24 md:bottom-6 inline-flex items-center justify-center rounded-full shadow-lg shadow-black/40 w-12 h-12 md:w-14 md:h-14"
      style={{ background: '#25D366', zIndex: 40 }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={
        bounce
          ? { opacity: 1, scale: [1, 1.12, 0.95, 1.05, 1] }
          : { opacity: 1, scale: 1 }
      }
      transition={
        bounce
          ? { duration: 0.55, ease: 'easeOut', times: [0, 0.3, 0.55, 0.8, 1] }
          : { duration: 0.4, ease: 'easeOut', delay: 0.6 }
      }
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      onAnimationComplete={() => {
        // ensure bounce only runs once
        if (bounce) setBounce(false)
      }}
    >
      {/* Inline WhatsApp glyph SVG (official-style, single color) */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="md:w-7 md:h-7"
      >
        <path
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.695.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.005a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.886 9.885zM20.52 3.449C18.24 1.245 15.24.025 12.045.025 5.46.025.122 5.358.122 11.946c0 2.105.55 4.157 1.595 5.965L.057 24l6.235-1.635a11.927 11.927 0 005.71 1.45h.005c6.585 0 11.923-5.336 11.926-11.928 0-3.183-1.24-6.175-3.43-8.438z"
          fill="#fff"
        />
      </svg>
    </motion.a>
  )
}

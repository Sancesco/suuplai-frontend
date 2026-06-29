'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const SCROLL_THRESHOLD = 600

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SCROLL_THRESHOLD)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sticky-mobile-cta"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 md:hidden flex items-stretch gap-2 px-4 py-3"
          style={{
            background: 'rgba(10,10,15,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            zIndex: 50,
            // Respect iOS safe area
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <Link
            href="/registro-tienda"
            className="flex-1 inline-flex items-center justify-center rounded-pill font-syne font-bold"
            style={{
              background: '#E8FF47',
              color: '#0A0A0F',
              minHeight: '48px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Tengo tienda
          </Link>
          <Link
            href="/registro-productor"
            className="flex-1 inline-flex items-center justify-center rounded-pill font-syne font-bold"
            style={{
              background: '#FF6B35',
              color: '#FFFFFF',
              minHeight: '48px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Tengo marca
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { motion, useReducedMotion } from 'framer-motion'

// Next.js 14 template.tsx is re-mounted on each navigation, which lets
// Framer Motion play an enter animation per route change.
export default function Template({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

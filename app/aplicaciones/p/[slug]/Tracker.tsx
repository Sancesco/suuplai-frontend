'use client'

import { useEffect } from 'react'
import { track } from './track'

// Registra apertura y tiempo en página (heartbeat de 10s SOLO con la pestaña visible).
export function Tracker({ slug }: { slug: string }) {
  useEffect(() => {
    track(slug, 'open', {})
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') track(slug, 'time_on_page', { seconds: 10 })
    }, 10000)
    return () => clearInterval(iv)
  }, [slug])
  return null
}

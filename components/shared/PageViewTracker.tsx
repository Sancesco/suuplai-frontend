'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { captureAttribution, track } from '@/lib/analytics'

// Captura la atribución en la primera visita y registra page_view en cada cambio de ruta.
export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    captureAttribution()
    track('page_view', { path: pathname })
  }, [pathname])

  return null
}

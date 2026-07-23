'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { captureAttribution, track } from '@/lib/analytics'

// Captura la atribución en la primera visita y registra page_view en cada cambio de ruta.
export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // No contamos el panel interno (/admin, /admin/stats) como visita.
    if (pathname?.startsWith('/admin')) return
    captureAttribution()
    track('page_view', { path: pathname })
    // Heartbeat cada 30s mientras la pestaña está visible (para el indicador "en vivo").
    const ping = () => {
      if (document.visibilityState === 'visible') track('heartbeat', { path: pathname })
    }
    const id = window.setInterval(ping, 30000)
    return () => window.clearInterval(id)
  }, [pathname])

  return null
}

'use client'

import { useEffect, useState } from 'react'

// Barra fija de progreso de lectura (feedback + se ve chingón).
export function ReadingBar() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setPct(max > 0 ? Math.min(100, Math.round((h.scrollTop / max) * 100)) : 0)
    }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])
  return <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, height: 3, width: `${pct}%`, background: '#C6F135', zIndex: 50, transition: 'width .1s linear' }} />
}

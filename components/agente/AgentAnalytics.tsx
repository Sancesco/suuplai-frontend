'use client'

import { useEffect } from 'react'
import { track, trackExit } from '@/lib/analytics'

// Mide: profundidad de scroll (25/50/75/100), tiempo por sección (IntersectionObserver),
// y el punto de salida. Todo se manda en el evento `exit` al salir.
export function AgentAnalytics() {
  useEffect(() => {
    const start = Date.now()
    const timeBySection: Record<string, number> = {}
    const visibleSince = new Map<string, number>()
    let currentSection = ''
    const firedScroll = new Set<number>()

    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const name = (e.target as HTMLElement).dataset.section || ''
          if (!name) return
          if (e.isIntersecting) {
            visibleSince.set(name, Date.now())
            currentSection = name
          } else {
            const since = visibleSince.get(name)
            if (since != null) {
              timeBySection[name] = (timeBySection[name] || 0) + (Date.now() - since)
              visibleSince.delete(name)
            }
          }
        })
      },
      { threshold: 0.5 }
    )
    els.forEach((el) => io.observe(el))

    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - window.innerHeight
      if (total <= 0) return
      const pct = (doc.scrollTop / total) * 100
      for (const t of [25, 50, 75, 100]) {
        if (pct >= t && !firedScroll.has(t)) {
          firedScroll.add(t)
          track(`scroll_${t}`)
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    let done = false
    const finish = () => {
      if (done) return
      done = true
      const nowT = Date.now()
      visibleSince.forEach((since, name) => {
        timeBySection[name] = (timeBySection[name] || 0) + (nowT - since)
      })
      const sections: Record<string, number> = {}
      Object.keys(timeBySection).forEach((k) => {
        sections[k] = Math.round(timeBySection[k] / 1000)
      })
      trackExit({ seconds: Math.round((nowT - start) / 1000), sections, exitSection: currentSection })
    }
    window.addEventListener('beforeunload', finish)

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('beforeunload', finish)
      finish()
    }
  }, [])

  return null
}

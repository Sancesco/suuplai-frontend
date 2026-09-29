'use client'

import { useEffect } from 'react'
import { track } from './track'

// Apertura + tiempo en página (heartbeat 10s con pestaña visible) + tiempo por sección.
export function Tracker({ slug }: { slug: string }) {
  useEffect(() => {
    track(slug, 'open', {})
    const hb = setInterval(() => { if (document.visibilityState === 'visible') track(slug, 'time_on_page', { seconds: 10 }) }, 10000)

    const timers = new Map<string, number>() // sección → ms de inicio (0 = no visible)
    const flush = (section: string) => {
      const start = timers.get(section)
      if (start) { const secs = Math.round((Date.now() - start) / 1000); timers.set(section, 0); if (secs >= 2) track(slug, 'section_view', { section, seconds: secs }) }
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const section = (e.target as HTMLElement).dataset.section || 'x'
        if (e.isIntersecting && e.intersectionRatio >= 0.4) { if (!timers.get(section)) timers.set(section, Date.now()) }
        else flush(section)
      }
    }, { threshold: [0, 0.4, 1] })
    const els = Array.from(document.querySelectorAll('[data-section]')) as HTMLElement[]
    els.forEach((el) => io.observe(el))
    const onHide = () => { if (document.visibilityState === 'hidden') els.forEach((el) => flush(el.dataset.section || 'x')) }
    document.addEventListener('visibilitychange', onHide)

    return () => { clearInterval(hb); io.disconnect(); document.removeEventListener('visibilitychange', onHide); els.forEach((el) => flush(el.dataset.section || 'x')) }
  }, [slug])
  return null
}

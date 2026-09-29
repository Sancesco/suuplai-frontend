// Helpers de tracking del lado del cliente (los usan Tracker y CvButton).
export function getVid(): string {
  try {
    const m = document.cookie.match(/(?:^|; )app_vid=([^;]+)/)
    if (m) return m[1]
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 32)
    document.cookie = `app_vid=${id}; path=/; max-age=31536000; samesite=lax`
    return id
  } catch { return 'anon' }
}

export function track(slug: string, tipo: string, data?: Record<string, unknown>): void {
  try {
    const body = JSON.stringify({ slug, tipo, visitor_id: getVid(), data: data || {}, referrer: document.referrer || '' })
    if (navigator.sendBeacon) navigator.sendBeacon('/api/aplicaciones/track', new Blob([body], { type: 'application/json' }))
    else fetch('/api/aplicaciones/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
  } catch { /* noop */ }
}

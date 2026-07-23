'use client'

import { useEffect, useState } from 'react'

// Analítica propia (cliente). Captura atribución en la primera visita de la sesión
// (sessionStorage), y manda eventos a POST /api/track sin bloquear ni romper la UX.

const ATTR_KEY = 'suuplai_attr'

export interface Attribution {
  sessionId: string
  src: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  referrer: string | null
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

// Lee/crea la atribución de la sesión. First-touch: solo se escribe una vez por sesión.
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') {
    return { sessionId: '', src: null, utmSource: null, utmMedium: null, utmCampaign: null, referrer: null }
  }
  try {
    const raw = sessionStorage.getItem(ATTR_KEY)
    if (raw) return JSON.parse(raw) as Attribution
  } catch {
    /* noop */
  }
  const p = new URLSearchParams(window.location.search)
  const attr: Attribution = {
    sessionId: uuid(),
    src: p.get('src'),
    utmSource: p.get('utm_source'),
    utmMedium: p.get('utm_medium'),
    utmCampaign: p.get('utm_campaign'),
    referrer: document.referrer || null,
  }
  try {
    sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr))
  } catch {
    /* noop */
  }
  return attr
}

function getAttribution(): Attribution {
  return captureAttribution()
}

function buildBody(type: string, payload?: Record<string, unknown>) {
  const a = getAttribution()
  return {
    type,
    payload: payload ?? null,
    sessionId: a.sessionId,
    src: a.src,
    utmSource: a.utmSource,
    utmMedium: a.utmMedium,
    utmCampaign: a.utmCampaign,
    referrer: a.referrer,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    path: window.location.pathname,
  }
}

// Evento normal (fetch keepalive). Silencioso: la analítica nunca rompe la página.
export function track(type: string, payload?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  try {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildBody(type, payload)),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* noop */
  }
}

// Evento de salida (beforeunload): sendBeacon garantiza el envío al cerrar/navegar.
export function trackExit(payload?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  try {
    const body = JSON.stringify(buildBody('exit', payload))
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/track', blob)
    } else {
      void fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
    }
  } catch {
    /* noop */
  }
}

// Hook pedido en el brief: captura la atribución en la primera visita y la devuelve.
export function useAttribution(): Attribution | null {
  const [attr, setAttr] = useState<Attribution | null>(null)
  useEffect(() => {
    setAttr(captureAttribution())
  }, [])
  return attr
}

// Hook pedido en el brief: devuelve la función track.
export function useTrack() {
  return { track }
}

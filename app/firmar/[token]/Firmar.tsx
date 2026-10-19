'use client'

import { useEffect, useRef, useState } from 'react'

const C = { bg: '#0A0A0F', surf: '#131319', surf2: '#0d0d12', border: '#26262F', text: '#F0EFE8', dim: '#8A8A93', lime: '#E8FF47' }
const PDFJS = '3.11.174'

type Parte = { full_name: string; role: string | null; signed_at: string | null; yo: boolean }
type Data = {
  expirado: boolean
  contrato: { title: string; status: string; tienePdf: boolean }
  firmante: { full_name: string; role: string | null; email: string; signed_at: string | null }
  partes: Parte[]
}
type Estado = 'loading' | 'ready' | 'already' | 'done' | 'expired' | 'error'

// Tipos mínimos de pdf.js (sin usar any)
type PdfViewport = { width: number; height: number }
type PdfPage = { getViewport(o: { scale: number }): PdfViewport; render(o: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport; transform?: number[] }): { promise: Promise<void> } }
type PdfDoc = { numPages: number; getPage(n: number): Promise<PdfPage> }
type PdfLib = { GlobalWorkerOptions: { workerSrc: string }; getDocument(src: string): { promise: Promise<PdfDoc> } }

function cargarPdfJs(): Promise<PdfLib> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { pdfjsLib?: PdfLib }
    if (w.pdfjsLib) return resolve(w.pdfjsLib)
    const prev = document.getElementById('pdfjs-script') as HTMLScriptElement | null
    if (prev) { prev.addEventListener('load', () => w.pdfjsLib ? resolve(w.pdfjsLib) : reject(new Error('pdf.js'))); return }
    const s = document.createElement('script')
    s.id = 'pdfjs-script'
    s.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS}/pdf.min.js`
    s.onload = () => w.pdfjsLib ? resolve(w.pdfjsLib) : reject(new Error('pdf.js'))
    s.onerror = () => reject(new Error('no se pudo cargar el visor de PDF'))
    document.head.appendChild(s)
  })
}

export function Firmar({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>('loading')
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [consent, setConsent] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [completo, setCompleto] = useState(false)

  const [pdfCargando, setPdfCargando] = useState(true)
  const [pdfErr, setPdfErr] = useState<string | null>(null)
  const visorRef = useRef<HTMLDivElement | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  // Carga los datos del contrato
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const res = await fetch(`/api/firmar/${token}`, { cache: 'no-store' })
        const json = await res.json()
        if (!vivo) return
        if (!res.ok || !json.ok) { setError(json.error || 'Enlace no válido'); setEstado('error'); return }
        setData(json as Data)
        if (json.firmante.signed_at) setEstado('already')
        else if (json.expirado) setEstado('expired')
        else setEstado('ready')
      } catch { if (vivo) { setError('No se pudo cargar el contrato'); setEstado('error') } }
    })()
    return () => { vivo = false }
  }, [token])

  // Renderiza el PDF con pdf.js
  useEffect(() => {
    if (estado !== 'ready' || !data?.contrato.tienePdf) return
    let cancel = false
    setPdfCargando(true); setPdfErr(null)
    ;(async () => {
      try {
        const lib = await cargarPdfJs()
        lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS}/pdf.worker.min.js`
        const doc = await lib.getDocument(`/api/firmar/${token}/pdf`).promise
        if (cancel) return
        const cont = visorRef.current; if (!cont) return
        cont.innerHTML = ''
        const ancho = cont.clientWidth || 600
        const outputScale = window.devicePixelRatio || 1
        for (let p = 1; p <= doc.numPages; p++) {
          const page = await doc.getPage(p)
          if (cancel) return
          const base = page.getViewport({ scale: 1 })
          const vp = page.getViewport({ scale: ancho / base.width })
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(vp.width * outputScale)
          canvas.height = Math.floor(vp.height * outputScale)
          canvas.style.width = '100%'; canvas.style.height = 'auto'
          canvas.style.display = 'block'; canvas.style.marginBottom = '10px'; canvas.style.borderRadius = '6px'; canvas.style.background = '#fff'
          const ctx = canvas.getContext('2d'); if (!ctx) continue
          cont.appendChild(canvas)
          await page.render({ canvasContext: ctx, viewport: vp, transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined }).promise
        }
        if (!cancel) setPdfCargando(false)
      } catch (e) { if (!cancel) { setPdfErr(e instanceof Error ? e.message : 'Error al mostrar el PDF'); setPdfCargando(false) } }
    })()
    return () => { cancel = true }
  }, [estado, data, token])

  // Inicializa el canvas de firma
  useEffect(() => {
    if (estado !== 'ready') return
    const cv = canvasRef.current; if (!cv) return
    const dpr = window.devicePixelRatio || 1
    const rect = cv.getBoundingClientRect()
    cv.width = Math.round(rect.width * dpr); cv.height = Math.round(rect.height * dpr)
    const ctx = cv.getContext('2d'); if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.text
    ctxRef.current = ctx
  }, [estado])

  const posicion = (e: React.PointerEvent) => {
    const cv = canvasRef.current!; const r = cv.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const down = (e: React.PointerEvent) => {
    const ctx = ctxRef.current; if (!ctx) return
    e.preventDefault(); drawing.current = true
    const { x, y } = posicion(e); ctx.beginPath(); ctx.moveTo(x, y)
    try { canvasRef.current?.setPointerCapture(e.pointerId) } catch { /* noop */ }
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = ctxRef.current; if (!ctx) return
    e.preventDefault(); const { x, y } = posicion(e); ctx.lineTo(x, y); ctx.stroke()
    if (!hasInk) setHasInk(true)
  }
  const up = () => { drawing.current = false }
  const rehacer = () => {
    const cv = canvasRef.current, ctx = ctxRef.current; if (!cv || !ctx) return
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore()
    setHasInk(false)
  }

  // Verifica si hay trazo mirando los píxeles reales del recuadro (robusto, sin depender de estado).
  function hayFirma(): boolean {
    const cv = canvasRef.current, ctx = ctxRef.current
    if (!cv || !ctx) return false
    try {
      const { data } = ctx.getImageData(0, 0, cv.width, cv.height)
      for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return true
      return false
    } catch { return true } // si no se puede leer, no bloqueamos
  }

  async function firmar() {
    if (enviando || !canvasRef.current) return
    if (!nombre.trim()) { setError('Escribe tu nombre completo.'); return }
    if (!consent) { setError('Marca la casilla de consentimiento.'); return }
    if (!hayFirma()) { setError('Dibuja tu firma en el recuadro antes de firmar.'); return }
    setEnviando(true); setError(null)
    try {
      const signature_png = canvasRef.current.toDataURL('image/png')
      const res = await fetch(`/api/firmar/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: nombre, consent, signature_png }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo firmar')
      setCompleto(!!json.completo); setEstado('done')
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setEnviando(false) }
  }

  return (
    <div style={wrap}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&family=Space+Mono&display=swap" />
      <div style={container}>
        <div style={{ ...mono, color: C.dim, letterSpacing: '0.22em', marginBottom: 20 }}>
          suupl<span style={{ color: C.lime }}>ai</span> · DOCUMENTO LEGAL
        </div>

        {estado === 'loading' && <p style={{ color: C.dim }}>Cargando contrato…</p>}

        {estado === 'error' && (
          <div style={panel}><h1 style={h1}>No se pudo abrir</h1><p style={{ color: C.dim }}>{error || 'El enlace no es válido.'}</p></div>
        )}
        {estado === 'expired' && (
          <div style={panel}><h1 style={h1}>Enlace expirado</h1><p style={{ color: C.dim }}>Este enlace de firma ya venció (30 días). Pide uno nuevo a quien te lo envió.</p></div>
        )}
        {estado === 'already' && data && (
          <div style={panel}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
            <h1 style={h1}>Ya firmaste este contrato</h1>
            <p style={{ color: C.dim }}>{data.contrato.title}</p>
            <p style={{ color: C.dim, fontSize: 13, marginTop: 8 }}>No necesitas hacer nada más. Recibirás el PDF final por correo cuando ambas partes hayan firmado.</p>
          </div>
        )}
        {estado === 'done' && (
          <div style={panel}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
            <h1 style={h1}>Firma registrada</h1>
            <p style={{ color: C.dim }}>
              {completo
                ? 'Ambas partes han firmado. El contrato queda completo y recibirás el PDF final por correo.'
                : 'Tu firma quedó registrada. Falta la otra parte; cuando firme, recibirás el PDF final por correo.'}
            </p>
          </div>
        )}

        {estado === 'ready' && data && (
          <>
            <h1 style={h1}>{data.contrato.title}</h1>
            <div style={{ ...mono, color: C.dim, fontSize: 12, marginBottom: 12 }}>
              PARA: {data.firmante.full_name}{data.firmante.role ? ` · ${data.firmante.role}` : ''}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: C.surf, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
              {data.partes.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
                  <span>{p.full_name}{p.role ? ` · ${p.role}` : ''}{p.yo ? ' (tú)' : ''}</span>
                  <span style={{ color: p.signed_at ? C.lime : C.dim, fontFamily: 'Space Mono, monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{p.signed_at ? '✓ firmó' : 'pendiente'}</span>
                </div>
              ))}
            </div>

            <label style={label}>Documento</label>
            <div style={visor}>
              <div ref={visorRef} />
              {pdfCargando && !pdfErr && <p style={{ color: C.dim, fontSize: 13, textAlign: 'center', padding: 20 }}>Cargando documento…</p>}
              {pdfErr && (
                <p style={{ color: C.dim, fontSize: 13, textAlign: 'center', padding: 20 }}>
                  No se pudo mostrar el PDF aquí. <a href={`/api/firmar/${token}/pdf`} target="_blank" rel="noreferrer" style={{ color: C.lime }}>Ábrelo en una pestaña →</a>
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <a href={`/api/firmar/${token}/pdf`} target="_blank" rel="noreferrer" style={{ color: C.dim, fontSize: 12 }}>Abrir el PDF en pantalla completa ↗</a>
            </div>

            <div style={{ height: 28 }} />

            <label style={label}>Tu firma</label>
            <div style={{ position: 'relative' }}>
              <canvas ref={canvasRef}
                style={{ width: '100%', height: 180, background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 12, touchAction: 'none', display: 'block', cursor: 'crosshair' }}
                onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} />
              {!hasInk && <span style={{ position: 'absolute', left: 16, top: 16, color: C.dim, fontSize: 13, pointerEvents: 'none' }}>Dibuja tu firma con el dedo o el mouse</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={rehacer} style={ghost}>Rehacer</button>
            </div>

            <div style={{ height: 20 }} />
            <label style={label}>Escribe tu nombre completo, tal como aparece en el contrato</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Escríbelo aquí…" style={input} />

            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: C.lime, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, lineHeight: 1.5, color: C.text, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                He leído el documento completo y acepto firmarlo electrónicamente. Reconozco que mi firma electrónica tiene la misma validez que una firma de puño y letra.
              </span>
            </label>

            {error && <p style={{ color: '#ff6b6b', marginTop: 14, fontSize: 14 }}>⚠ {error}</p>}

            <button onClick={firmar} disabled={enviando} style={{ ...primary, opacity: enviando ? 0.6 : 1, cursor: enviando ? 'default' : 'pointer', marginTop: 20 }}>
              {enviando ? 'Firmando…' : 'Firmar contrato'}
            </button>
            <p style={{ color: C.dim, fontSize: 11, marginTop: 12, fontFamily: 'Space Mono, monospace' }}>
              Al firmar se registran la fecha, hora, tu dirección IP y tu navegador como constancia.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const wrap: React.CSSProperties = { minHeight: '100vh', background: C.bg, color: C.text, padding: '32px 18px 80px', fontFamily: 'DM Sans, system-ui, sans-serif' }
const container: React.CSSProperties = { maxWidth: 680, margin: '0 auto' }
const mono: React.CSSProperties = { fontFamily: 'Space Mono, ui-monospace, monospace', fontSize: 11, textTransform: 'uppercase' }
const h1: React.CSSProperties = { fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 5vw, 30px)', lineHeight: 1.1, margin: '0 0 6px' }
const panel: React.CSSProperties = { background: C.surf, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, textAlign: 'center' }
const visor: React.CSSProperties = { background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 10, maxHeight: '58vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }
const label: React.CSSProperties = { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim, marginBottom: 8 }
const input: React.CSSProperties = { width: '100%', background: C.surf, border: `1px solid ${C.border}`, borderRadius: 10, padding: '13px 15px', color: C.text, fontSize: 16, outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif' }
const primary: React.CSSProperties = { width: '100%', background: C.lime, color: C.bg, border: 'none', borderRadius: 999, padding: '15px', fontWeight: 700, fontSize: 15, fontFamily: 'Syne, system-ui, sans-serif' }
const ghost: React.CSSProperties = { background: 'transparent', color: C.dim, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }

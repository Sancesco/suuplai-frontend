'use client'

import { useCallback, useEffect, useState } from 'react'

interface Row {
  id: string; empresa: string; persona: string | null; puesto: string | null; email: string | null
  sector: string | null; idioma: string; slug: string | null; estado: string; created_at: string
  clicks: number; abierto: number; seconds: number; cv: number; chat: number; last: string | null
  toque: number; enviado_en: string | null
  gancho: string | null; cita: string | null; confianza: string | null; angulo: string | null
  afirma_cifra: boolean; evidencia_url: string | null; auto_enviable: boolean
}
type Fila = { empresa: string; persona: string; puesto: string; email: string; sitio_web: string; linkedin: string }

function dur(s: number) { return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s` }
function fecha(iso: string | null) { return iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '—' }
const EST: Record<string, { t: string; bg: string; c: string }> = {
  nuevo: { t: 'Nuevo', bg: '#EEE', c: '#666' }, investigando: { t: 'Investigando…', bg: '#EEE', c: '#666' },
  sin_gancho: { t: '⚠ Sin gancho', bg: '#FFE8CC', c: '#9A5B00' }, listo: { t: 'En cola', bg: '#E4ECFF', c: '#2456C9' },
  en_secuencia: { t: 'En secuencia', bg: '#FFF3D6', c: '#9A6A00' }, respondio: { t: '✓ Respondió', bg: '#D9F2E4', c: '#1E8E5A' },
  reboto: { t: 'Rebotó', bg: '#F3D9D0', c: '#9B3412' }, descartado: { t: 'Descartado', bg: '#EEE', c: '#999' }, cerrado: { t: 'Cerrado', bg: '#EEE', c: '#999' },
}
const confColor = (c: string | null) => c === 'alta' ? { bg: '#D9F2E4', c: '#1E8E5A' } : c === 'media' ? { bg: '#FFF3D6', c: '#9A6A00' } : { bg: '#F3D9D0', c: '#9B3412' }

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s
const NOISE = /^(company logo|add to (list|sequence|list\+)|edit layout|contact information|primary|business|source:|mobile|work|direct|home|view|save|request|·|\d+ (connection|follower)|see more|message|connect|following)/i

// Modo estructurado: una fila por línea con columnas (hoja/CSV).
// Orden: empresa, persona, puesto, email, sitio_web, linkedin
function parseEstructurado(lineas: string[], sep: '\t' | ','): Fila[] {
  return lineas.map((l) => {
    const c = l.split(sep).map((x) => x.trim())
    return { empresa: c[0] || '', persona: c[1] || '', puesto: c[2] || '', email: c[3] || '', sitio_web: c[4] || '', linkedin: c[5] || '' }
  }).filter((f) => f.empresa)
}

// Modo inteligente (pegado de Apollo/LinkedIn): ancla en el EMAIL, saca nombre,
// "Puesto at Empresa" y, si falta empresa, la deriva del dominio del correo.
function parseInteligente(lineas: string[]): Fila[] {
  const out: Fila[] = []
  let nombre = '', puesto = '', empresa = '', linkedin = ''
  const flush = (email: string) => {
    const dom = (email.split('@')[1] || '').split('.')[0]
    out.push({ empresa: empresa || cap(dom), persona: nombre, puesto, email, sitio_web: '', linkedin })
    nombre = ''; puesto = ''; empresa = ''; linkedin = ''
  }
  for (const raw of lineas) {
    const l = raw.trim(); if (!l) continue
    const em = l.match(EMAIL)
    if (em) { flush(em[0]); continue }
    if (/linkedin\.com\/in\//i.test(l)) { linkedin = l; continue }
    if (NOISE.test(l) || /^[A-ZÁÉÍÓÚÑ]{1,3}$/.test(l)) continue
    // "Puesto at Empresa" / "Puesto en Empresa"
    const m = l.split(/\s+(?:at|en|@|\|)\s+/i)
    if (m.length === 2 && m[0] && m[1] && !/,/.test(m[1])) { puesto = m[0].trim(); empresa = m[1].trim(); continue }
    // Nombre: 2-4 palabras, sin coma ni dígitos (descarta ciudades tipo "Mexico City, Mexico")
    if (!nombre && !/[,\d]/.test(l) && /^[A-Za-zÀ-ÿ'.-]+(?:\s+[A-Za-zÀ-ÿ'.-]+){1,3}$/.test(l)) { nombre = l; continue }
  }
  return out
}

// Autodetecta el formato del pegado.
function parsear(texto: string): Fila[] {
  const lineas = texto.split('\n').map((l) => l.trim()).filter(Boolean)
  if (!lineas.length) return []
  if (lineas.some((l) => l.includes('\t'))) return parseEstructurado(lineas.filter((l) => l.includes('\t')), '\t')
  const conEmail = lineas.filter((l) => EMAIL.test(l))
  // CSV: líneas con email y coma → una fila por línea
  if (conEmail.length && conEmail.every((l) => l.includes(','))) return parseEstructurado(lineas, ',')
  // Apollo/LinkedIn: emails en su propia línea → modo inteligente
  if (conEmail.length) return parseInteligente(lineas)
  // Sin emails: trata como CSV por si traen empresa/persona sin correo
  return parseEstructurado(lineas, ',')
}

export function Outbound() {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [gmail, setGmail] = useState<{ conectado: boolean; email: string | null }>({ conectado: false, email: null })
  const [texto, setTexto] = useState(''); const [idioma, setIdioma] = useState<'es' | 'en'>('es')
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [enviando, setEnviando] = useState('')
  const [preview, setPreview] = useState<{ id: string; from: string; to: string | null; asunto: string; cuerpo: string; estado: string; cuando: string | null; detalleCola: string | null; plan: { paso: string; fecha: string; hecho: boolean }[] } | null>(null)
  const [cargandoPrev, setCargandoPrev] = useState('')
  const hdr = { 'x-admin-password': pw }
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    const u = new URLSearchParams(window.location.search)
    if (u.get('gmail') === 'ok') setMsg(`✓ Gmail conectado${u.get('email') ? ': ' + u.get('email') : ''}`)
    else if (u.get('gmail') === 'error') setMsg('⚠ No se pudo conectar Gmail: ' + (u.get('msg') || 'revisa las credenciales'))
  }, [])

  const guardarAuth = (p: string) => { try { localStorage.setItem('outbound_auth', JSON.stringify({ pw: p, exp: Date.now() + 30 * 86400000 })) } catch { /* modo privado */ } }
  const cerrarSesion = () => { try { localStorage.removeItem('outbound_auth') } catch {} setPw(''); setAuthed(false); setRows(null) }

  const load = useCallback(async (pwArg?: string) => {
    const p = pwArg ?? pw
    setErr('')
    try {
      const r = await fetch('/api/outbound/prospectos', { headers: { 'x-admin-password': p } })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setRows(j.prospectos as Row[]); setGmail(j.gmail || { conectado: false, email: null }); setAuthed(true); guardarAuth(p)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw]) // eslint-disable-line react-hooks/exhaustive-deps

  // Recuerda la compu por 30 días: auto-login si hay sesión guardada y no venció.
  useEffect(() => {
    try { const raw = localStorage.getItem('outbound_auth'); if (raw) { const s = JSON.parse(raw); if (s?.pw && s.exp > Date.now()) { setPw(s.pw); load(s.pw) } } } catch { /* ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async (id: string) => {
    setEnviando(id); setMsg('')
    try {
      const r = await fetch('/api/outbound/enviar', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ prospectoId: id }) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setMsg('✓ Correo enviado'); load()
    } catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setEnviando('') }
  }

  const crear = async () => {
    const filas = parsear(texto)
    if (!filas.length) { setMsg('Pega al menos una fila (empresa, persona, puesto, email…).'); return }
    setBusy(true); setMsg(`Creando ${filas.length} prospecto(s) y sus páginas de CV…`)
    try {
      const r = await fetch('/api/outbound/prospectos', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ idioma, prospectos: filas }) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setTexto(''); await load()
      const nuevos = (j.ids || []) as string[]
      // Auto-investiga cada empresa (uno por uno) → arma el gancho y aplica la compuerta.
      for (let i = 0; i < nuevos.length; i++) { setMsg(`🔎 Investigando empresas… ${i + 1}/${nuevos.length}`); await investigar(nuevos[i]) }
      setMsg(`✓ ${j.creados} creados e investigados${j.saltados?.length ? ` · ${j.saltados.length} duplicados` : ''}. Los de alta confianza entran en cola; los demás quedan en “Sin gancho” para revisar.`)
    } catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setBusy(false) }
  }

  const [invId, setInvId] = useState<Set<string>>(new Set())
  const marcarInv = (id: string, on: boolean) => setInvId((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n })
  const investigar = async (id: string) => {
    marcarInv(id, true); setMsg('')
    try {
      const r = await fetch('/api/outbound/investigar', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const j = await r.json(); if (!r.ok || !j.ok) setMsg('⚠ ' + (j.error || 'Error investigando'))
    } catch { setMsg('⚠ Error investigando') } finally { marcarInv(id, false); load() }
  }
  const patchPros = async (id: string, body: Record<string, unknown>) => {
    await fetch('/api/outbound/prospectos', { method: 'PATCH', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) }); load()
  }
  const verPreview = async (id: string) => {
    setCargandoPrev(id)
    try {
      const r = await fetch('/api/outbound/preview', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ prospectoId: id }) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setPreview({ id, from: j.from, to: j.to, asunto: j.asunto, cuerpo: j.cuerpo, estado: j.estado, cuando: j.cuando, detalleCola: j.detalleCola, plan: j.plan || [] })
    } catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setCargandoPrev('') }
  }
  const fechaHora = (iso: string | null) => iso ? new Date(iso).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' }) : null
  const copiar = (s: string) => { navigator.clipboard?.writeText(s) }
  const inp = 'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900'
  const detectados = parsear(texto)

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne',sans-serif" }}>Outbound</h1>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Prospectos · búsqueda de trabajo</span>
            {authed && <button onClick={cerrarSesion} className="text-xs text-neutral-400 underline">cerrar sesión</button>}
          </div>
        </div>

        {!authed && (
          <div className="flex max-w-md flex-wrap gap-2">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Contraseña"
              className="min-w-[200px] flex-1 rounded-lg border border-neutral-900 bg-white px-3.5 py-2.5 text-sm outline-none" />
            <button onClick={() => load()} disabled={!pw} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-lime-300">Entrar</button>
          </div>
        )}
        {err && <p className="mt-2 text-sm text-red-700">⚠ {err}</p>}

        {authed && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm">
              <span className="font-semibold">Gmail:</span>
              {gmail.conectado ? (
                <>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">✓ conectado{gmail.email ? ` · ${gmail.email}` : ''}</span>
                  <a href={`/api/outbound/gmail/auth?pw=${encodeURIComponent(pw)}`} className="text-xs text-neutral-500 underline">reconectar</a>
                </>
              ) : (
                <a href={`/api/outbound/gmail/auth?pw=${encodeURIComponent(pw)}`} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-lime-300">Conectar Gmail</a>
              )}
              <span className="ml-auto text-xs text-neutral-400">envío desde tu alias · recordatorios automáticos en el hilo</span>
            </div>
            {gmail.conectado && (
              <p className="mb-4 -mt-2 text-xs text-neutral-500">Los que subes entran <b>en cola</b> y se mandan <b>solos</b> (envío diario 9am CDMX, con rampa de 5/día al inicio). No necesitas picar nada — <i>“Enviar ahora”</i> es solo para adelantar uno.</p>
            )}

            <div className="mb-5 rounded-2xl border-2 border-neutral-900 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <b className="text-sm">Pegar prospectos</b>
                <span className="text-xs text-neutral-500">una fila por línea · columnas: empresa, persona, puesto, email, sitio, linkedin (tab o coma)</span>
              </div>
              <textarea className={`${inp} font-mono text-[12.5px]`} rows={6} placeholder={'Pega de una hoja (tab), CSV, o directo de Apollo/LinkedIn.\nAnthropic\tDario Amodei\tLatam Lead\tdario@anthropic.com'} value={texto} onChange={(e) => setTexto(e.target.value)} />
              {texto.trim() && (
                <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs">
                  {detectados.length === 0 ? <span className="text-[#B4451A]">No detecté contactos (revisa que traiga empresa o correo).</span> : (
                    <span className="text-neutral-700"><b>Detecté {detectados.length} contacto{detectados.length > 1 ? 's' : ''}:</b> {detectados.slice(0, 8).map((f) => f.persona || f.empresa || f.email).join(' · ')}{detectados.length > 8 ? ` · +${detectados.length - 8}` : ''}</span>
                  )}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-500">CV default:</span>
                  <div className="inline-flex overflow-hidden rounded-lg border border-neutral-300">
                    <button onClick={() => setIdioma('es')} className={`px-3 py-1.5 ${idioma === 'es' ? 'bg-neutral-900 text-lime-300 font-bold' : 'bg-white'}`}>🇲🇽 Español</button>
                    <button onClick={() => setIdioma('en')} className={`px-3 py-1.5 ${idioma === 'en' ? 'bg-neutral-900 text-lime-300 font-bold' : 'bg-white'}`}>🇺🇸 English</button>
                  </div>
                </div>
                <button onClick={crear} disabled={busy || detectados.length === 0} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-lime-300 disabled:opacity-50">{busy ? 'Creando…' : `Crear y preparar ${detectados.length || ''} link${detectados.length === 1 ? '' : 's'}`}</button>
                {msg && <span className="text-sm text-neutral-600">{msg}</span>}
              </div>
            </div>

            {!rows ? <p className="text-neutral-500">Cargando…</p> : rows.length === 0 ? <p className="text-neutral-500">Aún no hay prospectos. Pega una lista arriba.</p> : (
              <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-500">
                      <th className="px-3 py-2">Empresa / persona</th><th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Envío</th><th className="px-3 py-2">Señales</th><th className="px-3 py-2">Links</th><th className="px-3 py-2">Creada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const est = EST[r.estado] ?? EST.nuevo
                      const cvUrl = r.slug ? `${origin}/aplicaciones/p/${r.slug}` : ''
                      const rUrl = r.slug ? `${origin}/r/${r.slug}` : ''
                      const resp = r.estado === 'respondio'
                      return (
                        <tr key={r.id} className={`border-b border-neutral-100 align-top ${resp ? 'bg-emerald-50' : ''}`}>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2"><b>{r.empresa}</b><span className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[9px] uppercase text-neutral-500">{r.idioma}</span></div>
                            <div className="text-xs text-neutral-500">{r.persona || '—'}{r.puesto ? ` · ${r.puesto}` : ''}</div>
                            {r.email && <div className="font-mono text-[11px] text-neutral-400">{r.email}</div>}
                            {r.gancho && (
                              <div className="mt-1 flex items-start gap-1.5 text-[11px]">
                                <span className="shrink-0 rounded px-1 py-0.5 font-mono uppercase" style={{ background: confColor(r.confianza).bg, color: confColor(r.confianza).c }}>{r.confianza || '?'}</span>
                                <span className="italic text-neutral-600">“{r.gancho}”{r.afirma_cifra ? <span className="not-italic text-[#9B3412]"> · afirma cifra</span> : null}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5"><span className="rounded px-1.5 py-0.5 font-mono text-[11px]" style={{ background: est.bg, color: est.c }}>{est.t}</span></td>
                          <td className="px-3 py-2.5">
                            {r.toque > 0 && <div className="mb-1 font-mono text-[11px] text-neutral-700">✓ enviado {r.enviado_en ? new Date(r.enviado_en).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' }) : ''}{r.toque > 1 ? ` · toque ${r.toque}` : ''}</div>}
                            <div className="flex flex-col items-start gap-1">
                              <button onClick={() => verPreview(r.id)} disabled={cargandoPrev === r.id} className="text-[11px] text-blue-700 underline disabled:opacity-50">{cargandoPrev === r.id ? '…' : '👁 Preview'}</button>
                              {r.estado === 'nuevo' ? (
                                <button onClick={() => investigar(r.id)} disabled={invId.has(r.id)} className="rounded-lg bg-neutral-900 px-2.5 py-1 text-[11px] font-bold text-lime-300 disabled:opacity-50">{invId.has(r.id) ? '🔎…' : '🔍 Investigar'}</button>
                              ) : r.estado === 'sin_gancho' ? (
                                <div className="flex flex-col items-start gap-1">
                                  <button onClick={() => patchPros(r.id, { estado: 'listo' })} className="rounded bg-neutral-900 px-2 py-0.5 text-[11px] font-bold text-lime-300">✓ Aprobar gancho</button>
                                  <button onClick={() => patchPros(r.id, { gancho: '', estado: 'listo' })} className="rounded border border-neutral-300 px-2 py-0.5 text-[11px]">Enviar sin gancho</button>
                                  <button onClick={() => investigar(r.id)} disabled={invId.has(r.id)} className="text-[10px] text-neutral-500 underline">{invId.has(r.id) ? '…' : 'reinvestigar'}</button>
                                </div>
                              ) : gmail.conectado && r.email && r.estado === 'listo' ? (
                                <button onClick={() => enviar(r.id)} disabled={enviando === r.id} title="Opcional: se mandará solo" className="rounded-lg border border-neutral-300 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 disabled:opacity-50">{enviando === r.id ? '…' : '✉️ Enviar ahora'}</button>
                              ) : r.estado === 'en_secuencia' ? <span className="text-[11px] text-neutral-400">en secuencia</span> : null}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                              <span title="clics en /r" className={r.clicks ? 'font-bold text-neutral-900' : 'text-neutral-400'}>🔗 {r.clicks}</span>
                              <span title="abrió el CV" className={r.abierto ? 'font-bold text-neutral-900' : 'text-neutral-400'}>👁 {r.abierto}</span>
                              <span title="tiempo en CV" className={r.seconds ? 'font-bold text-neutral-900' : 'text-neutral-400'}>⏱ {dur(r.seconds)}</span>
                              <span title="descargó CV" className={r.cv ? 'font-bold text-neutral-900' : 'text-neutral-400'}>📄 {r.cv}</span>
                              <span title="chat" className={r.chat ? 'font-bold text-neutral-900' : 'text-neutral-400'}>💬 {r.chat}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            {r.slug ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5"><a href={cvUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 underline">CV</a><button onClick={() => copiar(cvUrl)} className="rounded border border-neutral-300 px-1.5 py-0.5 text-[10px]">copiar</button></div>
                                <div className="flex items-center gap-1.5"><a href={rUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">/r (rastreado)</a><button onClick={() => copiar(rUrl)} className="rounded border border-neutral-300 px-1.5 py-0.5 text-[10px]">copiar</button></div>
                              </div>
                            ) : <span className="text-xs text-neutral-400">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-neutral-500">{fecha(r.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {preview && (
              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-4" onClick={() => setPreview(null)}>
                <div className="mt-6 w-full max-w-[640px] rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="mb-2 flex items-center justify-between">
                    <b style={{ fontFamily: "'Syne',sans-serif" }}>Preview del correo</b>
                    <button onClick={() => setPreview(null)} className="text-neutral-400">✕</button>
                  </div>
                  {preview.cuando ? (
                    <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">📅 Se enviará aprox. <b>{fechaHora(preview.cuando)}</b> (CDMX){preview.detalleCola ? ` · ${preview.detalleCola}` : ''}. Se reparte a lo largo del día.</div>
                  ) : preview.detalleCola ? (
                    <div className="mb-3 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">{preview.detalleCola}</div>
                  ) : (
                    <div className="mb-3 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">Ya está en secuencia (correo 1 enviado).</div>
                  )}
                  {preview.plan.length > 0 && (
                    <div className="mb-3 rounded-lg border border-neutral-200 p-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Qué va a pasar</div>
                      <div className="flex flex-col gap-2">
                        {preview.plan.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${s.hecho ? 'bg-emerald-600 text-white' : 'border border-neutral-300 text-neutral-400'}`}>{s.hecho ? '✓' : i + 1}</span>
                            <span className={s.hecho ? 'text-neutral-500 line-through' : 'font-medium'}>{s.paso}</span>
                            <span className="ml-auto font-mono text-[11px] text-neutral-500">{fechaHora(s.fecha)}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-neutral-400">Si responde en cualquier momento, la secuencia se detiene sola.</p>
                    </div>
                  )}
                  <div className="rounded-xl border border-neutral-200">
                    <div className="border-b border-neutral-100 px-3 py-2 text-xs text-neutral-500"><div><b>De:</b> {preview.from}</div><div><b>Para:</b> {preview.to || '—'}</div><div><b>Asunto:</b> {preview.asunto}</div></div>
                    <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap px-3 py-3 text-[13px] leading-relaxed" style={{ fontFamily: "'DM Sans',sans-serif" }}>{preview.cuerpo}</pre>
                  </div>
                  {gmail.conectado && preview.to && (preview.estado === 'listo' || preview.estado === 'nuevo') && (
                    <button onClick={() => { enviar(preview.id); setPreview(null) }} className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-bold text-lime-300">✉️ Enviar ahora</button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useCallback, useState } from 'react'

interface Row {
  id: string; empresa: string; persona: string | null; puesto: string | null; email: string | null
  sector: string | null; idioma: string; slug: string | null; estado: string; created_at: string
  clicks: number; abierto: number; seconds: number; cv: number; chat: number; last: string | null
}
type Fila = { empresa: string; persona: string; puesto: string; email: string; sitio_web: string; linkedin: string }

function dur(s: number) { return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s` }
function fecha(iso: string | null) { return iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '—' }
const EST: Record<string, { t: string; bg: string; c: string }> = {
  nuevo: { t: 'Nuevo', bg: '#EEE', c: '#666' }, listo: { t: 'Listo', bg: '#E4ECFF', c: '#2456C9' },
  en_secuencia: { t: 'En secuencia', bg: '#FFF3D6', c: '#9A6A00' }, respondio: { t: '✓ Respondió', bg: '#D9F2E4', c: '#1E8E5A' },
  reboto: { t: 'Rebotó', bg: '#F3D9D0', c: '#9B3412' }, descartado: { t: 'Descartado', bg: '#EEE', c: '#999' }, cerrado: { t: 'Cerrado', bg: '#EEE', c: '#999' },
}

// Parsea el pegado: una fila por línea, columnas separadas por TAB (hoja de cálculo) o coma.
// Orden: empresa, persona, puesto, email, sitio_web, linkedin
function parsear(texto: string): Fila[] {
  const out: Fila[] = []
  for (const linea of texto.split('\n')) {
    const l = linea.trim(); if (!l) continue
    const cols = (l.includes('\t') ? l.split('\t') : l.split(',')).map((c) => c.trim())
    if (!cols[0]) continue
    out.push({ empresa: cols[0] || '', persona: cols[1] || '', puesto: cols[2] || '', email: cols[3] || '', sitio_web: cols[4] || '', linkedin: cols[5] || '' })
  }
  return out
}

export function Outbound() {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [texto, setTexto] = useState(''); const [idioma, setIdioma] = useState<'es' | 'en'>('es')
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const hdr = { 'x-admin-password': pw }
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const load = useCallback(async () => {
    setErr('')
    try {
      const r = await fetch('/api/outbound/prospectos', { headers: hdr })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setRows(j.prospectos as Row[]); setAuthed(true)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw]) // eslint-disable-line react-hooks/exhaustive-deps

  const crear = async () => {
    const filas = parsear(texto)
    if (!filas.length) { setMsg('Pega al menos una fila (empresa, persona, puesto, email…).'); return }
    setBusy(true); setMsg(`Creando ${filas.length} prospecto(s) y sus páginas de CV…`)
    try {
      const r = await fetch('/api/outbound/prospectos', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ idioma, prospectos: filas }) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setMsg(`✓ ${j.creados} creados${j.saltados?.length ? ` · ${j.saltados.length} duplicados` : ''}${j.errores?.length ? ` · ${j.errores.length} con error` : ''}`)
      setTexto(''); load()
    } catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setBusy(false) }
  }

  const copiar = (s: string) => { navigator.clipboard?.writeText(s) }
  const inp = 'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900'

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne',sans-serif" }}>Outbound</h1>
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Prospectos · búsqueda de trabajo</span>
        </div>

        {!authed && (
          <div className="flex max-w-md flex-wrap gap-2">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Contraseña"
              className="min-w-[200px] flex-1 rounded-lg border border-neutral-900 bg-white px-3.5 py-2.5 text-sm outline-none" />
            <button onClick={load} disabled={!pw} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-lime-300">Entrar</button>
          </div>
        )}
        {err && <p className="mt-2 text-sm text-red-700">⚠ {err}</p>}

        {authed && (
          <>
            <div className="mb-5 rounded-2xl border-2 border-neutral-900 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <b className="text-sm">Pegar prospectos</b>
                <span className="text-xs text-neutral-500">una fila por línea · columnas: empresa, persona, puesto, email, sitio, linkedin (tab o coma)</span>
              </div>
              <textarea className={`${inp} font-mono text-[12.5px]`} rows={6} placeholder={'Anthropic\tDario Amodei\tLatam Lead\tdario@anthropic.com\tanthropic.com\nVambe\tNicolas Camhi\tCEO\tnicolas@vambe.ai'} value={texto} onChange={(e) => setTexto(e.target.value)} />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-500">CV default:</span>
                  <div className="inline-flex overflow-hidden rounded-lg border border-neutral-300">
                    <button onClick={() => setIdioma('es')} className={`px-3 py-1.5 ${idioma === 'es' ? 'bg-neutral-900 text-lime-300 font-bold' : 'bg-white'}`}>🇲🇽 Español</button>
                    <button onClick={() => setIdioma('en')} className={`px-3 py-1.5 ${idioma === 'en' ? 'bg-neutral-900 text-lime-300 font-bold' : 'bg-white'}`}>🇺🇸 English</button>
                  </div>
                </div>
                <button onClick={crear} disabled={busy} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-lime-300 disabled:opacity-50">{busy ? 'Creando…' : 'Crear y preparar links'}</button>
                {msg && <span className="text-sm text-neutral-600">{msg}</span>}
              </div>
            </div>

            {!rows ? <p className="text-neutral-500">Cargando…</p> : rows.length === 0 ? <p className="text-neutral-500">Aún no hay prospectos. Pega una lista arriba.</p> : (
              <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-500">
                      <th className="px-3 py-2">Empresa / persona</th><th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Señales</th><th className="px-3 py-2">Links</th><th className="px-3 py-2">Creada</th>
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
                          </td>
                          <td className="px-3 py-2.5"><span className="rounded px-1.5 py-0.5 font-mono text-[11px]" style={{ background: est.bg, color: est.c }}>{est.t}</span></td>
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
          </>
        )}
      </div>
    </div>
  )
}

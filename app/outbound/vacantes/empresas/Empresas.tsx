'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface Empresa {
  id: string; nombre: string; ats: string; token: string; activa: boolean; bloqueada: boolean
  origen: string; descubierta_en: string; vacantes_relevantes: number; ultima_revision: string | null
}

const ORIGEN: Record<string, string> = { agregador: 'link', sondeo: 'sondeo', busqueda: 'búsqueda', manual: 'manual', auto: 'auto', semilla: 'semilla' }

export function Empresas() {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [rows, setRows] = useState<Empresa[] | null>(null); const [url, setUrl] = useState(''); const [aviso, setAviso] = useState('')
  const headers = useMemo(() => ({ 'x-admin-password': pw, 'Content-Type': 'application/json' }), [pw])

  const load = useCallback(async (p?: string) => {
    const pass = p ?? pw; setErr('')
    try {
      const r = await fetch('/api/empresas-objetivo', { headers: { 'x-admin-password': pass } })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setRows(j.empresas as Empresa[]); setAuthed(true)
      try { localStorage.setItem('outbound_auth', JSON.stringify({ pw: pass, exp: Date.now() + 30 * 86400000 })) } catch { /* noop */ }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw])

  useEffect(() => { try { const raw = localStorage.getItem('outbound_auth'); if (raw) { const s = JSON.parse(raw); if (s?.pw && s.exp > Date.now()) { setPw(s.pw); load(s.pw) } } } catch { /* noop */ } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (id: string, cambio: Partial<Empresa>) => {
    setRows((rs) => rs?.map((e) => (e.id === id ? { ...e, ...cambio } : e)) ?? rs)
    await fetch('/api/empresas-objetivo', { method: 'PATCH', headers, body: JSON.stringify({ id, ...cambio }) })
  }
  const agregar = async () => {
    if (!url.trim()) return
    const r = await fetch('/api/empresas-objetivo', { method: 'POST', headers, body: JSON.stringify({ url }) })
    const j = await r.json(); setAviso(j.ok ? `agregada (${j.ats})` : (j.error || 'Error')); if (j.ok) { setUrl(''); await load() }
  }

  const semana = new Date(Date.now() - 7 * 86400000)
  const enSeguimiento = (rows || []).filter((e) => e.activa && !e.bloqueada).length
  const descSemana = (rows || []).filter((e) => new Date(e.descubierta_en) >= semana).length

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div className="mx-auto w-full max-w-[860px] px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne',sans-serif" }}>🏢 Empresas</h1>
          <Link href="/outbound/vacantes" className="text-sm text-neutral-500 underline">← vacantes</Link>
        </div>

        {!authed && (
          <div className="flex max-w-md flex-wrap gap-2">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Contraseña" className="min-w-[200px] flex-1 rounded-lg border border-neutral-900 bg-white px-3.5 py-2.5 text-sm outline-none" />
            <button onClick={() => load()} disabled={!pw} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-lime-300">Entrar</button>
          </div>
        )}
        {err && <p className="mt-2 text-sm text-red-700">⚠ {err}</p>}

        {authed && !rows && <p className="text-neutral-500">Cargando…</p>}
        {authed && rows && (
          <>
            <p className="mb-4 text-sm text-neutral-600"><b>{enSeguimiento}</b> empresas en seguimiento · <b>{descSemana}</b> descubiertas esta semana. Se descubren solas con cada radar.</p>

            <details className="mb-4 rounded-xl border border-neutral-300 bg-white p-3 text-sm">
              <summary className="cursor-pointer text-xs font-bold text-neutral-500">Agregar a mano (opcional)</summary>
              <div className="mt-2 flex flex-wrap gap-2">
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL de Greenhouse / Lever / Ashby" className="min-w-[240px] flex-1 rounded-lg border border-neutral-900 px-3 py-2 text-sm" />
                <button onClick={agregar} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-bold text-lime-300">Agregar</button>
                {aviso && <span className="self-center text-xs text-neutral-600">{aviso}</span>}
              </div>
            </details>

            <div className="overflow-hidden rounded-xl border-2 border-neutral-900 bg-white">
              {rows.length === 0 ? <p className="px-3 py-4 text-sm text-neutral-500">Aún no hay empresas. Dale a “Buscar ahora” en Vacantes para que el descubrimiento empiece a poblarla.</p> : rows.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-200 px-3 py-2.5 text-sm first:border-t-0">
                  <span className="min-w-[160px] flex-1 font-semibold">{e.nombre}</span>
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800">{e.ats}</span>
                  <span className="w-16 text-xs text-neutral-500">{ORIGEN[e.origen] || e.origen}</span>
                  <span className="w-10 text-right font-mono text-xs font-bold">{e.vacantes_relevantes}</span>
                  <span className="w-20 text-xs font-semibold" style={{ color: e.bloqueada ? '#b91c1c' : e.activa ? '#1E8E5A' : '#9a948a' }}>{e.bloqueada ? 'bloqueada' : e.activa ? 'activa' : 'pausada'}</span>
                  {!e.bloqueada && <button onClick={() => patch(e.id, { activa: !e.activa })} className="rounded border border-neutral-300 px-2 py-0.5 text-[11px]">{e.activa ? 'pausar' : 'activar'}</button>}
                  <button onClick={() => patch(e.id, { bloqueada: !e.bloqueada })} className="rounded border border-neutral-300 px-2 py-0.5 text-[11px]">{e.bloqueada ? 'desbloquear' : 'bloquear'}</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface Row { id: string; empresa: string; persona: string | null; estado: string; proximo: string | null; proximo_tipo: string | null }

// clave del día en CDMX (YYYY-MM-DD) para agrupar
function diaCDMX(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 6 * 3600000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}
function etiquetaDia(clave: string): string {
  const [y, m, d] = clave.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}
function semanaDe(clave: string): string {
  const [y, m, d] = clave.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dow = (dt.getUTCDay() + 6) % 7 // lunes=0
  const lunes = new Date(dt.getTime() - dow * 86400000)
  return `${lunes.getUTCFullYear()}-${String(lunes.getUTCMonth() + 1).padStart(2, '0')}-${String(lunes.getUTCDate()).padStart(2, '0')}`
}
function horaCDMX(iso: string): string { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' }) }
const tipoDe = (t: string | null): 1 | 2 | 3 => t === 'Recordatorio 2' ? 2 : t === 'Recordatorio 3' ? 3 : 1

export function Agenda() {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null); const [tope, setTope] = useState(5)

  const load = useCallback(async (p?: string) => {
    const pass = p ?? pw; setErr('')
    try {
      const r = await fetch('/api/outbound/prospectos', { headers: { 'x-admin-password': pass } })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setRows(j.prospectos as Row[]); setTope(j.tope || 5); setAuthed(true)
      try { localStorage.setItem('outbound_auth', JSON.stringify({ pw: pass, exp: Date.now() + 30 * 86400000 })) } catch { /* noop */ }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { try { const raw = localStorage.getItem('outbound_auth'); if (raw) { const s = JSON.parse(raw); if (s?.pw && s.exp > Date.now()) { setPw(s.pw); load(s.pw) } } } catch { /* noop */ } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const items = (rows || []).filter((r) => r.proximo).sort((a, b) => (a.proximo! < b.proximo! ? -1 : 1))
  // agrupa por día
  const dias = new Map<string, Row[]>()
  for (const r of items) { const k = diaCDMX(r.proximo!); if (!dias.has(k)) dias.set(k, []); dias.get(k)!.push(r) }
  // resumen por semana
  const semanas = new Map<string, { c1: number; c2: number; c3: number; diasHabiles: Set<string> }>()
  for (const [k, arr] of dias) { const s = semanaDe(k); if (!semanas.has(s)) semanas.set(s, { c1: 0, c2: 0, c3: 0, diasHabiles: new Set() }); const w = semanas.get(s)!; w.diasHabiles.add(k); for (const r of arr) { const t = tipoDe(r.proximo_tipo); if (t === 1) w.c1++; else if (t === 2) w.c2++; else w.c3++ } }

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div className="mx-auto w-full max-w-[860px] px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne',sans-serif" }}>📅 Agenda de envíos</h1>
          <Link href="/outbound" className="text-sm text-neutral-500 underline">← prospectos</Link>
        </div>

        {!authed && (
          <div className="flex max-w-md flex-wrap gap-2">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Contraseña" className="min-w-[200px] flex-1 rounded-lg border border-neutral-900 bg-white px-3.5 py-2.5 text-sm outline-none" />
            <button onClick={() => load()} disabled={!pw} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-lime-300">Entrar</button>
          </div>
        )}
        {err && <p className="mt-2 text-sm text-red-700">⚠ {err}</p>}

        {authed && (!rows ? <p className="text-neutral-500">Cargando…</p> : items.length === 0 ? <p className="text-neutral-500">No hay envíos programados todavía. Sube prospectos en <Link href="/outbound" className="underline">Prospectos</Link>.</p> : (
          <>
            {/* Resumen por semana */}
            <div className="mb-5 flex flex-col gap-2">
              {Array.from(semanas.entries()).map(([s, w]) => {
                const cupoSemana = tope * 5 // 5 días hábiles
                const pct = Math.min(100, Math.round((w.c1 / cupoSemana) * 100))
                const [y, m, d] = s.split('-').map(Number); const lunes = new Date(Date.UTC(y, m - 1, d, 12))
                const label = `Semana del ${lunes.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', timeZone: 'UTC' })}`
                return (
                  <div key={s} className="rounded-xl border-2 border-neutral-900 bg-white p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <b style={{ fontFamily: "'Syne',sans-serif" }}>{label}</b>
                      <span className="text-xs text-neutral-500">{w.c1 >= cupoSemana ? '✅ semana llena' : `${cupoSemana - w.c1} lugares libres`}</span>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-4 text-sm">
                      <span><b className="text-lg">{w.c1}</b> primeros correos <span className="text-neutral-400">/ {cupoSemana} cupo</span></span>
                      <span><b className="text-lg">{w.c2}</b> recordatorio 2</span>
                      <span><b className="text-lg">{w.c3}</b> recordatorio 3</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded bg-neutral-100"><div className="h-full rounded" style={{ width: `${pct}%`, background: pct >= 100 ? '#1E8E5A' : '#2456C9' }} /></div>
                  </div>
                )
              })}
            </div>

            {/* Detalle por día */}
            <div className="flex flex-col gap-3">
              {Array.from(dias.entries()).map(([k, arr]) => {
                const c1 = arr.filter((r) => tipoDe(r.proximo_tipo) === 1).length
                return (
                  <div key={k} className="rounded-xl border border-neutral-900 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <b className="text-[13px] capitalize">{etiquetaDia(k)}</b>
                      <span className="font-mono text-[11px] text-neutral-500">{c1}/{tope} primeros{c1 >= tope ? ' · lleno' : ''}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {arr.map((r) => { const t = tipoDe(r.proximo_tipo); return (
                        <div key={r.id + (r.proximo || '')} className="flex items-center gap-2 text-xs">
                          <span className="w-14 shrink-0 font-mono text-neutral-500">{horaCDMX(r.proximo!)}</span>
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px]" style={{ background: t === 1 ? '#E4ECFF' : '#FFF3D6', color: t === 1 ? '#2456C9' : '#9A6A00' }}>{t === 1 ? 'Correo 1' : t === 2 ? 'Record. 2' : 'Record. 3'}</span>
                          <span className="truncate"><b>{r.empresa}</b> · {r.persona || '—'}</span>
                        </div>
                      ) })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface Resp { id: string; atajo: string; titulo: string; texto: string; orden: number }

export function Respuestas() {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [rows, setRows] = useState<Resp[] | null>(null); const [copiado, setCopiado] = useState('')
  const headers = useMemo(() => ({ 'x-admin-password': pw, 'Content-Type': 'application/json' }), [pw])

  const load = useCallback(async (p?: string) => {
    const pass = p ?? pw; setErr('')
    try {
      const r = await fetch('/api/respuestas-kit', { headers: { 'x-admin-password': pass } })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setRows(j.respuestas as Resp[]); setAuthed(true)
      try { localStorage.setItem('outbound_auth', JSON.stringify({ pw: pass, exp: Date.now() + 30 * 86400000 })) } catch { /* noop */ }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw])

  useEffect(() => { try { const raw = localStorage.getItem('outbound_auth'); if (raw) { const s = JSON.parse(raw); if (s?.pw && s.exp > Date.now()) { setPw(s.pw); load(s.pw) } } } catch { /* noop */ } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = (id: string, texto: string) => { fetch('/api/respuestas-kit', { method: 'PATCH', headers, body: JSON.stringify({ id, texto }) }) }
  const copiar = async (texto: string, tag: string) => { try { await navigator.clipboard.writeText(texto); setCopiado(tag); setTimeout(() => setCopiado(''), 1500) } catch { /* noop */ } }

  const bajar = (nombre: string, contenido: string, tipo: string) => {
    const blob = new Blob([contenido], { type: tipo }); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = nombre; a.click(); URL.revokeObjectURL(url)
  }
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const exportarPlist = () => {
    const items = (rows || []).map((r) => `  <dict>\n    <key>phrase</key><string>${esc(r.texto)}</string>\n    <key>shortcut</key><string>${esc(r.atajo)}</string>\n  </dict>`).join('\n')
    const plist = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<array>\n${items}\n</array>\n</plist>`
    bajar('atajos-macos.plist', plist, 'application/xml')
  }
  const exportarCsv = () => {
    const csv = 'atajo,titulo,texto\n' + (rows || []).map((r) => [r.atajo, r.titulo, r.texto].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    bajar('respuestas.csv', csv, 'text/csv')
  }

  const inp = 'w-full rounded-lg border border-neutral-900 bg-white px-3 py-2 text-sm outline-none'

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div className="mx-auto w-full max-w-[720px] px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne',sans-serif" }}>🗂️ Respuestas</h1>
          <Link href="/outbound/vacantes" className="text-sm text-neutral-500 underline">← vacantes</Link>
        </div>

        {!authed && (
          <div className="flex max-w-md flex-wrap gap-2">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Contraseña" className={`min-w-[200px] flex-1 ${inp}`} />
            <button onClick={() => load()} disabled={!pw} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-lime-300">Entrar</button>
          </div>
        )}
        {err && <p className="mt-2 text-sm text-red-700">⚠ {err}</p>}

        {authed && !rows && <p className="text-neutral-500">Cargando…</p>}

        {authed && rows && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <button onClick={exportarPlist} className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 text-sm font-bold">⬇ Atajos macOS (.plist)</button>
              <button onClick={exportarCsv} className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 text-sm font-bold">⬇ CSV</button>
            </div>
            <p className="mb-4 text-xs text-neutral-500">Edita cualquier texto (se guarda solo al salir del campo). El atajo en <code>código</code> es para los reemplazos de texto de macOS/iOS.</p>

            <div className="flex flex-col gap-2">
              {rows.map((r) => (
                <div key={r.id} className="rounded-xl border border-neutral-900 bg-white p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-neutral-700">{r.titulo} <code className="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500">{r.atajo}</code></span>
                    <button onClick={() => copiar(r.texto, r.id)} className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-lime-300">{copiado === r.id ? '✓ copiado' : 'Copiar'}</button>
                  </div>
                  <textarea defaultValue={r.texto} onBlur={(e) => guardar(r.id, e.target.value)} className={`${inp} min-h-[60px]`} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

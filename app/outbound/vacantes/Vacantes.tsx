'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface Vacante {
  id: string; titulo: string; empresa: string | null; ubicacion: string | null; sueldo: string | null
  link: string | null; fuente: string | null; puntaje: number; ingles: boolean; estado: string
  fecha_publicada: string | null; creada_en: string; ats: string | null; preguntas: unknown | null
}

const ESTADOS = ['nueva', 'interesa', 'preparada', 'aplicada', 'contacto_enviado', 'entrevista', 'descartada']
const ETIQUETA: Record<string, string> = {
  nueva: 'Nueva', interesa: 'Me interesa', preparada: 'Preparada', aplicada: 'Aplicada',
  contacto_enviado: 'Contacto enviado', entrevista: 'Entrevista', descartada: 'Descartada',
}
const COLOR: Record<string, string> = {
  nueva: '#2456C9', interesa: '#9A6A00', preparada: '#7A3FB8', aplicada: '#1E8E5A',
  contacto_enviado: '#1E8E5A', entrevista: '#B4451A', descartada: '#9a948a',
}

export function Vacantes() {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [rows, setRows] = useState<Vacante[] | null>(null)
  const [buscando, setBuscando] = useState(false); const [aviso, setAviso] = useState('')
  const [fEstado, setFEstado] = useState(''); const [fMin, setFMin] = useState(0); const [fTexto, setFTexto] = useState(''); const [ocultarIngles, setOcultarIngles] = useState(false); const [soloObjetivo, setSoloObjetivo] = useState(false)
  const [abrirForm, setAbrirForm] = useState(false)
  const [nv, setNv] = useState({ titulo: '', empresa: '', ubicacion: '', sueldo: '', link: '', descripcion: '' })

  const headers = useMemo(() => ({ 'x-admin-password': pw, 'Content-Type': 'application/json' }), [pw])

  const load = useCallback(async (p?: string) => {
    const pass = p ?? pw; setErr('')
    try {
      const r = await fetch('/api/vacantes', { headers: { 'x-admin-password': pass } })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setRows(j.vacantes as Vacante[]); setAuthed(true)
      try { localStorage.setItem('outbound_auth', JSON.stringify({ pw: pass, exp: Date.now() + 30 * 86400000 })) } catch { /* noop */ }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw])

  useEffect(() => { try { const raw = localStorage.getItem('outbound_auth'); if (raw) { const s = JSON.parse(raw); if (s?.pw && s.exp > Date.now()) { setPw(s.pw); load(s.pw) } } } catch { /* noop */ } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const buscar = async () => {
    setBuscando(true); setAviso('')
    try {
      const r = await fetch('/api/vacantes/radar', { method: 'POST', headers, body: JSON.stringify({ minPuntaje: 3 }) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setAviso(`${j.nuevas} nuevas (de ${j.total})${j.ejemplo ? ' · modo ejemplo (faltan llaves Jooble/Adzuna)' : ''}`)
      await load()
    } catch (e) { setAviso(e instanceof Error ? e.message : 'Error') } finally { setBuscando(false) }
  }

  const agregar = async () => {
    if (!nv.titulo.trim()) return
    const r = await fetch('/api/vacantes', { method: 'POST', headers, body: JSON.stringify(nv) })
    const j = await r.json()
    if (j.ok) { setNv({ titulo: '', empresa: '', ubicacion: '', sueldo: '', link: '', descripcion: '' }); setAbrirForm(false); setAviso(j.duplicada ? 'Ya estaba en la cola' : 'Agregada a la cola'); await load() }
    else setAviso(j.error || 'Error')
  }

  const cambiarEstado = async (id: string, estado: string) => {
    setRows((rs) => rs?.map((v) => (v.id === id ? { ...v, estado } : v)) ?? rs) // optimista
    await fetch(`/api/vacantes/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ estado }) })
  }

  const lista = (rows || []).filter((v) => {
    if (fEstado && v.estado !== fEstado) return false
    if ((v.puntaje || 0) < fMin) return false
    if (ocultarIngles && v.ingles) return false
    if (soloObjetivo && !v.ats) return false
    if (fTexto) { const t = `${v.titulo} ${v.empresa || ''} ${v.ubicacion || ''}`.toLowerCase(); if (!t.includes(fTexto.toLowerCase())) return false }
    return true
  })
  const nuevas = lista.filter((v) => v.estado === 'nueva')
  const resto = lista.filter((v) => v.estado !== 'nueva')

  // contadores
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const semana = new Date(Date.now() - 7 * 86400000)
  const cNuevasHoy = (rows || []).filter((v) => v.estado === 'nueva' && new Date(v.creada_en) >= hoy).length
  const cPreparadas = (rows || []).filter((v) => v.estado === 'preparada').length
  const cAplicadas = (rows || []).filter((v) => ['aplicada', 'contacto_enviado', 'entrevista'].includes(v.estado) && new Date(v.creada_en) >= semana).length
  const cEntrevistas = (rows || []).filter((v) => v.estado === 'entrevista').length

  const inp = 'rounded-lg border border-neutral-900 bg-white px-3 py-2 text-sm outline-none'

  const Fila = (v: Vacante) => (
    <div key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-200 px-3 py-2.5 text-sm first:border-t-0">
      <Link href={`/outbound/vacantes/${v.id}`} className="min-w-[200px] flex-1 font-semibold hover:underline">{v.titulo}</Link>
      <span className="w-28 truncate text-neutral-600">{v.empresa || '—'}</span>
      <span className="w-28 truncate text-xs text-neutral-500">{v.ubicacion || '—'}</span>
      <span className="w-24 font-mono text-xs text-neutral-500">{v.sueldo || '—'}</span>
      {v.ingles && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">🇬🇧</span>}
      {v.ats && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800">{v.ats}</span>}
      {v.preguntas ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">preguntas ✓</span> : null}
      <span className="w-10 text-right font-mono text-xs font-bold" style={{ color: v.puntaje >= 6 ? '#1E8E5A' : v.puntaje >= 4 ? '#9A6A00' : '#9a948a' }}>{v.puntaje}pts</span>
      <select value={v.estado} onChange={(e) => cambiarEstado(v.id, e.target.value)} className="rounded border border-neutral-300 bg-white px-1.5 py-1 text-xs font-semibold" style={{ color: COLOR[v.estado] }}>
        {ESTADOS.map((s) => <option key={s} value={s}>{ETIQUETA[s]}</option>)}
      </select>
      <Link href={`/outbound/vacantes/${v.id}`} className="rounded bg-neutral-900 px-2.5 py-1 text-xs font-bold text-lime-300">Aplicar →</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div className="mx-auto w-full max-w-[980px] px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne',sans-serif" }}>💼 Vacantes</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/outbound/vacantes/empresas" className="text-neutral-500 underline">empresas</Link>
            <Link href="/outbound/vacantes/respuestas" className="text-neutral-500 underline">respuestas</Link>
            <Link href="/outbound" className="text-neutral-500 underline">← outbound</Link>
          </div>
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
            {/* Contadores */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[['Nuevas hoy', cNuevasHoy], ['Preparadas', cPreparadas], ['Aplicadas (7d)', cAplicadas], ['Entrevistas', cEntrevistas]].map(([l, n]) => (
                <div key={l} className="rounded-xl border-2 border-neutral-900 bg-white p-3">
                  <div className="font-mono text-2xl font-bold">{n}</div>
                  <div className="text-xs text-neutral-500">{l}</div>
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button onClick={buscar} disabled={buscando} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-bold text-lime-300 disabled:opacity-50">{buscando ? 'Buscando…' : '🔎 Buscar ahora'}</button>
              <button onClick={() => setAbrirForm((x) => !x)} className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 text-sm font-bold">＋ Agregar vacante</button>
              {aviso && <span className="text-xs text-neutral-600">{aviso}</span>}
            </div>

            {/* Form manual */}
            {abrirForm && (
              <div className="mb-4 rounded-xl border-2 border-neutral-900 bg-white p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input value={nv.titulo} onChange={(e) => setNv({ ...nv, titulo: e.target.value })} placeholder="Puesto *" className={inp} />
                  <input value={nv.empresa} onChange={(e) => setNv({ ...nv, empresa: e.target.value })} placeholder="Empresa" className={inp} />
                  <input value={nv.ubicacion} onChange={(e) => setNv({ ...nv, ubicacion: e.target.value })} placeholder="Ubicación" className={inp} />
                  <input value={nv.sueldo} onChange={(e) => setNv({ ...nv, sueldo: e.target.value })} placeholder="Sueldo" className={inp} />
                  <input value={nv.link} onChange={(e) => setNv({ ...nv, link: e.target.value })} placeholder="Link de la vacante" className={`sm:col-span-2 ${inp}`} />
                  <textarea value={nv.descripcion} onChange={(e) => setNv({ ...nv, descripcion: e.target.value })} placeholder="Descripción (pega el texto de la vacante — sirve para preparar con IA)" className={`sm:col-span-2 ${inp} min-h-[80px]`} />
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={agregar} disabled={!nv.titulo.trim()} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-bold text-lime-300 disabled:opacity-50">Meter a la cola</button>
                  <button onClick={() => setAbrirForm(false)} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm">Cancelar</button>
                </div>
              </div>
            )}

            {/* Filtros */}
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <select value={fEstado} onChange={(e) => setFEstado(e.target.value)} className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-xs">
                <option value="">Todos los estados</option>
                {ESTADOS.map((s) => <option key={s} value={s}>{ETIQUETA[s]}</option>)}
              </select>
              <label className="flex items-center gap-1 text-xs text-neutral-600">min pts
                <input type="number" value={fMin} onChange={(e) => setFMin(Number(e.target.value) || 0)} className="w-14 rounded border border-neutral-300 px-1.5 py-1" />
              </label>
              <input value={fTexto} onChange={(e) => setFTexto(e.target.value)} placeholder="buscar…" className="rounded border border-neutral-300 px-2 py-1.5 text-xs" />
              <label className="flex items-center gap-1 text-xs text-neutral-600"><input type="checkbox" checked={ocultarIngles} onChange={(e) => setOcultarIngles(e.target.checked)} /> ocultar inglés</label>
              <label className="flex items-center gap-1 text-xs text-neutral-600"><input type="checkbox" checked={soloObjetivo} onChange={(e) => setSoloObjetivo(e.target.checked)} /> solo empresas objetivo</label>
            </div>

            {/* Cola de nuevas (digest en la página) */}
            {!fEstado && (
              <div className="mb-5 overflow-hidden rounded-xl border-2 border-neutral-900 bg-white">
                <div className="border-b border-neutral-200 bg-[#EEF3FF] px-3 py-2 text-sm font-bold" style={{ fontFamily: "'Syne',sans-serif" }}>📥 Por revisar ({nuevas.length})</div>
                {nuevas.length === 0 ? <p className="px-3 py-4 text-sm text-neutral-500">Nada nuevo. Dale a “Buscar ahora” o agrega una a mano.</p> : nuevas.map(Fila)}
              </div>
            )}

            {/* Resto / filtradas */}
            <div className="overflow-hidden rounded-xl border border-neutral-900 bg-white">
              <div className="border-b border-neutral-200 px-3 py-2 text-sm font-bold" style={{ fontFamily: "'Syne',sans-serif" }}>{fEstado ? ETIQUETA[fEstado] : 'En proceso'} ({(fEstado ? lista : resto).length})</div>
              {(fEstado ? lista : resto).length === 0 ? <p className="px-3 py-4 text-sm text-neutral-500">Sin vacantes aquí.</p> : (fEstado ? lista : resto).map(Fila)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

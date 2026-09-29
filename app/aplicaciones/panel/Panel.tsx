'use client'

import { useCallback, useEffect, useState } from 'react'

type Estado = 'borrador' | 'enviada' | 'abierta' | 'leida' | 'compartida' | 'respondida' | 'rechazada'
interface Row { id: string; empresa: string; puesto: string; persona: string | null; slug: string | null; estado: Estado; match_pct: number | null; created_at: string; opens: number; visitors: number; seconds: number; cv: number; last: string | null }
function hace(iso: string | null): string {
  if (!iso) return '—'
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'hace un momento'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  return `hace ${Math.floor(s / 86400)} d`
}
function dur(sec: number): string { return sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s` }
interface Requisito { texto: string; estado: 'cumple' | 'parcial' | 'no_cumple'; evidencia: string }
interface Analysis { requisitos: Requisito[]; match_pct: number; veredicto: string; argumentos: string[]; huecos: string[]; obligatoria: string | null }
interface App { id: string; slug: string | null; empresa: string; puesto: string; persona: string | null; correo: string | null; vacante: string; analysis: Analysis | null; posicionamiento: string | null; carta: string | null; cv_url: string | null; cv_nombre: string | null; video_url: string | null; estado: Estado }
interface Ev { tipo: string; visitor_id: string | null; data: Record<string, unknown> | null; device: string | null; created_at: string }

const EST_LABEL: Record<Estado, string> = { borrador: 'Borrador', enviada: 'Enviada', abierta: 'Abierta', leida: 'Leída', compartida: '🔥 Compartida', respondida: 'Respondida', rechazada: 'Rechazada' }
const estIcon = (e: Estado) => e === 'compartida' ? { bg: '#FFE1D6', c: '#B4451A' } : e === 'leida' ? { bg: '#D9F2E4', c: '#1E8E5A' } : e === 'abierta' ? { bg: '#E4ECFF', c: '#2456C9' } : { bg: '#EEE', c: '#666' }

export function Panel() {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const hdr = { 'x-admin-password': pw }

  const load = useCallback(async () => {
    setErr('')
    try {
      const r = await fetch('/api/aplicaciones/applications', { headers: hdr })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setRows(j.applications as Row[]); setAuthed(true)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw]) // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (n: number) => n >= 60 ? `${Math.floor(n / 60)}m ${n % 60}s` : `${n}s`

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div className="mx-auto w-full max-w-[900px] px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne',sans-serif" }}>Aplicaciones</h1>
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Panel privado</span>
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
            <div className="mb-4 flex items-center gap-2">
              <button onClick={() => setShowNew((v) => !v)} className="rounded-full border border-neutral-900 bg-lime-300 px-4 py-1.5 text-sm font-bold">{showNew ? '✕ Cerrar' : '+ Nueva aplicación'}</button>
              <span className="text-sm text-neutral-500">{rows ? `${rows.length} aplicaciones` : ''}</span>
            </div>

            {showNew && <NuevaApp hdr={hdr} onCreated={(id) => { setShowNew(false); load(); setOpenId(id) }} />}

            {rows && rows.length > 0 && (() => {
              const pub = rows.filter((r) => r.slug).length
              const abiertas = rows.filter((r) => r.opens > 0).length
              const compartidas = rows.filter((r) => r.visitors > 1).length
              const cv = rows.reduce((a, r) => a + r.cv, 0)
              const tasa = pub ? Math.round((abiertas / pub) * 100) : 0
              const tile = (n: string | number, l: string, hot?: boolean) => (
                <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
                  <div className="text-xl font-extrabold" style={{ fontFamily: "'Syne',sans-serif", color: hot ? '#B4451A' : undefined }}>{n}</div>
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500">{l}</div>
                </div>
              )
              return (
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {tile(pub, 'Enviadas')}
                  {tile(`${abiertas}`, 'Abiertas')}
                  {tile(`${tasa}%`, 'Tasa apertura')}
                  {tile(cv, 'CV descargados')}
                  {tile(compartidas, '🔥 Compartidas', compartidas > 0)}
                </div>
              )
            })()}

            {!rows ? <p className="text-neutral-500">Cargando…</p> : rows.length === 0 ? <p className="text-neutral-500">Aún no hay aplicaciones.</p> : (
              <div className="flex flex-col gap-2">
                {rows.map((r) => {
                  const temp = Math.min(100, r.opens * 20 + Math.floor(r.seconds / 6) + (r.visitors > 1 ? 40 : 0))
                  const ic = estIcon(r.estado)
                  return (
                    <div key={r.id} className="overflow-hidden rounded-xl border border-neutral-900 bg-white">
                      <button onClick={() => setOpenId(openId === r.id ? null : r.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <b className="text-[15px]">{r.empresa}</b>
                            <span className="text-sm text-neutral-500">· {r.puesto}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                            <span className="rounded px-1.5 py-0.5 font-mono" style={{ background: ic.bg, color: ic.c }}>{EST_LABEL[r.estado]}</span>
                            <span>{r.opens} aperturas · {r.visitors} visitantes · {fmt(r.seconds)}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-neutral-100"><div className="h-full rounded" style={{ width: `${temp}%`, background: temp > 60 ? '#B4451A' : temp > 25 ? '#E8A317' : '#B9BAB0' }} /></div>
                        </div>
                        {r.match_pct != null && <span className="font-mono text-sm font-bold" style={{ color: r.match_pct >= 70 ? '#1E8E5A' : r.match_pct >= 45 ? '#E8A317' : '#B4451A' }}>{r.match_pct}%</span>}
                      </button>
                      {openId === r.id && <Detalle id={r.id} hdr={hdr} onChange={load} />}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function NuevaApp({ hdr, onCreated }: { hdr: Record<string, string>; onCreated: (id: string) => void }) {
  const [f, setF] = useState({ empresa: '', puesto: '', persona: '', correo: '', vacante: '' })
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const set = (k: string, v: string) => setF({ ...f, [k]: v })
  const crear = async () => {
    if (!f.empresa.trim() || !f.puesto.trim() || !f.vacante.trim()) { setMsg('Faltan empresa, puesto o el texto de la vacante.'); return }
    setBusy(true); setMsg('Analizando la vacante contra tu perfil…')
    try {
      const r = await fetch('/api/aplicaciones/applications', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      onCreated(j.id)
    } catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setBusy(false) }
  }
  const inp = 'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900'
  return (
    <div className="mb-4 rounded-2xl border-2 border-neutral-900 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inp} placeholder="Empresa" value={f.empresa} onChange={(e) => set('empresa', e.target.value)} />
        <input className={inp} placeholder="Puesto" value={f.puesto} onChange={(e) => set('puesto', e.target.value)} />
        <input className={inp} placeholder="Persona destinataria (opcional)" value={f.persona} onChange={(e) => set('persona', e.target.value)} />
        <input className={inp} placeholder="Correo (opcional)" value={f.correo} onChange={(e) => set('correo', e.target.value)} />
      </div>
      <textarea className={`${inp} mt-3`} rows={6} placeholder="Pega aquí el texto completo de la vacante…" value={f.vacante} onChange={(e) => set('vacante', e.target.value)} />
      {msg && <p className="mt-2 text-sm text-neutral-600">{msg}</p>}
      <button onClick={crear} disabled={busy} className="mt-3 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-lime-300 disabled:opacity-50">{busy ? 'Analizando…' : 'Crear y analizar'}</button>
    </div>
  )
}

function Detalle({ id, hdr, onChange }: { id: string; hdr: Record<string, string>; onChange: () => void }) {
  const [app, setApp] = useState<App | null>(null); const [events, setEvents] = useState<Ev[]>([])
  const [busy, setBusy] = useState(''); const [msg, setMsg] = useState(''); const [showRaw, setShowRaw] = useState(false)
  const load = useCallback(async () => { const r = await fetch(`/api/aplicaciones/applications/${id}`, { headers: hdr }); const j = await r.json(); if (j.ok) { setApp(j.app); setEvents(j.events) } }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  const patch = async (body: Record<string, unknown>, tag: string) => {
    setBusy(tag); setMsg('')
    try { const r = await fetch(`/api/aplicaciones/applications/${id}`, { method: 'PATCH', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error'); setApp(j.app); onChange() }
    catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setBusy('') }
  }
  const genCarta = async () => {
    setBusy('carta'); setMsg('')
    try { const r = await fetch('/api/aplicaciones/letter', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error'); await load() }
    catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setBusy('') }
  }
  const subirCv = async (file: File | undefined) => {
    if (!file) return
    setBusy('cvup'); setMsg('')
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('id', id); fd.append('nombre', file.name)
      const r = await fetch('/api/aplicaciones/upload', { method: 'POST', headers: hdr, body: fd })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error'); await load()
    } catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setBusy('') }
  }

  if (!app) return <div className="border-t border-neutral-200 p-4 text-sm text-neutral-500">Cargando…</div>
  const an = app.analysis
  const reqColor = (e: string) => e === 'cumple' ? { t: '✓', c: '#1E8E5A' } : e === 'parcial' ? { t: '≈', c: '#E8A317' } : { t: '✕', c: '#B4451A' }
  const url = app.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/aplicaciones/p/${app.slug}` : null

  return (
    <div className="flex flex-col gap-5 border-t border-neutral-200 p-4">
      {/* análisis */}
      {an ? (
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="font-mono text-3xl font-extrabold" style={{ color: an.match_pct >= 70 ? '#1E8E5A' : an.match_pct >= 45 ? '#E8A317' : '#B4451A' }}>{an.match_pct}%</span>
            <span className="text-sm text-neutral-700">{an.veredicto}</span>
          </div>
          {an.obligatoria && <div className="mb-3 rounded-lg bg-[#FFE6DA] px-3 py-2 text-sm font-medium text-[#B4451A]">⚠ Instrucción obligatoria de la vacante: {an.obligatoria}</div>}
          <div className="grid gap-1.5">
            {an.requisitos.map((rq, i) => { const c = reqColor(rq.estado); return (
              <div key={i} className="flex gap-2 text-[13px]"><b style={{ color: c.c }}>{c.t}</b><span><b>{rq.texto}</b>{rq.evidencia && <span className="text-neutral-500"> — {rq.evidencia}</span>}</span></div>
            ) })}
          </div>
          {an.argumentos.length > 0 && <p className="mt-3 text-[13px]"><b>Argumentos fuertes:</b> {an.argumentos.join(' · ')}</p>}
          {an.huecos.length > 0 && <p className="mt-1 text-[13px] text-[#B4451A]"><b>Huecos:</b> {an.huecos.join(' · ')}</p>}
        </div>
      ) : <button onClick={() => patch({ action: 'reanalizar' }, 'rean')} className="self-start rounded-lg border border-neutral-900 px-3 py-1.5 text-sm">{busy === 'rean' ? 'Analizando…' : 'Analizar vacante'}</button>}

      {/* carta */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <b className="text-sm">Carta</b>
          <button onClick={genCarta} className="rounded-lg border border-neutral-900 px-3 py-1 text-xs">{busy === 'carta' ? 'Generando…' : app.carta ? 'Regenerar' : 'Generar carta'}</button>
        </div>
        <input className="mb-2 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" placeholder="Línea de posicionamiento" defaultValue={app.posicionamiento ?? ''} onBlur={(e) => { if (e.target.value !== (app.posicionamiento ?? '')) patch({ posicionamiento: e.target.value }, 'pos') }} />
        <textarea className="w-full rounded border border-neutral-300 px-2 py-2 text-[13px] font-mono" rows={8} defaultValue={app.carta ?? ''} placeholder="La carta (HTML) — edítala aquí; se guarda al salir del campo." onBlur={(e) => { if (e.target.value !== (app.carta ?? '')) patch({ carta: e.target.value }, 'car') }} />
      </div>

      {/* CV: subir archivo o pegar URL */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-neutral-900 bg-white px-3 py-1.5 text-sm font-semibold">
            {busy === 'cvup' ? 'Subiendo…' : '📄 Subir CV (PDF)'}
            <input type="file" accept="application/pdf" className="hidden" disabled={busy === 'cvup'} onChange={(e) => subirCv(e.target.files?.[0])} />
          </label>
          {app.cv_url && <a href={app.cv_url} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 underline">Ver CV cargado{app.cv_nombre ? ` · ${app.cv_nombre}` : ''}</a>}
        </div>
        <input className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" placeholder="…o pega la URL del CV" defaultValue={app.cv_url ?? ''} onBlur={(e) => { if (e.target.value !== (app.cv_url ?? '')) patch({ cv_url: e.target.value.trim() }, 'cv') }} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!app.slug ? <button onClick={() => patch({ action: 'publicar' }, 'pub')} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-bold text-lime-300">{busy === 'pub' ? 'Publicando…' : 'Publicar y generar link'}</button>
          : <>
            <a href={url!} target="_blank" rel="noreferrer" className="rounded-lg bg-lime-300 px-4 py-2 text-sm font-bold">Ver página →</a>
            <button onClick={() => navigator.clipboard?.writeText(url!)} className="rounded-lg border border-neutral-900 px-3 py-2 text-sm">Copiar link</button>
            <span className="font-mono text-xs text-neutral-500 break-all">{url}</span>
          </>}
      </div>
      {msg && <p className="text-sm text-red-700">{msg}</p>}

      {/* métricas legibles */}
      {(() => {
        const aperturas = events.filter((e) => e.tipo === 'open').length
        const visitantes = new Set(events.filter((e) => e.visitor_id).map((e) => e.visitor_id)).size
        const leido = events.filter((e) => e.tipo === 'time_on_page').reduce((a, e) => a + Number(e.data?.seconds || 0), 0)
        const cvs = events.filter((e) => e.tipo === 'cv_download').length
        const ultima = events[0]?.created_at ?? null
        const secc = new Map<string, number>()
        for (const e of events) if (e.tipo === 'section_view') { const s = String(e.data?.section || 'x'); secc.set(s, (secc.get(s) || 0) + Number(e.data?.seconds || 0)) }
        const seccArr = Array.from(secc.entries()).sort((a, b) => b[1] - a[1])
        const maxSec = seccArr.length ? seccArr[0][1] : 1
        const secLabel: Record<string, string> = { encabezado: 'Encabezado', carta: 'Carta', cv: 'CV', video: 'Video' }
        const tile = (n: string | number, l: string, hot?: boolean) => (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <div className="text-lg font-extrabold" style={{ fontFamily: "'Syne',sans-serif", color: hot ? '#B4451A' : undefined }}>{n}</div>
            <div className="text-[10.5px] uppercase tracking-wide text-neutral-500">{l}</div>
          </div>
        )
        const frase = aperturas === 0 ? 'Todavía nadie lo abre.'
          : visitantes > 1 ? `🔥 Lo abrieron ${visitantes} personas distintas — lo compartieron internamente.`
          : cvs > 0 ? `Lo abrió, leyó ${dur(leido)} y descargó tu CV.`
          : leido >= 60 ? `Lo abrió y lleva ${dur(leido)} leyendo.`
          : `Lo abrió (${dur(leido)} de lectura).`
        return (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <b className="text-sm">Actividad</b>
              <span className="text-xs text-neutral-500">última: {hace(ultima)}</span>
            </div>
            <p className="mb-3 text-[13px] text-neutral-700">{frase}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {tile(aperturas, 'Aperturas')}
              {tile(visitantes, 'Visitantes', visitantes > 1)}
              {tile(dur(leido), 'Tiempo leído')}
              {tile(cvs, 'Descargas CV')}
            </div>
            {seccArr.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-[11px] uppercase tracking-wide text-neutral-500">Qué leyeron (tiempo por sección)</div>
                <div className="flex flex-col gap-1.5">
                  {seccArr.map(([s, sec]) => (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className="w-20 shrink-0 text-neutral-600">{secLabel[s] || s}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded bg-neutral-100"><div className="h-full rounded bg-neutral-800" style={{ width: `${Math.round((sec / maxSec) * 100)}%` }} /></div>
                      <span className="w-12 text-right font-mono text-neutral-500">{dur(sec)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setShowRaw((v) => !v)} className="mt-3 text-xs text-neutral-500 underline">{showRaw ? 'Ocultar' : `Ver eventos (${events.length})`}</button>
            {showRaw && (
              <div className="mt-2 flex flex-col gap-1">
                {events.slice(0, 60).map((e, i) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-[11px] text-neutral-600">
                    <span className="text-neutral-400">{new Date(e.created_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-bold text-neutral-900">{e.tipo}</span>
                    {e.data?.seconds ? <span>+{String(e.data.seconds)}s</span> : null}
                    {e.data?.section ? <span>· {String(e.data.section)}</span> : null}
                    {e.device ? <span>· {e.device}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

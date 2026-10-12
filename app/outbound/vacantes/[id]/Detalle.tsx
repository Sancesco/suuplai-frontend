'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface Base { sueldo?: string; anios_ventas?: string; ingles?: string; disponibilidad?: string; porque?: string; experiencia_relevante?: string }
interface Custom { label: string; respuesta: string }
interface Pregunta { label: string; required?: boolean; auto?: boolean; type?: string; opciones?: string[] }
interface Vacante {
  id: string; titulo: string; empresa: string | null; ubicacion: string | null; sueldo: string | null
  link: string | null; puntaje: number; descripcion: string | null; estado: string; fuente: string | null
  ats: string | null; preguntas: Pregunta[] | null
  respuestas: { base?: Base; custom?: Custom[] } | null; carta: string | null; mensaje_contacto: string | null
  contacto_nombre: string | null; contacto_linkedin: string | null; contacto_email: string | null
  cv_link: string | null; notas: string | null
}

const BASE_CAMPOS: { k: keyof Base; label: string }[] = [
  { k: 'sueldo', label: 'Expectativa salarial' }, { k: 'anios_ventas', label: 'Años en ventas' },
  { k: 'ingles', label: 'Inglés' }, { k: 'disponibilidad', label: 'Disponibilidad' },
  { k: 'porque', label: '¿Por qué te interesa?' }, { k: 'experiencia_relevante', label: 'Experiencia relevante' },
]

export function Detalle({ id }: { id: string }) {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [v, setV] = useState<Vacante | null>(null); const [preparando, setPreparando] = useState(false); const [leyendoPreg, setLeyendoPreg] = useState(false)
  const [base, setBase] = useState<Base>({}); const [custom, setCustom] = useState<Custom[]>([]); const [carta, setCarta] = useState(''); const [notaIngles, setNotaIngles] = useState('')
  const [notas, setNotas] = useState(''); const [contacto, setContacto] = useState({ nombre: '', linkedin: '', email: '' })
  const [cvLink, setCvLink] = useState(''); const [copiado, setCopiado] = useState(''); const [pegaPreg, setPegaPreg] = useState('')
  const [preguntaEnvio, setPreguntaEnvio] = useState(false)

  const headers = useMemo(() => ({ 'x-admin-password': pw, 'Content-Type': 'application/json' }), [pw])

  const hidratar = (va: Vacante) => {
    setV(va); setBase(va.respuestas?.base || {}); setCustom(va.respuestas?.custom || []); setCarta(va.carta || ''); setNotas(va.notas || '')
    setContacto({ nombre: va.contacto_nombre || '', linkedin: va.contacto_linkedin || '', email: va.contacto_email || '' }); setCvLink(va.cv_link || '')
  }

  const load = useCallback(async (p?: string) => {
    const pass = p ?? pw; setErr('')
    try {
      const r = await fetch(`/api/vacantes/${id}`, { headers: { 'x-admin-password': pass } })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      hidratar(j.vacante as Vacante); setAuthed(true)
      try { localStorage.setItem('outbound_auth', JSON.stringify({ pw: pass, exp: Date.now() + 30 * 86400000 })) } catch { /* noop */ }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw, id])

  useEffect(() => { try { const raw = localStorage.getItem('outbound_auth'); if (raw) { const s = JSON.parse(raw); if (s?.pw && s.exp > Date.now()) { setPw(s.pw); load(s.pw) } } } catch { /* noop */ } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const preparar = async () => {
    setPreparando(true)
    try {
      const r = await fetch(`/api/vacantes/${id}/preparar`, { method: 'POST', headers })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setBase(j.respuestas?.base || {}); setCustom(j.respuestas?.custom || []); setCarta(j.carta || ''); setNotaIngles(j.nota_ingles || '')
      setV((x) => x ? { ...x, estado: x.estado === 'nueva' || x.estado === 'interesa' ? 'preparada' : x.estado } : x)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error') } finally { setPreparando(false) }
  }

  const leerPreguntas = async () => {
    setLeyendoPreg(true)
    try {
      const r = await fetch(`/api/vacantes/${id}/preguntas`, { method: 'POST', headers, body: JSON.stringify({ texto: pegaPreg }) })
      const j = await r.json(); if (j.ok) { setV((x) => x ? { ...x, preguntas: j.preguntas } : x); setPegaPreg('') }
    } finally { setLeyendoPreg(false) }
  }

  const guardarTextos = () => { fetch(`/api/vacantes/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ respuestas: { base, custom }, carta }) }) }
  const guardarContacto = () => { fetch(`/api/vacantes/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ contacto_nombre: contacto.nombre, contacto_linkedin: contacto.linkedin, contacto_email: contacto.email }) }) }
  const guardarNotas = () => { fetch(`/api/vacantes/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ notas }) }) }
  const setEstado = (estado: string) => { setV((x) => x ? { ...x, estado } : x); fetch(`/api/vacantes/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ estado }) }) }
  const copiar = async (t: string, tag: string) => { try { await navigator.clipboard.writeText(t); setCopiado(tag); setTimeout(() => setCopiado(''), 1500) } catch { /* noop */ } }
  const abrirVacante = () => { if (v?.link) { window.open(v.link, '_blank', 'noopener'); setPreguntaEnvio(true) } }
  const [cvGen, setCvGen] = useState(false)
  const generarCv = async () => {
    setCvGen(true); setErr('')
    try {
      const r = await fetch(`/api/vacantes/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ generarCv: true }) })
      const j = await r.json()
      if (j.ok && j.cv_link) setCvLink(j.cv_link); else setErr(j.error || 'No se pudo generar el link')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error') } finally { setCvGen(false) }
  }

  const mensajeConLink = (v?.mensaje_contacto || '').replace(/\[link\]/g, cvLink || '[genera tu link de CV]')
  const inp = 'w-full rounded-lg border border-neutral-900 bg-white px-3 py-2 text-sm outline-none'
  const BtnCopiar = ({ t, tag }: { t: string; tag: string }) => (
    <button onClick={() => copiar(t, tag)} className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-lime-300">{copiado === tag ? '✓ copiado' : 'Copiar'}</button>
  )

  if (!authed) return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div className="mx-auto w-full max-w-[720px] px-4 py-8">
        <div className="flex max-w-md flex-wrap gap-2">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Contraseña" className="min-w-[200px] flex-1 rounded-lg border border-neutral-900 bg-white px-3.5 py-2.5 text-sm outline-none" />
          <button onClick={() => load()} disabled={!pw} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-lime-300">Entrar</button>
        </div>
        {err && <p className="mt-2 text-sm text-red-700">⚠ {err}</p>}
      </div>
    </div>
  )
  if (!v) return <div className="min-h-screen bg-[#F4F2EC] p-8 text-neutral-500">Cargando…</div>

  const preguntas = v.preguntas || []
  const customVisibles = custom.filter((c) => c.respuesta && c.respuesta.trim())

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div className="mx-auto w-full max-w-[720px] px-4 py-8">
        <Link href="/outbound/vacantes" className="text-sm text-neutral-500 underline">← vacantes</Link>

        <div className="mt-3 rounded-xl border-2 border-neutral-900 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Syne',sans-serif" }}>{v.titulo}</h1>
              <p className="text-sm text-neutral-600">{v.empresa || '—'} · {v.ubicacion || '—'}{v.sueldo ? ` · ${v.sueldo}` : ''}</p>
              {v.ats && <span className="mt-1 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800">{v.ats}</span>}
            </div>
            <span className="shrink-0 font-mono text-sm font-bold" style={{ color: v.puntaje >= 6 ? '#1E8E5A' : '#9A6A00' }}>{v.puntaje}pts</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={abrirVacante} disabled={!v.link} className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">↗ Abrir vacante</button>
            <button onClick={preparar} disabled={preparando} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-bold text-lime-300 disabled:opacity-50">{preparando ? 'Preparando…' : '✨ Preparar aplicación'}</button>
            <span className="self-center rounded px-2 py-1 text-xs font-semibold text-neutral-500">{v.estado}</span>
          </div>
          {notaIngles && <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">🇬🇧 {notaIngles}</p>}
        </div>

        {v.descripcion && (
          <details className="mt-3 rounded-xl border border-neutral-900 bg-white p-3">
            <summary className="cursor-pointer text-sm font-bold">Descripción completa</summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{v.descripcion}</p>
          </details>
        )}

        {/* Preguntas del formulario */}
        <h2 className="mt-5 mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Preguntas del formulario</h2>
        {preguntas.length > 0 ? (
          <div className="rounded-xl border border-neutral-900 bg-white p-3 text-xs">
            <ul className="flex flex-col gap-1">
              {preguntas.map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={q.auto ? 'text-neutral-400' : 'text-neutral-800'}>{q.label}{q.required ? ' *' : ''}</span>
                  {q.auto && <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">Simplify la llena</span>}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-900 bg-white p-3">
            <textarea value={pegaPreg} onChange={(e) => setPegaPreg(e.target.value)} placeholder="Pega aquí las preguntas del formulario, una por línea (pon * si es obligatoria)" className={`${inp} min-h-[80px]`} />
            <button onClick={leerPreguntas} disabled={leyendoPreg || !pegaPreg.trim()} className="mt-2 rounded-lg border border-neutral-900 px-3 py-1.5 text-xs font-bold disabled:opacity-50">{leyendoPreg ? 'Leyendo…' : 'Leer preguntas'}</button>
          </div>
        )}

        {/* Copiar para el formulario — respuestas por pregunta */}
        {customVisibles.length > 0 && (
          <>
            <h2 className="mt-5 mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Copiar para el formulario</h2>
            <div className="flex flex-col gap-2">
              {custom.map((c, i) => c.respuesta?.trim() ? (
                <div key={i} className={`rounded-xl border p-3 ${/\[COMPLETAR/i.test(c.respuesta) ? 'border-amber-500 bg-amber-50' : 'border-neutral-900 bg-white'}`}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-neutral-500">{c.label}</span>
                    <BtnCopiar t={c.respuesta} tag={`c${i}`} />
                  </div>
                  <textarea value={c.respuesta} onChange={(e) => setCustom(custom.map((x, j) => j === i ? { ...x, respuesta: e.target.value } : x))} onBlur={guardarTextos} className={`${inp} min-h-[52px]`} />
                </div>
              ) : null)}
            </div>
          </>
        )}

        {/* Respuestas base + carta (colapsadas) */}
        <details className="mt-3 rounded-xl border border-neutral-900 bg-white p-3">
          <summary className="cursor-pointer text-sm font-bold">Respuestas base y carta</summary>
          <div className="mt-2 flex flex-col gap-2">
            {BASE_CAMPOS.map(({ k, label }) => (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between gap-2"><span className="text-xs font-bold text-neutral-500">{label}</span><BtnCopiar t={base[k] || ''} tag={`b${k}`} /></div>
                <textarea value={base[k] || ''} onChange={(e) => setBase({ ...base, [k]: e.target.value })} onBlur={guardarTextos} className={`${inp} min-h-[48px]`} />
              </div>
            ))}
            <div>
              <div className="mb-1 flex items-center justify-between gap-2"><span className="text-xs font-bold text-neutral-500">Carta</span><BtnCopiar t={carta} tag="carta" /></div>
              <textarea value={carta} onChange={(e) => setCarta(e.target.value)} onBlur={guardarTextos} className={`${inp} min-h-[120px]`} />
            </div>
          </div>
        </details>

        {/* Contacto */}
        <h2 className="mt-5 mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Contacto (quien contrata)</h2>
        <div className="rounded-xl border border-neutral-900 bg-white p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input value={contacto.nombre} onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })} onBlur={guardarContacto} placeholder="Nombre" className={inp} />
            <input value={contacto.linkedin} onChange={(e) => setContacto({ ...contacto, linkedin: e.target.value })} onBlur={guardarContacto} placeholder="LinkedIn URL" className={inp} />
            <input value={contacto.email} onChange={(e) => setContacto({ ...contacto, email: e.target.value })} onBlur={guardarContacto} placeholder="Correo" className={inp} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {cvLink
              ? <span className="flex items-center gap-1.5 text-xs text-emerald-700"><a href={cvLink} target="_blank" rel="noreferrer" className="underline">{cvLink.replace('https://www.', '')}</a><button onClick={() => copiar(cvLink, 'cv')} className="rounded border border-neutral-300 px-1.5 py-0.5 text-[10px]">{copiado === 'cv' ? '✓' : 'copiar'}</button></span>
              : <button onClick={generarCv} disabled={cvGen} className="rounded-lg border border-neutral-900 px-3 py-1.5 text-xs font-bold disabled:opacity-50">{cvGen ? 'Generando…' : 'Generar link de CV rastreable'}</button>}
          </div>
          {err && <p className="mt-1 text-xs text-red-700">⚠ {err}</p>}
          {v.mensaje_contacto && (
            <div className="mt-3 rounded-lg bg-neutral-50 p-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-neutral-500">Mensaje para LinkedIn</span>
                <button onClick={() => { copiar(mensajeConLink, 'msg'); if (v.estado === 'aplicada' || v.estado === 'preparada') setEstado('contacto_enviado') }} className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-lime-300">{copiado === 'msg' ? '✓ copiado' : 'Copiar mensaje'}</button>
              </div>
              <p className="whitespace-pre-wrap text-xs text-neutral-700">{mensajeConLink}</p>
            </div>
          )}
        </div>

        <h2 className="mt-5 mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Notas</h2>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} onBlur={guardarNotas} placeholder="Notas libres…" className={`${inp} min-h-[80px]`} />
        <div className="h-16" />
      </div>

      {preguntaEnvio && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setPreguntaEnvio(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-base font-bold">¿Enviaste la aplicación?</p>
            <p className="mb-4 text-xs text-neutral-500">1) Autofill con Simplify · 2) Pega las respuestas de aquí · 3) Revisa y envía</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => { setEstado('aplicada'); setPreguntaEnvio(false) }} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-lime-300">Sí, la mandé</button>
              <button onClick={() => setPreguntaEnvio(false)} className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm">Todavía no</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

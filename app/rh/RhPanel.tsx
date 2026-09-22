'use client'

import { useCallback, useEffect, useState } from 'react'

const BONE = '#FFFEF3', PAPER = '#F4F2E4', INK = '#0A0A0F', SOFT = '#56554D', LINE = '#D9D7C4'
const LIME = '#E8FF47', EMBER = '#FF6B35', OK = '#1E8E5A'
const SYNE = "'Syne',system-ui,sans-serif", MONO = "'Space Mono',ui-monospace,monospace"

const ST_LABEL: Record<string, string> = { pending: 'Pendiente', in_progress: 'A medias', completed: 'Listo', discarded: 'Descartado', call_scheduled: 'Llamada agendada' }
const LBL: Record<string, { t: string; bg: string; c: string }> = {
  call: { t: 'Agendar llamada', bg: '#D9F2E4', c: OK },
  review: { t: 'Revisar datos', bg: '#FFE6DA', c: '#B4451A' },
  discard: { t: 'Descartar', bg: PAPER, c: SOFT },
}

interface Row { id: string; name: string; phone: string | null; status: string; invited_at: string; completed_at: string | null; interview: string; answered: number; scored: number; total: number; maxTotal: number; label: string | null; knockout: string[]; stale: boolean }
interface BaseQ { order: number; text: string; rubric: Record<string, string> }
interface Base { quick_fields: { label: string }[]; questions: BaseQ[] }
interface QEdit { text: string; r1: string; r2: string; r3: string; fixed?: boolean }
type PdfjsLib = { GlobalWorkerOptions: { workerSrc: string }; getDocument: (o: { data: ArrayBuffer }) => { promise: Promise<PdfDoc> } }
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> }
type PdfPage = { getTextContent: () => Promise<{ items: { str?: string }[] }> }
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
interface QDetail { order: number; text: string; rubric: Record<string, string>; audioUrl: string | null; duration: number | null; transcript: string | null; score: number | null; note: string }
interface Detail { invite: { id: string; name: string; phone: string | null; status: string; invited_at: string; completed_at: string | null }; quick: { label: string; value: string; knockout: boolean }[]; questions: QDetail[]; total: number; maxTotal: number; fullyScored: boolean; label: string | null; knockout: string[]; thresholds: { call: number; review: number } }

export function RhPanel() {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [tpl, setTpl] = useState<{ title: string; questions: number } | null>(null)
  const [base, setBase] = useState<Base | null>(null)
  const [roles, setRoles] = useState<{ key: string; name: string }[]>([])
  const [rows, setRows] = useState<Row[] | null>(null)
  const [sort, setSort] = useState<'fecha' | 'puntaje'>('fecha')
  const [openId, setOpenId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const hdr = { 'x-admin-password': pw }

  const load = useCallback(async () => {
    setErr('')
    try {
      const r = await fetch('/api/rh/invites', { headers: hdr })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setTpl(j.template); setBase(j.base as Base); setRoles(j.roles || []); setRows(j.invites as Row[]); setAuthed(true)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw]) // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = (rows ?? []).slice().sort((a, b) => sort === 'puntaje' ? (b.total - a.total) : (new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime()))

  const [dlAll, setDlAll] = useState(false)
  const downloadAll = async () => {
    const done = (rows ?? []).filter((r) => r.status === 'completed')
    if (!done.length) { alert('Aún no hay entrevistas completadas.'); return }
    setDlAll(true)
    try {
      const parts: string[] = []
      for (const r of done) {
        const res = await fetch(`/api/rh/invites/${r.id}`, { headers: hdr })
        const j = await res.json(); if (j.ok) parts.push(buildExport(j as Detail))
      }
      downloadText(`entrevistas-completadas-${new Date().toISOString().slice(0, 10)}.md`, parts.join('\n\n---\n\n'))
    } finally { setDlAll(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: PAPER, color: INK, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');` }} />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px clamp(16px,4vw,40px) 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
          <h1 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 26, letterSpacing: '-1px', margin: 0 }}>RH · Suuplai</h1>
          <span style={{ fontFamily: MONO, fontSize: 12, color: SOFT, textTransform: 'uppercase', letterSpacing: '.1em' }}>{tpl ? tpl.title : 'Preentrevistas'}</span>
        </div>

        {!authed && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 420 }}>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Contraseña de admin"
              style={{ flex: 1, minWidth: 200, background: BONE, border: `1.5px solid ${INK}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none' }} />
            <button onClick={load} disabled={!pw} style={{ background: INK, color: LIME, border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: SYNE }}>Entrar</button>
          </div>
        )}
        {err && <p style={{ color: '#B4451A', marginTop: 10, fontSize: 14 }}>⚠ {err}</p>}

        {authed && (
          <>
            {showNew && <NuevaEntrevista hdr={hdr} base={base} roles={roles} onCreated={load} onClose={() => setShowNew(false)} />}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '22px 0 10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 20, margin: 0 }}>Entrevistas {rows ? `(${rows.length})` : ''}</h2>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setShowNew((v) => !v)} style={{ ...btn, background: LIME }}>{showNew ? '✕ Cerrar' : '+ Nueva entrevista'}</button>
                <button onClick={downloadAll} disabled={dlAll} style={{ ...btn, background: INK, color: LIME, opacity: dlAll ? 0.5 : 1 }}>{dlAll ? 'Preparando…' : '⬇ Descargar completados'}</button>
                <Seg on={sort === 'fecha'} onClick={() => setSort('fecha')}>Por fecha</Seg>
                <Seg on={sort === 'puntaje'} onClick={() => setSort('puntaje')}>Por puntaje</Seg>
              </div>
            </div>
            {!rows ? <Muted>Cargando…</Muted> : rows.length === 0 ? <Muted>Aún no invitas a nadie. Usa el botón de arriba.</Muted> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sorted.map((r) => (
                  <div key={r.id} style={{ background: BONE, border: `1.5px solid ${INK}`, borderRadius: 14, overflow: 'hidden' }}>
                    <button onClick={() => setOpenId(openId === r.id ? null : r.id)} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', width: '100%', textAlign: 'left', border: 0, background: 'transparent', padding: '14px 16px', cursor: 'pointer' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14, border: `1.5px solid ${INK}`, background: r.status === 'completed' ? LIME : r.status === 'in_progress' ? '#C9A6FF' : PAPER }}>{initials(r.name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <b style={{ fontSize: 15, display: 'flex', gap: 8, alignItems: 'center' }}>{r.name}{r.knockout.length > 0 && <span title={'Knockout: ' + r.knockout.join(', ')} style={{ color: '#B4451A', fontSize: 12 }}>⚠ descarte</span>}{r.stale && <span style={{ color: '#B4451A', fontSize: 12 }}>· sin completar +3d</span>}</b>
                        <span style={{ fontSize: 13, color: SOFT }}>{ST_LABEL[r.status]} · {r.answered}/{Math.max(1, Math.round(r.maxTotal / 3))} respuestas · {r.interview} · {fmtDate(r.invited_at)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {r.label && <Badge {...LBL[r.label]} />}
                        <span style={{ fontFamily: MONO, fontSize: 14, minWidth: 44, textAlign: 'right' }}>{r.scored > 0 ? `${r.total}/${r.maxTotal}` : '—'}</span>
                      </div>
                    </button>
                    {openId === r.id && <CandidateDetail id={r.id} hdr={hdr} onChange={load} />}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function NuevaEntrevista({ hdr, base, roles, onCreated, onClose }: { hdr: Record<string, string>; base: Base | null; roles: { key: string; name: string }[]; onCreated: () => void; onClose: () => void }) {
  const [name, setName] = useState(''); const [phone, setPhone] = useState('')
  const [roleKey, setRoleKey] = useState('')
  const [qs, setQs] = useState<QEdit[]>([])
  const [perfil, setPerfil] = useState(''); const [duda, setDuda] = useState('')
  const [cvBusy, setCvBusy] = useState(false); const [cvMsg, setCvMsg] = useState('')
  const [busy, setBusy] = useState(false); const [link, setLink] = useState<string | null>(null); const [nm, setNm] = useState(''); const [waNum, setWaNum] = useState(''); const [msg, setMsg] = useState('')

  // Carga pdf.js una vez (para leer el texto del CV en el navegador).
  useEffect(() => {
    if (typeof window === 'undefined' || (window as unknown as { pdfjsLib?: PdfjsLib }).pdfjsLib) return
    const s = document.createElement('script'); s.src = PDFJS
    s.onload = () => { const lib = (window as unknown as { pdfjsLib?: PdfjsLib }).pdfjsLib; if (lib) lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER }
    document.body.appendChild(s)
  }, [])

  useEffect(() => { if (!roleKey && roles.length) setRoleKey(roles[0].key) }, [roles, roleKey])

  const upd = (i: number, patch: Partial<QEdit>) => setQs((prev) => prev.map((q, idx) => idx === i ? { ...q, ...patch } : q))
  const addQ = () => setQs((prev) => [...prev, { text: '', r1: '', r2: '', r3: '' }])
  const removeQ = (i: number) => setQs((prev) => prev.filter((_, idx) => idx !== i))

  async function extractPdf(file: File): Promise<string> {
    const lib = (window as unknown as { pdfjsLib?: PdfjsLib }).pdfjsLib
    if (!lib) throw new Error('el lector de PDF aún no carga, intenta de nuevo')
    const buf = await file.arrayBuffer()
    const pdf = await lib.getDocument({ data: buf }).promise
    let text = ''
    for (let p = 1; p <= pdf.numPages; p++) { const page = await pdf.getPage(p); const c = await page.getTextContent(); text += c.items.map((it) => it.str || '').join(' ') + '\n' }
    return text.trim()
  }

  const onCV = async (file: File | undefined) => {
    if (!file) return
    setCvBusy(true); setCvMsg(''); setPerfil(''); setDuda('')
    try {
      const cvText = await extractPdf(file)
      if (cvText.length < 40) throw new Error('el CV no trae texto legible (¿es imagen escaneada?)')
      const r = await fetch('/api/rh/generar', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, cvText, roleKey }) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error((j.error || 'Error generando') + (j.detail ? ` (${j.detail})` : ''))
      setPerfil(j.perfil || ''); setDuda(j.duda || '')
      // Autollena nombre/teléfono detectados en el CV si están vacíos.
      if (j.nombre && !name.trim()) setName(j.nombre)
      if (j.telefono && !phone.trim()) setPhone(j.telefono)
      const ai: QEdit[] = (j.questions as { text: string; rubric: Record<string, string> }[]).map((q) => ({ text: q.text, r1: q.rubric['1'] || '', r2: q.rubric['2'] || '', r3: q.rubric['3'] || '' }))
      // La IA arma la entrevista completa (decide cuántas): reemplaza todas.
      setQs(ai)
      const detectado = [j.nombre && 'nombre', j.telefono && 'teléfono'].filter(Boolean).join(' y ')
      setCvMsg(`✓ ${ai.length} preguntas generadas${detectado ? ` · detecté ${detectado} del CV` : ''}. Revisa y ajusta antes de crear.`)
    } catch (e) { setCvMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setCvBusy(false) }
  }

  const create = async () => {
    if (!name.trim()) return
    setBusy(true); setMsg('')
    try {
      const questions = qs.filter((q) => q.text.trim()).map((q) => ({ text: q.text.trim(), rubric: { '1': q.r1.trim(), '2': q.r2.trim(), '3': q.r3.trim() } }))
      const r = await fetch('/api/rh/invites', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, roleKey, questions }) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      const d = phone.replace(/\D/g, ''); setWaNum(d.length === 10 ? '52' + d : d)
      setLink(`${window.location.origin}/entrevista/${j.token}`); setNm(name)
      setName(''); setPhone(''); setQs([]); setPerfil(''); setDuda(''); setCvMsg(''); onCreated()
    } catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setBusy(false) }
  }

  const waMsg = link ? `Hola ${nm}, gracias por escribir. Antes de coordinar la llamada me encantaría que me ayudes con esta mini-entrevista en audio: la contestas desde tu celular cuando quieras, son unos 10 min y no instalas nada. Aquí está tu link personal:\n${link}` : ''

  return (
    <div style={{ background: BONE, border: `2px solid ${INK}`, borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 18, margin: 0 }}>Nueva entrevista a la medida</h3>
        <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 18, color: SOFT }}>✕</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
        <Fld label="Rol">
          <select value={roleKey} onChange={(e) => setRoleKey(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
          </select>
        </Fld>
        <Fld label="Nombre del candidato"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" style={inp} /></Fld>
        <Fld label="WhatsApp (opcional)"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="55…" style={inp} /></Fld>
        <Fld label="CV en PDF (la IA arma las preguntas)">
          <label style={{ ...btn, display: 'inline-block', textAlign: 'center', opacity: cvBusy ? 0.5 : 1 }}>
            {cvBusy ? 'Generando…' : '📄 Subir CV y generar'}
            <input type="file" accept="application/pdf" disabled={cvBusy} onChange={(e) => onCV(e.target.files?.[0])} style={{ display: 'none' }} />
          </label>
        </Fld>
      </div>
      {cvMsg && <p style={{ color: cvMsg.startsWith('✓') ? OK : '#B4451A', fontSize: 13, marginTop: 8 }}>{cvMsg}</p>}
      {(perfil || duda) && (
        <div style={{ background: PAPER, borderRadius: 10, padding: '10px 12px', marginTop: 8, fontSize: 13 }}>
          {perfil && <div><b>Perfil:</b> {perfil}</div>}
          {duda && <div style={{ marginTop: 2 }}><b>Duda a resolver:</b> {duda}</div>}
        </div>
      )}

      {base && (
        <p style={{ fontSize: 12, color: SOFT, margin: '14px 0 6px' }}>Datos rápidos que se preguntan igual a todos: {base.quick_fields.map((f) => f.label.replace(/\?.*/, '')).join(' · ')}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
        {qs.length === 0 && <p style={{ fontSize: 13, color: SOFT, margin: '4px 0' }}>Sube el CV y la IA arma la entrevista completa a la medida de esta persona. También puedes escribir preguntas a mano.</p>}
        {qs.map((q, i) => (
          <div key={i} style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: EMBER, textTransform: 'uppercase', letterSpacing: '.06em' }}>Pregunta {i + 1}</span>
              <button onClick={() => removeQ(i)} style={{ border: 0, background: 'transparent', color: '#B4451A', cursor: 'pointer', fontSize: 12 }}>quitar</button>
            </div>
            <textarea value={q.text} onChange={(e) => upd(i, { text: e.target.value })} placeholder="Cuéntame de una vez que…" rows={2} style={{ ...inp, resize: 'vertical', fontFamily: "'DM Sans',sans-serif" }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 6 }}>
              <input value={q.r1} onChange={(e) => upd(i, { r1: e.target.value })} placeholder="1 = flojo" style={{ ...inp, fontSize: 12 }} />
              <input value={q.r2} onChange={(e) => upd(i, { r2: e.target.value })} placeholder="2 = aceptable" style={{ ...inp, fontSize: 12 }} />
              <input value={q.r3} onChange={(e) => upd(i, { r3: e.target.value })} placeholder="3 = muy bien" style={{ ...inp, fontSize: 12 }} />
            </div>
          </div>
        ))}
        <button onClick={addQ} style={{ ...btn, alignSelf: 'flex-start' }}>+ Agregar pregunta</button>
      </div>

      <button onClick={create} disabled={busy || !name.trim()} style={{ background: INK, color: LIME, border: 'none', borderRadius: 10, padding: '13px 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: SYNE, opacity: busy || !name.trim() ? 0.5 : 1, marginTop: 14 }}>{busy ? 'Creando…' : 'Crear entrevista y generar link'}</button>
      {msg && <p style={{ color: '#B4451A', fontSize: 13, marginTop: 10 }}>{msg}</p>}

      {link && (
        <div style={{ marginTop: 14, background: PAPER, borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: 13, margin: '0 0 8px', color: SOFT }}>Link para <b>{nm}</b>:</p>
          <div style={{ fontFamily: MONO, fontSize: 13, wordBreak: 'break-all', marginBottom: 10 }}>{link}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { navigator.clipboard?.writeText(link) }} style={btn}>Copiar link</button>
            <button onClick={() => { navigator.clipboard?.writeText(waMsg) }} style={btn}>Copiar mensaje de WhatsApp</button>
            {waNum && <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noreferrer" style={{ ...btn, background: LIME, textDecoration: 'none' }}>Abrir WhatsApp con {nm.split(/\s+/)[0]}</a>}
          </div>
        </div>
      )}
    </div>
  )
}

function CandidateDetail({ id, hdr, onChange }: { id: string; hdr: Record<string, string>; onChange: () => void }) {
  const [d, setD] = useState<Detail | null>(null)
  const load = useCallback(async () => { const r = await fetch(`/api/rh/invites/${id}`, { headers: hdr }); const j = await r.json(); if (j.ok) setD(j as Detail) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  const saveScore = async (order: number, patch: { score?: number; note?: string }) => {
    await fetch('/api/rh/score', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ inviteId: id, order, ...patch }) })
    load(); onChange()
  }
  const setStatus = async (status: string) => { await fetch(`/api/rh/invites/${id}`, { method: 'PATCH', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); load(); onChange() }
  const del = async () => { if (!confirm('¿Eliminar candidato y sus audios? No se puede deshacer.')) return; await fetch(`/api/rh/invites/${id}`, { method: 'DELETE', headers: hdr }); onChange() }

  if (!d) return <div style={{ padding: 16, borderTop: `1px solid ${LINE}` }}><Muted>Cargando…</Muted></div>
  return (
    <div style={{ borderTop: `1px solid ${LINE}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* resumen: datos rápidos + puntaje */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 16, alignItems: 'start' }}>
        <div>
          {d.knockout.length > 0 && <div style={{ background: '#FFE0D6', color: '#B4451A', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>⚠ Descarte automático: {d.knockout.join(', ')}</div>}
          <div style={{ display: 'grid', gap: 6 }}>
            {d.quick.map((q) => (
              <div key={q.label} style={{ display: 'flex', gap: 8, fontSize: 14 }}>
                <span style={{ color: SOFT, minWidth: 0 }}>{q.label}:</span>
                <b style={{ color: q.knockout ? '#B4451A' : INK }}>{q.value || '—'}</b>
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 30, lineHeight: 1 }}>{d.total}<span style={{ color: SOFT, fontSize: 18 }}>/{d.maxTotal}</span></div>
          {d.label ? <div style={{ marginTop: 8 }}><Badge {...LBL[d.label]} /></div> : <div style={{ marginTop: 8, fontSize: 12, color: SOFT, fontFamily: MONO }}>Falta calificar</div>}
        </div>
      </div>

      {/* preguntas */}
      {d.questions.map((q) => (
        <div key={q.order} style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: EMBER, marginBottom: 4 }}>Pregunta {q.order}</div>
          <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 16, marginBottom: 10, lineHeight: 1.2 }}>{q.text}</div>
          {q.audioUrl ? <audio controls src={q.audioUrl} style={{ width: '100%', marginBottom: 10 }} /> : <p style={{ fontSize: 13, color: SOFT, margin: '0 0 10px' }}>Sin audio todavía.</p>}
          {q.transcript && <p style={{ fontSize: 13, lineHeight: 1.5, color: INK, background: PAPER, borderRadius: 10, padding: '10px 12px', margin: '0 0 10px', whiteSpace: 'pre-wrap' }}><span style={{ fontFamily: MONO, fontSize: 10, color: SOFT, textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 4 }}>Transcripción</span>{q.transcript}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3].map((n) => (
              <button key={n} onClick={() => saveScore(q.order, { score: n })} style={{ flex: '1 1 150px', textAlign: 'left', border: `1.5px solid ${q.score === n ? INK : LINE}`, background: q.score === n ? INK : BONE, color: q.score === n ? BONE : INK, borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontSize: 13, lineHeight: 1.3 }}>
                <b style={{ fontFamily: SYNE, fontSize: 15, color: q.score === n ? LIME : EMBER }}>{n}</b> · {q.rubric[String(n)]}
              </button>
            ))}
          </div>
          <textarea defaultValue={q.note} onBlur={(e) => { if (e.target.value !== q.note) saveScore(q.order, { note: e.target.value }) }} placeholder="Nota (opcional)…" rows={2} style={{ ...inp, marginTop: 8, resize: 'vertical', fontFamily: "'DM Sans',sans-serif" }} />
        </div>
      ))}

      {/* acciones */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => downloadText(`entrevista-${slugName(d.invite.name)}.md`, buildExport(d))} style={{ ...btn, background: INK, color: LIME }}>⬇ Descargar para calificar</button>
        <button onClick={() => setStatus('call_scheduled')} style={{ ...btn, background: LIME }}>Llamada agendada</button>
        <button onClick={() => setStatus('discarded')} style={btn}>Descartar</button>
        <span style={{ fontSize: 12, color: SOFT, fontFamily: MONO }}>Estado: {ST_LABEL[d.invite.status]}</span>
        <button onClick={del} style={{ ...btn, marginLeft: 'auto', color: '#B4451A', borderColor: '#E0A99A' }}>Eliminar</button>
      </div>
    </div>
  )
}

// helpers UI
const inp: React.CSSProperties = { width: '100%', background: BONE, border: `1.5px solid ${INK}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', color: INK }
const btn: React.CSSProperties = { border: `1.5px solid ${INK}`, background: BONE, borderRadius: 999, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: INK }
function Fld({ label, children }: { label: string; children: React.ReactNode }) { return <div><label style={{ display: 'block', fontSize: 12, color: SOFT, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</label>{children}</div> }
function Muted({ children }: { children: React.ReactNode }) { return <p style={{ color: SOFT, fontSize: 14 }}>{children}</p> }
function Seg({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} style={{ border: `1.5px solid ${INK}`, background: on ? INK : 'transparent', color: on ? LIME : INK, borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{children}</button> }
function Badge({ t, bg, c }: { t: string; bg: string; c: string }) { return <span style={{ background: bg, color: c, fontFamily: MONO, fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{t}</span> }
function initials(n: string) { return n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) }

// Arma un archivo listo para pegar/subir a Claude y que califique.
function buildExport(d: Detail): string {
  const L: string[] = []
  L.push(`# Entrevista para calificar — ${d.invite.name}`)
  L.push('')
  L.push('Puesto: **Campo y operación** en Suuplai (ventas y visitas a tiendas, trabajo de calle, pago por día).')
  L.push('')
  L.push('## Instrucciones para calificar')
  L.push('Actúa como reclutador de Suuplai. El objetivo es ENCONTRAR TALENTO, no descartar: busca lo bueno de la persona. Premia ejemplos concretos y reales; no te dejes llevar por respuestas fluidas pero vacías, pero tampoco castigues a alguien por sonar con poca energía (convencerlo es parte del trabajo).')
  L.push('')
  L.push('Con base en TODAS las respuestas + los datos rápidos, califica estas 8 dimensiones de 1 a 3:')
  L.push('1. Palabra y constancia: hace lo que dice aunque le dé flojera.')
  L.push('2. Trato con la gente: no le da pena, conecta, lee a la otra persona.')
  L.push('3. Resolver sola: cuando algo sale mal, busca salida sin esperar instrucciones.')
  L.push('4. Aguante: ante un "no", insiste con otra estrategia.')
  L.push('5. Observación y reporte: nota detalles y los cuenta con claridad.')
  L.push('6. Iniciativa: ve algo que se puede mejorar y lo hace sin que se lo pidan.')
  L.push('7. Motor: qué la mueve (aprender, crecer, crear, dinero, estabilidad).')
  L.push('8. Encaje con el formato: si le late trabajar por días y en la calle, o busca oficina.')
  L.push('')
  L.push('Al final entrega: (a) un PERFIL DE FORTALEZAS de 3 líneas, (b) su SUPERPODER: la dimensión donde más destaca y a qué rol podría crecer (operación, ventas o contenido), (c) banderas honestas (sueldo fuera de rango, encaje de formato, respuestas vacías), y (d) una recomendación: AGENDAR LLAMADA / REVISAR / mejor NO. Recuerda: terminamos con un perfil, no con un simple sí o no.')
  L.push('')
  if (d.knockout.length) L.push(`> ⚠ Descarte automático por datos rápidos: ${d.knockout.join(', ')}`)
  L.push('## Datos rápidos')
  for (const q of d.quick) L.push(`- **${q.label}** ${q.value || '(sin responder)'}${q.knockout ? ' ⚠' : ''}`)
  L.push('')
  L.push('## Respuestas (audio transcrito)')
  for (const q of d.questions) {
    L.push('')
    L.push(`### Pregunta ${q.order}: ${q.text}`)
    L.push(`Rúbrica — 1: ${q.rubric['1']} · 2: ${q.rubric['2']} · 3: ${q.rubric['3']}`)
    L.push(`Transcripción: ${q.transcript ? '"' + q.transcript + '"' : '(sin audio o sin transcribir todavía)'}`)
  }
  return L.join('\n')
}

function slugName(n: string) { return n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() }

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

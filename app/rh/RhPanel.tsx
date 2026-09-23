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

interface Row { id: string; name: string; phone: string | null; status: string; invited_at: string; completed_at: string | null; interview: string; answered: number; scored: number; total: number; maxTotal: number; label: string | null; aiTotal: number | null; aiMax: number | null; aiRec: string | null; knockout: string[]; stale: boolean }
function recBadge(rec: string): { t: string; bg: string; c: string } {
  return /LLAMADA/i.test(rec) ? { t: 'Agendar llamada', bg: '#D9F2E4', c: OK } : /REVISAR/i.test(rec) ? { t: 'Revisar', bg: '#FFE6DA', c: '#B4451A' } : { t: 'Mejor no', bg: PAPER, c: SOFT }
}
interface BaseQ { order: number; text: string; rubric: Record<string, string> }
interface Base { quick_fields: { label: string }[]; questions: BaseQ[] }
interface QEdit { text: string; r1: string; r2: string; r3: string; fixed?: boolean }
type PdfjsLib = { GlobalWorkerOptions: { workerSrc: string }; getDocument: (o: { data: ArrayBuffer }) => { promise: Promise<PdfDoc> } }
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> }
type PdfPage = { getTextContent: () => Promise<{ items: { str?: string }[] }> }
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
interface Acoustic { energy0100: number; energyVar0100: number; energyThirds: number[]; noise0100: number; noisy: boolean; onsetSec: number; pitchSemitoneRange: number }
interface SMetrics { durationSec: number; pctMax: number | null; words: number; wpm: number; wpmThirds?: number[]; fillersPerMin: number; fillersTotal: number; fillerCounts: Record<string, number>; initialPauseSec: number; longPauses: number; acoustic?: Acoustic | null }
interface QDetail { order: number; text: string; rubric: Record<string, string>; audioUrl: string | null; duration: number | null; transcript: string | null; metrics: SMetrics | null; retakes: number; score: number | null; note: string }
interface Calificacion { dimensiones?: { label: string; score: number; nota: string }[]; perfil?: string; superpoder?: { dimension: string; crecer: string }; banderas?: string[]; recomendacion?: string }
interface Analysis { porPregunta?: { order: number; concrecion: number; contesto: string; porque: string }[]; contradicciones?: { cita1: string; cita2: string; nota: string }[]; frasesAbsolutas?: { cita: string; order: number }[]; calificacion?: Calificacion }
interface Detail { invite: { id: string; name: string; phone: string | null; status: string; invited_at: string; completed_at: string | null; first_opened_at: string | null; reminded_at: string | null }; quick: { label: string; value: string; knockout: boolean }[]; questions: QDetail[]; total: number; maxTotal: number; fullyScored: boolean; label: string | null; knockout: string[]; thresholds: { call: number; review: number }; analysis: Analysis | null }

export function RhPanel() {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [tpl, setTpl] = useState<{ title: string; questions: number } | null>(null)
  const [base, setBase] = useState<Base | null>(null)
  const [roles, setRoles] = useState<{ key: string; name: string }[]>([])
  const [rows, setRows] = useState<Row[] | null>(null)
  const [sort, setSort] = useState<'fecha' | 'puntaje'>('fecha')
  const [openId, setOpenId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [showRoles, setShowRoles] = useState(false)
  const hdr = { 'x-admin-password': pw }

  const load = useCallback(async () => {
    setErr('')
    try {
      const r = await fetch('/api/rh/invites', { headers: hdr })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setTpl(j.template); setBase(j.base as Base); setRoles(j.roles || []); setRows(j.invites as Row[]); setAuthed(true)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw]) // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = (rows ?? []).slice().sort((a, b) => sort === 'puntaje' ? ((b.aiTotal ?? b.total) - (a.aiTotal ?? a.total)) : (new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime()))

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
            {showRoles && <RolesPanel hdr={hdr} onChange={load} onClose={() => setShowRoles(false)} />}
            {showNew && <NuevaEntrevista hdr={hdr} base={base} roles={roles} onCreated={load} onClose={() => setShowNew(false)} />}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '22px 0 10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 20, margin: 0 }}>Entrevistas {rows ? `(${rows.length})` : ''}</h2>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setShowNew((v) => !v)} style={{ ...btn, background: LIME }}>{showNew ? '✕ Cerrar' : '+ Nueva entrevista'}</button>
                <button onClick={() => setShowRoles((v) => !v)} style={btn}>{showRoles ? '✕ Roles' : '⚙ Roles'}</button>
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
                        {r.aiRec ? <Badge {...recBadge(r.aiRec)} /> : r.label && <Badge {...LBL[r.label]} />}
                        <span style={{ fontFamily: MONO, fontSize: 14, minWidth: 44, textAlign: 'right' }}>{r.aiRec ? `${r.aiTotal}/${r.aiMax}` : r.scored > 0 ? `${r.total}/${r.maxTotal}` : '—'}</span>
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

interface RoleFull { key: string; slug: string; name: string; context: string; objetivo: string; salario: string; dimensions: { label: string; desc: string }[]; quick_fields: { label: string; type: string; options?: string[]; required?: boolean; knockout?: string[] }[] }
const ROLE_BLANK: RoleFull = { key: '', slug: '', name: '', context: '', objetivo: '', salario: '', dimensions: [], quick_fields: [] }

function RolesPanel({ hdr, onChange, onClose }: { hdr: Record<string, string>; onChange: () => void; onClose: () => void }) {
  const [roles, setRoles] = useState<RoleFull[] | null>(null)
  const [edit, setEdit] = useState<RoleFull | null>(null)
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const r = await fetch('/api/rh/roles', { headers: hdr }); const j = await r.json(); if (j.ok) setRoles(j.roles as RoleFull[])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!edit || !edit.name.trim()) { setMsg('Falta el nombre del rol.'); return }
    setBusy(true); setMsg('')
    try {
      const body = { id: edit.key && /^[0-9a-f-]{36}$/i.test(edit.key) ? edit.key : undefined, name: edit.name, salario: edit.salario, context: edit.context, objetivo: edit.objetivo, dimensions: edit.dimensions, quick_fields: edit.quick_fields }
      const r = await fetch('/api/rh/roles', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error((j.error || 'Error') + (j.detail ? ` (${j.detail})` : ''))
      setEdit(null); await load(); onChange()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }
  const del = async (r: RoleFull) => { if (!confirm(`¿Borrar el rol "${r.name}"?`)) return; await fetch(`/api/rh/roles?id=${encodeURIComponent(r.key)}`, { method: 'DELETE', headers: hdr }); await load(); onChange() }

  const setD = (i: number, patch: Partial<{ label: string; desc: string }>) => setEdit((e) => e ? { ...e, dimensions: e.dimensions.map((d, idx) => idx === i ? { ...d, ...patch } : d) } : e)
  const setQ = (i: number, patch: Partial<RoleFull['quick_fields'][number]>) => setEdit((e) => e ? { ...e, quick_fields: e.quick_fields.map((q, idx) => idx === i ? { ...q, ...patch } : q) } : e)

  return (
    <div style={{ background: BONE, border: `2px solid ${INK}`, borderRadius: 16, padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 18, margin: 0 }}>Roles</h3>
        <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 18, color: SOFT }}>✕</button>
      </div>

      {!edit && (
        <>
          {!roles ? <Muted>Cargando…</Muted> : roles.map((r) => (
            <div key={r.key} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${LINE}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 15 }}>{r.name}</b>
                <div style={{ fontSize: 12.5, color: SOFT }}>{r.salario || 'sin sueldo'} · {r.dimensions.length} características · {r.quick_fields.length} datos</div>
              </div>
              <button onClick={() => setEdit(structuredClone(r))} style={btn}>Editar</button>
              {/^[0-9a-f-]{36}$/i.test(r.key) && <button onClick={() => del(r)} style={{ ...btn, color: '#B4451A', borderColor: '#E0A99A' }}>Borrar</button>}
            </div>
          ))}
          <button onClick={() => setEdit(structuredClone(ROLE_BLANK))} style={{ ...btn, background: LIME, marginTop: 12 }}>＋ Nuevo rol</button>
          <p style={{ fontSize: 11.5, color: SOFT, marginTop: 10 }}>Si aún ves solo un rol y no puedes borrarlo, es el de respaldo: guárdalo una vez (Editar → Guardar) para volverlo editable, o corre el SQL de <code>interview_roles</code>.</p>
        </>
      )}

      {edit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Fld label="Nombre del rol"><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Ej. Campo y operación" style={inp} /></Fld>
          <Fld label="Rango de sueldo"><input value={edit.salario} onChange={(e) => setEdit({ ...edit, salario: e.target.value })} placeholder="Ej. $500 por día + transporte (~$11–13k al mes)" style={inp} /></Fld>
          <Fld label="Contexto del puesto (qué es, qué hace)"><textarea value={edit.context} onChange={(e) => setEdit({ ...edit, context: e.target.value })} rows={4} style={{ ...inp, resize: 'vertical', fontFamily: "'DM Sans',sans-serif" }} /></Fld>
          <Fld label="Objetivo de la entrevista"><textarea value={edit.objetivo} onChange={(e) => setEdit({ ...edit, objetivo: e.target.value })} rows={2} style={{ ...inp, resize: 'vertical', fontFamily: "'DM Sans',sans-serif" }} /></Fld>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: SOFT, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Características a medir</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {edit.dimensions.map((d, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 6 }}>
                  <input value={d.label} onChange={(e) => setD(i, { label: e.target.value })} placeholder="Nombre (ej. Aguante)" style={{ ...inp, fontSize: 13 }} />
                  <input value={d.desc} onChange={(e) => setD(i, { desc: e.target.value })} placeholder="Qué significa" style={{ ...inp, fontSize: 13 }} />
                  <button onClick={() => setEdit({ ...edit, dimensions: edit.dimensions.filter((_, idx) => idx !== i) })} style={{ ...btn, padding: '6px 10px', color: '#B4451A' }}>×</button>
                </div>
              ))}
              <button onClick={() => setEdit({ ...edit, dimensions: [...edit.dimensions, { label: '', desc: '' }] })} style={{ ...btn, alignSelf: 'flex-start' }}>＋ característica</button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: SOFT, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Datos rápidos (formulario)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {edit.quick_fields.map((q, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr auto auto auto', gap: 6, alignItems: 'center' }}>
                  <input value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} placeholder="Pregunta del formulario" style={{ ...inp, fontSize: 13 }} />
                  <select value={q.type} onChange={(e) => setQ(i, { type: e.target.value })} style={{ ...inp, fontSize: 13, width: 'auto' }}><option value="text">texto</option><option value="number">número</option><option value="select">opciones</option></select>
                  <label style={{ fontSize: 12, color: SOFT, display: 'flex', gap: 4, alignItems: 'center', whiteSpace: 'nowrap' }}><input type="checkbox" checked={!!q.required} onChange={(e) => setQ(i, { required: e.target.checked })} />oblig.</label>
                  <button onClick={() => setEdit({ ...edit, quick_fields: edit.quick_fields.filter((_, idx) => idx !== i) })} style={{ ...btn, padding: '6px 10px', color: '#B4451A' }}>×</button>
                  {q.type === 'select' && <input value={(q.options || []).join(', ')} onChange={(e) => setQ(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Opciones separadas por coma" style={{ ...inp, fontSize: 13, gridColumn: '1 / -1' }} />}
                </div>
              ))}
              <button onClick={() => setEdit({ ...edit, quick_fields: [...edit.quick_fields, { label: '', type: 'text', required: false }] })} style={{ ...btn, alignSelf: 'flex-start' }}>＋ dato rápido</button>
            </div>
          </div>

          {msg && <p style={{ color: '#B4451A', fontSize: 13 }}>⚠ {msg}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={busy} style={{ ...btn, background: INK, color: LIME }}>{busy ? 'Guardando…' : 'Guardar rol'}</button>
            <button onClick={() => { setEdit(null); setMsg('') }} style={btn}>Cancelar</button>
          </div>
        </div>
      )}
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

  // Un intento de generación. Devuelve la respuesta o lanza error.
  const generarUnaVez = async (cvText: string) => {
    const r = await fetch('/api/rh/generar', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, cvText, roleKey }) })
    const j = await r.json()
    if (!r.ok || !j.ok) { const err = new Error(j.error || 'Error generando'); (err as { saturado?: boolean }).saturado = /satur|límite|limit|429/i.test(String(j.error) + String(j.detail || '')); throw err }
    return j
  }

  const onCV = async (file: File | undefined) => {
    if (!file) return
    setCvBusy(true); setCvMsg(''); setPerfil(''); setDuda('')
    let cvText = ''
    try {
      cvText = await extractPdf(file)
      if (cvText.length < 40) throw new Error('el CV no trae texto legible (¿es imagen escaneada?)')
    } catch (e) { setCvMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')); setCvBusy(false); return }

    // Cola: si la IA se satura, reintenta cada 60s hasta 4 veces.
    const MAX = 4
    for (let intento = 1; intento <= MAX; intento++) {
      try {
        const j = await generarUnaVez(cvText)
        setPerfil(j.perfil || ''); setDuda(j.duda || '')
        if (j.nombre && !name.trim()) setName(j.nombre)
        if (j.telefono && !phone.trim()) setPhone(j.telefono)
        const ai: QEdit[] = (j.questions as { text: string; rubric: Record<string, string> }[]).map((q) => ({ text: q.text, r1: q.rubric['1'] || '', r2: q.rubric['2'] || '', r3: q.rubric['3'] || '' }))
        setQs(ai)
        const detectado = [j.nombre && 'nombre', j.telefono && 'teléfono'].filter(Boolean).join(' y ')
        setCvMsg(`✓ ${ai.length} preguntas generadas${detectado ? ` · detecté ${detectado} del CV` : ''}. Revisa y ajusta antes de crear.`)
        setCvBusy(false); return
      } catch (e) {
        const sat = e instanceof Error && (e as { saturado?: boolean }).saturado
        if (sat && intento < MAX) {
          for (let s = 60; s > 0; s--) { setCvMsg(`⏳ IA saturada. En cola, reintento en ${s}s… (intento ${intento}/${MAX - 1})`); await new Promise((res) => setTimeout(res, 1000)) }
          continue
        }
        setCvMsg('⚠ ' + (e instanceof Error ? e.message : 'Error') + (sat ? ' — sigue saturada, intenta más tarde.' : ''))
        setCvBusy(false); return
      }
    }
    setCvBusy(false)
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
  const [analyzing, setAnalyzing] = useState(false); const [anMsg, setAnMsg] = useState('')
  const load = useCallback(async () => { const r = await fetch(`/api/rh/invites/${id}`, { headers: hdr }); const j = await r.json(); if (j.ok) setD(j as Detail) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  // Corre una acción de IA con cola: si se satura, reintenta cada 60s (hasta 4).
  // apply(j) muestra el resultado al instante (aunque no persista todavía).
  const runCola = async (endpoint: string, setBusy: (b: boolean) => void, setMsg: (m: string) => void, apply: (j: Record<string, unknown>) => void) => {
    setBusy(true); setMsg('')
    for (let intento = 1; intento <= 4; intento++) {
      try {
        const r = await fetch(endpoint, { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ inviteId: id }) })
        const j = await r.json()
        if (!r.ok || !j.ok) { const e = new Error(j.error || 'Error') as Error & { sat?: boolean }; e.sat = /satur|límite|429|limit|rate/i.test(String(j.error) + String(j.detail || '')); throw e }
        apply(j)
        if (j.saved !== false) onChange() // refresca la fila/lista con la nueva calificación
        setMsg(j.saved === false ? '⚠ Se generó pero NO se guardó: falta correr el SQL de columnas (analysis). Se ve ahora pero no persiste.' : '')
        setBusy(false); return
      } catch (e) {
        const sat = e instanceof Error && (e as { sat?: boolean }).sat
        if (sat && intento < 4) { for (let s = 60; s > 0; s--) { setMsg(`⏳ En cola, reintento en ${s}s… (${intento}/3)`); await new Promise((res) => setTimeout(res, 1000)) } continue }
        setMsg((e instanceof Error ? e.message : 'Error') + (sat ? ' — sigue saturada.' : '')); setBusy(false); return
      }
    }
    setBusy(false)
  }
  const analyze = () => runCola('/api/rh/analizar', setAnalyzing, setAnMsg, (j) => setD((prev) => prev ? { ...prev, analysis: (j.analysis as Analysis) ?? prev.analysis } : prev))
  const [calificando, setCalificando] = useState(false); const [calMsg, setCalMsg] = useState('')
  const calificar = () => runCola('/api/rh/calificar', setCalificando, setCalMsg, (j) => setD((prev) => prev ? { ...prev, analysis: { ...(prev.analysis || {}), calificacion: j.calificacion as Calificacion } } : prev))
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
        {(() => {
          const cal = d.analysis?.calificacion; const aiDims = cal?.dimensiones || []
          if (aiDims.length) {
            const aiTotal = aiDims.reduce((a, x) => a + (x.score || 0), 0)
            return (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 30, lineHeight: 1 }}>{aiTotal}<span style={{ color: SOFT, fontSize: 18 }}>/{aiDims.length * 3}</span></div>
                {cal!.recomendacion && <div style={{ marginTop: 8 }}><Badge {...recBadge(cal!.recomendacion)} /></div>}
                <div style={{ marginTop: 4, fontSize: 10, color: SOFT, fontFamily: MONO }}>según la IA</div>
              </div>
            )
          }
          return (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 30, lineHeight: 1 }}>{d.total}<span style={{ color: SOFT, fontSize: 18 }}>/{d.maxTotal}</span></div>
              {d.label ? <div style={{ marginTop: 8 }}><Badge {...LBL[d.label]} /></div> : <div style={{ marginTop: 8, fontSize: 12, color: SOFT, fontFamily: MONO }}>Falta calificar</div>}
            </div>
          )
        })()}
      </div>

      {/* calificación IA */}
      <CalificacionIA cal={d.analysis?.calificacion || null} calificando={calificando} onCalificar={calificar} calMsg={calMsg} />

      {/* señales */}
      <Senales d={d} analyzing={analyzing} onAnalyze={analyze} anMsg={anMsg} />

      {/* preguntas */}
      {d.questions.map((q) => {
        const ap = (d.analysis?.porPregunta || []).find((x) => x.order === q.order)
        const absol = (d.analysis?.frasesAbsolutas || []).filter((x) => x.order === q.order).map((x) => x.cita)
        return (
        <div key={q.order} style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: EMBER, marginBottom: 4 }}>Pregunta {q.order}</div>
          <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 16, marginBottom: 10, lineHeight: 1.2 }}>{q.text}</div>
          {q.audioUrl ? <audio controls src={q.audioUrl} style={{ width: '100%', marginBottom: 10 }} /> : <p style={{ fontSize: 13, color: SOFT, margin: '0 0 10px' }}>Sin audio todavía.</p>}
          {(q.metrics || ap || q.retakes > 0) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {q.metrics && <><Chip>{q.metrics.durationSec}s{q.metrics.pctMax != null ? ` · ${q.metrics.pctMax}% del máx` : ''}</Chip><Chip>{q.metrics.wpm} ppm</Chip><Chip>{q.metrics.fillersPerMin}/min muletillas</Chip>{q.metrics.longPauses > 0 && <Chip>{q.metrics.longPauses} pausas &gt;2s</Chip>}<Chip>arranque {q.metrics.initialPauseSec}s</Chip></>}
              {q.retakes > 0 && <Chip warn>{q.retakes} regrabaciones</Chip>}
              {ap && <Chip>concreción {ap.concrecion}/3</Chip>}
              {ap && <Chip warn={ap.contesto !== 'Sí'}>contestó: {ap.contesto}</Chip>}
            </div>
          )}
          {q.metrics?.acoustic && (
            <p style={{ fontSize: 12, color: q.metrics.acoustic.noisy ? '#B4451A' : SOFT, margin: '0 0 8px', fontFamily: MONO }}>
              🔊 {acousticLine(q.metrics.acoustic)}{q.metrics.acoustic.noisy ? ' · Audio con ruido: métricas poco confiables' : ''}
            </p>
          )}
          {ap && ap.contesto !== 'Sí' && ap.porque && <p style={{ fontSize: 12, color: '#B4451A', margin: '0 0 8px' }}>↳ {ap.porque}</p>}
          {q.transcript && <p style={{ fontSize: 13, lineHeight: 1.5, color: INK, background: PAPER, borderRadius: 10, padding: '10px 12px', margin: '0 0 10px', whiteSpace: 'pre-wrap' }}><span style={{ fontFamily: MONO, fontSize: 10, color: SOFT, textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 4 }}>Transcripción</span>{highlightPhrases(q.transcript, absol)}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3].map((n) => (
              <button key={n} onClick={() => saveScore(q.order, { score: n })} style={{ flex: '1 1 150px', textAlign: 'left', border: `1.5px solid ${q.score === n ? INK : LINE}`, background: q.score === n ? INK : BONE, color: q.score === n ? BONE : INK, borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontSize: 13, lineHeight: 1.3 }}>
                <b style={{ fontFamily: SYNE, fontSize: 15, color: q.score === n ? LIME : EMBER }}>{n}</b> · {q.rubric[String(n)]}
              </button>
            ))}
          </div>
          <textarea defaultValue={q.note} onBlur={(e) => { if (e.target.value !== q.note) saveScore(q.order, { note: e.target.value }) }} placeholder="Nota (opcional)…" rows={2} style={{ ...inp, marginTop: 8, resize: 'vertical', fontFamily: "'DM Sans',sans-serif" }} />
        </div>
      ) })}

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
function Chip({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return <span style={{ fontFamily: MONO, fontSize: 11, padding: '3px 8px', borderRadius: 6, border: `1px solid ${warn ? '#E0A99A' : LINE}`, background: warn ? '#FFE6DA' : PAPER, color: warn ? '#B4451A' : SOFT, whiteSpace: 'nowrap' }}>{children}</span>
}

// Resalta (en <mark>) las frases citadas dentro de una transcripción.
function highlightPhrases(text: string, phrases: string[]): React.ReactNode {
  if (!phrases.length) return text
  const found = phrases.map((p) => p.trim()).filter((p) => p.length > 3 && text.toLowerCase().includes(p.toLowerCase()))
  if (!found.length) return text
  const re = new RegExp('(' + found.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi')
  const parts = text.split(re)
  return parts.map((part, i) => found.some((p) => p.toLowerCase() === part.toLowerCase())
    ? <mark key={i} style={{ background: '#FFE6DA', color: '#B4451A', padding: '0 2px', borderRadius: 3 }}>{part}</mark>
    : <span key={i}>{part}</span>)
}

// Descripción del SONIDO (no emociones ni estados de ánimo), a partir de números.
function acousticLine(a: Acoustic): string {
  const energy = a.energy0100 > 22 ? 'Energía alta' : a.energy0100 > 9 ? 'Energía media' : 'Energía baja'
  const tono = a.pitchSemitoneRange > 7 ? 'tono muy variado' : a.pitchSemitoneRange > 3 ? 'tono variado' : 'tono plano'
  const [t1, , t3] = a.energyThirds || [0, 0, 0]
  const ritmo = t3 > t1 * 1.15 ? 'sube al final' : t3 < t1 * 0.85 ? 'se apaga al final' : 'se mantiene'
  const arranque = a.onsetSec < 1 ? 'arranque rápido' : a.onsetSec < 2.5 ? 'arranque normal' : 'arranque lento'
  return `${energy} · ${tono} · ${ritmo} · ${arranque}`
}
function fmtDur(ms: number | null): string { if (ms == null || ms < 0) return '—'; const m = Math.floor(ms / 60000), s = Math.round((ms % 60000) / 1000); return m ? `${m}m ${s}s` : `${s}s` }
function avgOf(xs: (number | null | undefined)[]): number | null { const v = xs.filter((x): x is number => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null }

function CalificacionIA({ cal, calificando, onCalificar, calMsg }: { cal: Calificacion | null; calificando: boolean; onCalificar: () => void; calMsg: string }) {
  const rec = cal?.recomendacion || ''
  const recColor = /LLAMADA/i.test(rec) ? { bg: '#D9F2E4', c: OK } : /REVISAR/i.test(rec) ? { bg: '#FFE6DA', c: '#B4451A' } : { bg: PAPER, c: SOFT }
  return (
    <div style={{ border: `2px solid ${INK}`, borderRadius: 14, padding: 14, background: BONE }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: cal ? 10 : 0, flexWrap: 'wrap' }}>
        <b style={{ fontFamily: SYNE, fontSize: 16 }}>Calificación IA</b>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {rec && <Badge t={rec} bg={recColor.bg} c={recColor.c} />}
          <button onClick={onCalificar} disabled={calificando} style={{ ...btn, background: INK, color: LIME, opacity: calificando ? 0.5 : 1 }}>{calificando ? 'Calificando…' : cal ? 'Re-calificar' : 'Calificar con IA'}</button>
        </div>
      </div>
      {calMsg && <p style={{ fontSize: 12, color: '#B4451A', margin: '6px 0 0' }}>⚠ {calMsg}</p>}
      {cal && (
        <>
          {cal.dimensiones && cal.dimensiones.length > 0 && (
            <div style={{ display: 'grid', gap: 4, marginBottom: 10 }}>
              {cal.dimensiones.map((dm, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'baseline', fontSize: 13 }}>
                  <b style={{ fontFamily: MONO, color: dm.score >= 3 ? OK : dm.score <= 1 ? '#B4451A' : EMBER }}>{dm.score}/3</b>
                  <span><b>{dm.label}:</b> <span style={{ color: SOFT }}>{dm.nota}</span></span>
                </div>
              ))}
            </div>
          )}
          {cal.perfil && <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: '0 0 8px' }}><b>Fortalezas:</b> {cal.perfil}</p>}
          {cal.superpoder?.dimension && <p style={{ fontSize: 13.5, margin: '0 0 8px', background: PAPER, borderRadius: 8, padding: '8px 10px' }}>⚡ <b>Superpoder:</b> {cal.superpoder.dimension}{cal.superpoder.crecer ? ` → podría crecer a ${cal.superpoder.crecer}` : ''}</p>}
          {cal.banderas && cal.banderas.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{cal.banderas.map((b, i) => <Chip key={i} warn>🚩 {b}</Chip>)}</div>
          )}
          <p style={{ fontSize: 11.5, color: SOFT, fontStyle: 'italic', margin: '10px 0 0' }}>Sugerencia de la IA, no un veredicto. Tú decides.</p>
        </>
      )}
    </div>
  )
}

function Senales({ d, analyzing, onAnalyze, anMsg }: { d: Detail; analyzing: boolean; onAnalyze: () => void; anMsg: string }) {
  const withM = d.questions.filter((q) => q.metrics)
  const retakesTotal = d.questions.reduce((a, q) => a + (q.retakes || 0), 0)
  const fillersAvg = avgOf(withM.map((q) => q.metrics!.fillersPerMin))
  const concrAvg = avgOf((d.analysis?.porPregunta || []).map((p) => p.concrecion))
  const openMs = d.invite.first_opened_at ? new Date(d.invite.first_opened_at).getTime() - new Date(d.invite.invited_at).getTime() : null
  const complMs = d.invite.completed_at && d.invite.first_opened_at ? new Date(d.invite.completed_at).getTime() - new Date(d.invite.first_opened_at).getTime() : null
  const contras = d.analysis?.contradicciones || []
  const absol = d.analysis?.frasesAbsolutas || []
  const energySeries = d.questions.filter((q) => q.metrics?.acoustic).map((q) => ({ order: q.order, e: q.metrics!.acoustic!.energy0100, noisy: q.metrics!.acoustic!.noisy }))
  const tile = (label: string, value: string) => (
    <div style={{ background: BONE, border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 10px', minWidth: 92 }}>
      <div style={{ fontFamily: MONO, fontSize: 9.5, color: SOFT, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 18 }}>{value}</div>
    </div>
  )
  return (
    <div style={{ border: `1.5px solid ${INK}`, borderRadius: 14, padding: 14, background: PAPER }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <b style={{ fontFamily: SYNE, fontSize: 16 }}>Señales</b>
        <button onClick={onAnalyze} disabled={analyzing} style={{ ...btn, background: INK, color: LIME, opacity: analyzing ? 0.5 : 1 }}>{analyzing ? 'Analizando…' : d.analysis ? 'Re-analizar contenido' : 'Analizar contenido con IA'}</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {tile('Completó en', fmtDur(complMs))}
        {tile('Regrabaciones', String(retakesTotal))}
        {tile('Muletillas/min', fillersAvg != null ? fillersAvg.toFixed(1) : '—')}
        {tile('Concreción', concrAvg != null ? `${concrAvg.toFixed(1)}/3` : '—')}
      </div>
      <p style={{ fontSize: 12, color: SOFT, margin: '0 0 8px' }}>
        Abrió el link {openMs != null ? fmtDur(openMs) + ' después de la invitación' : '(sin registro)'}
        {d.invite.reminded_at && d.invite.completed_at && `; completó ${new Date(d.invite.completed_at) < new Date(d.invite.reminded_at) ? 'antes' : 'después'} del recordatorio`}.
      </p>
      {anMsg && <p style={{ fontSize: 12, color: '#B4451A', margin: '0 0 8px' }}>⚠ {anMsg}</p>}
      {energySeries.length > 1 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: SOFT, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Energía por pregunta (¿sube, se mantiene o se apaga?)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 44 }}>
            {energySeries.map((s) => (
              <div key={s.order} title={`P${s.order}: ${s.e}/100${s.noisy ? ' (con ruido)' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                <div style={{ width: '100%', maxWidth: 26, height: `${Math.max(4, s.e)}%`, background: s.noisy ? '#E0A99A' : INK, borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontFamily: MONO, fontSize: 9, color: SOFT }}>{s.order}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: SOFT, fontStyle: 'italic', margin: '6px 0 0' }}>El sonido depende del micrófono y del lugar. Escucha el audio antes de sacar conclusiones.</p>
        </div>
      )}
      {contras.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#B4451A', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Posibles contradicciones</div>
          {contras.map((c, i) => <p key={i} style={{ fontSize: 12.5, margin: '0 0 4px', lineHeight: 1.4 }}>«{c.cita1}» vs «{c.cita2}» — {c.nota}</p>)}
        </div>
      )}
      {absol.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: SOFT, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Frases absolutas o ensayadas</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{absol.map((a, i) => <Chip key={i} warn>«{a.cita}» (P{a.order})</Chip>)}</div>
        </div>
      )}
      <p style={{ fontSize: 11.5, color: SOFT, fontStyle: 'italic', margin: '8px 0 0', borderTop: `1px solid ${LINE}`, paddingTop: 8 }}>Estas señales son orientativas. Ninguna métrica por sí sola indica si alguien es buen o mal candidato.</p>
    </div>
  )
}

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

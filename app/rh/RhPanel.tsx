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
interface QDetail { order: number; text: string; rubric: Record<string, string>; audioUrl: string | null; duration: number | null; score: number | null; note: string }
interface Detail { invite: { id: string; name: string; phone: string | null; status: string; invited_at: string; completed_at: string | null }; quick: { label: string; value: string; knockout: boolean }[]; questions: QDetail[]; total: number; maxTotal: number; fullyScored: boolean; label: string | null; knockout: string[] }

export function RhPanel() {
  const [pw, setPw] = useState(''); const [authed, setAuthed] = useState(false); const [err, setErr] = useState('')
  const [tpl, setTpl] = useState<{ title: string; questions: number } | null>(null)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [sort, setSort] = useState<'fecha' | 'puntaje'>('fecha')
  const [openId, setOpenId] = useState<string | null>(null)
  const hdr = { 'x-admin-password': pw }

  const load = useCallback(async () => {
    setErr('')
    try {
      const r = await fetch('/api/rh/invites', { headers: hdr })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setTpl(j.template); setRows(j.invites as Row[]); setAuthed(true)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) }
  }, [pw]) // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = (rows ?? []).slice().sort((a, b) => sort === 'puntaje' ? (b.total - a.total) : (new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime()))

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
            <Invite hdr={hdr} onCreated={load} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '22px 0 10px' }}>
              <h2 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 20, margin: 0 }}>Candidatos {rows ? `(${rows.length})` : ''}</h2>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
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

function Invite({ hdr, onCreated }: { hdr: Record<string, string>; onCreated: () => void }) {
  const [name, setName] = useState(''); const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false); const [link, setLink] = useState<string | null>(null); const [nm, setNm] = useState('')
  const [msg, setMsg] = useState('')
  const create = async () => {
    if (!name.trim()) return
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/rh/invites', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone }) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      const l = `${window.location.origin}/entrevista/${j.token}`
      setLink(l); setNm(name); setName(''); setPhone(''); onCreated()
    } catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setBusy(false) }
  }
  const waMsg = link ? `Hola ${nm}, soy Santiago de Suuplai. Me encantaría conocerte con una mini-entrevista en audio que contestas desde tu celular cuando quieras (unos 10 min, sin instalar nada). Aquí está tu link personal:\n${link}` : ''
  return (
    <div style={{ background: BONE, border: `2px solid ${INK}`, borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr)) auto', gap: 10, alignItems: 'end' }}>
        <Fld label="Nombre del candidato"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="David T." style={inp} /></Fld>
        <Fld label="WhatsApp (opcional)"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="55…" style={inp} /></Fld>
        <button onClick={create} disabled={busy || !name.trim()} style={{ background: INK, color: LIME, border: 'none', borderRadius: 10, padding: '12px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: SYNE, opacity: busy || !name.trim() ? 0.5 : 1, height: 44 }}>Invitar</button>
      </div>
      {msg && <p style={{ color: '#B4451A', fontSize: 13, marginTop: 10 }}>{msg}</p>}
      {link && (
        <div style={{ marginTop: 14, background: PAPER, borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: 13, margin: '0 0 8px', color: SOFT }}>Link para <b>{nm}</b>:</p>
          <div style={{ fontFamily: MONO, fontSize: 13, wordBreak: 'break-all', marginBottom: 10 }}>{link}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { navigator.clipboard?.writeText(link) }} style={btn}>Copiar link</button>
            <button onClick={() => { navigator.clipboard?.writeText(waMsg) }} style={btn}>Copiar mensaje de WhatsApp</button>
            <a href={`https://wa.me/${(phone || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noreferrer" style={{ ...btn, background: LIME, textDecoration: 'none' }}>Abrir WhatsApp</a>
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

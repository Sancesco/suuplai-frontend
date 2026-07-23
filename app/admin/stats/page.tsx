'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'

const BG = '#0A0A0F', SURF = '#131319', LIME = '#E8FF47', EMBER = '#FF6B35'
const TEXT = '#F0EFE8', MUTED = '#8A8A94', LINE = '#26262f'
const SYNE = 'var(--font-syne), sans-serif'
const MONO = 'var(--font-space-mono), monospace'

const DEST_PRESETS = [
  { label: 'Inicio', path: '/' },
  { label: 'Agente Comercial', path: '/agente-comercial' },
  { label: 'Registro tienda', path: '/registro-tienda' },
  { label: 'Registro marca', path: '/registro-productor' },
]
const CATEGORIES = ['marca', 'tienda', 'inversionista', 'otro']

interface LinkRow {
  id: string; slug: string; destination: string; label: string | null; clicks: number
  notify: boolean; archived: boolean; category: string | null; notes: string | null
  created_at: string; first_click_at: string | null; lastVisit: string | null
  sessions: number; devices: number; cities: number; revisits: number; shared: boolean
  timeToFirstMs: number | null; temp: 'caliente' | 'tibio' | 'frio' | null
}
interface Sess { sessionId: string; device: string; city: string; first: string; last: string; seconds: number; repeat: boolean }
interface Stats {
  totals: { pageviews: number; visitors: number; demoClicks: number; stripeClicks: number }
  byDay: { date: string; visits: number; sessions: number }[]
  bySrc: { src: string; sessions: number; avgSeconds: number; scroll: number; demo: number }[]
  funnel: { stage: string; sessions: number }[]
  simulator: { total: number; perWeek: { value: number; count: number }[]; rate: { value: number; count: number }[] }
  scrollDepth: { depth: number; sessions: number }[]
  sectionTime: { section: string; avgSeconds: number }[]
  exitPoints: { section: string; count: number }[]
  hours: { hour: number; count: number }[]
  copyGroups: { destination: string; links: { slug: string; label: string | null; clicks: number; sessions: number; demo: number }[] }[]
  byCategory: { category: string; links: number; clicks: number; sessions: number; demo: number }[]
}

export default function StatsPage() {
  const [pw, setPw] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'stats' | 'links' | 'live'>('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const hdr = { 'x-admin-password': pw }

  const loadStats = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const r = await fetch('/api/stats', { headers: hdr })
      const j = await r.json()
      if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setStats(j as Stats); setAuthed(true)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); setAuthed(false) } finally { setLoading(false) }
  }, [pw]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, padding: '40px 24px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <h1 style={{ fontFamily: SYNE, fontSize: 28, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 }}>Analítica · Suuplai</h1>
        <p style={{ color: MUTED, fontSize: 14, marginBottom: 24 }}>Señales de compra, embudo, links y quién está en la página.</p>

        {!authed && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 420 }}>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadStats()} placeholder="Contraseña de admin"
              style={{ flex: 1, minWidth: 200, background: SURF, border: `1px solid ${LINE}`, borderRadius: 8, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
            <button onClick={loadStats} disabled={loading || !pw} style={{ background: LIME, color: BG, border: 'none', borderRadius: 8, padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: SYNE, opacity: loading || !pw ? 0.5 : 1 }}>
              {loading ? 'Cargando…' : 'Entrar'}
            </button>
          </div>
        )}
        {err && <p style={{ color: '#ff6b6b', marginTop: 12, fontSize: 14 }}>⚠ {err}</p>}

        {authed && (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${LINE}` }}>
              <Tab active={tab === 'stats'} onClick={() => setTab('stats')}>Analítica</Tab>
              <Tab active={tab === 'links'} onClick={() => setTab('links')}>Links</Tab>
              <Tab active={tab === 'live'} onClick={() => setTab('live')}>En vivo</Tab>
            </div>
            {tab === 'stats' && stats && <StatsView stats={stats} onRefresh={loadStats} />}
            {tab === 'links' && <LinksView hdr={hdr} />}
            {tab === 'live' && <LiveView hdr={hdr} />}
          </>
        )}
      </div>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${active ? LIME : 'transparent'}`, color: active ? TEXT : MUTED, padding: '10px 14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: SYNE, marginBottom: -1 }}>{children}</button>
}

// ── EN VIVO ───────────────────────────────────────────────────────────────────
function LiveView({ hdr }: { hdr: Record<string, string> }) {
  const [data, setData] = useState<{ count: number; sessions: { sessionId: string; src: string | null; path: string | null; city: string | null }[] } | null>(null)
  useEffect(() => {
    let alive = true
    const load = async () => { try { const r = await fetch('/api/live', { headers: hdr }); const j = await r.json(); if (alive && j.ok) setData(j) } catch { /* noop */ } }
    load(); const id = setInterval(load, 15000)
    return () => { alive = false; clearInterval(id) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Section title={`En la página ahora · ${data?.count ?? 0}`}>
      <p style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>Sesiones activas en los últimos 5 min (se actualiza cada 15s).</p>
      {!data || data.count === 0 ? <Empty text="Nadie ahora mismo." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.sessions.map((s) => (
            <div key={s.sessionId} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: LIME }} />
              <span style={{ color: s.src ? LIME : MUTED, fontFamily: MONO, minWidth: 90 }}>{s.src || 'directo'}</span>
              <span style={{ color: MUTED }}>{s.path}</span>
              <span style={{ color: MUTED, marginLeft: 'auto', fontSize: 12 }}>{s.city || ''}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

// ── LINKS ─────────────────────────────────────────────────────────────────────
function LinksView({ hdr }: { hdr: Record<string, string> }) {
  const [links, setLinks] = useState<LinkRow[] | null>(null)
  const [slug, setSlug] = useState(''); const [destination, setDestination] = useState('/agente-comercial')
  const [label, setLabel] = useState(''); const [category, setCategory] = useState(''); const [notes, setNotes] = useState('')
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  const [q, setQ] = useState(''); const [clicksF, setClicksF] = useState(''); const [catF, setCatF] = useState(''); const [unseen, setUnseen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null); const [detail, setDetail] = useState<{ sessions: Sess[]; notes: string } | null>(null)

  const reload = useCallback(async () => {
    const p = new URLSearchParams()
    if (q) p.set('q', q); if (clicksF) p.set('clicks', clicksF); if (catF) p.set('category', catF)
    const r = await fetch('/api/links?' + p.toString(), { headers: hdr })
    const j = await r.json(); if (j.ok) setLinks(j.links as LinkRow[])
  }, [q, clicksF, catF]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { reload() }, [reload])

  const create = async () => {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/links', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, destination, label, category, notes }) })
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'Error')
      setSlug(''); setLabel(''); setNotes(''); setCategory(''); setDestination('/agente-comercial'); setMsg('✓ Link creado'); reload()
    } catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setBusy(false) }
  }
  const patch = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/api/links/${id}`, { method: 'PATCH', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); reload()
  }
  const copy = (s: string) => { const u = `${window.location.origin}/r/${s}`; navigator.clipboard?.writeText(u); setMsg('✓ Copiado: ' + u) }
  const openDetail = async (l: LinkRow) => {
    if (openId === l.id) { setOpenId(null); return }
    setOpenId(l.id); setDetail(null)
    const r = await fetch(`/api/links/${l.id}`, { headers: hdr }); const j = await r.json()
    if (j.ok) setDetail({ sessions: j.sessions as Sess[], notes: (j.link.notes as string) || '' })
  }
  const exportCsv = async (type: 'links' | 'events') => {
    const r = await fetch(`/api/export?type=${type}`, { headers: hdr }); const blob = await r.blob()
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `suuplai-${type}.csv`; a.click()
  }

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—')
  const speed = (l: LinkRow) => l.timeToFirstMs == null ? '—' : l.timeToFirstMs < 3600000 ? `${Math.round(l.timeToFirstMs / 60000)}min` : l.timeToFirstMs < 86400000 ? `${Math.round(l.timeToFirstMs / 3600000)}h` : `${Math.round(l.timeToFirstMs / 86400000)}d`
  const tempColor = (t: LinkRow['temp']) => t === 'caliente' ? '#ff5a3c' : t === 'tibio' ? EMBER : t === 'frio' ? '#5aa9ff' : MUTED

  const now = Date.now()
  const shown = (links ?? []).filter((l) => !unseen || (l.clicks === 0 && now - new Date(l.created_at).getTime() > 2 * 86400000))

  return (
    <>
      <Section title="Crear link de seguimiento">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 10, alignItems: 'start' }}>
          <Fld label="Slug"><input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="capicua" style={inp} /></Fld>
          <Fld label="Destino">
            <input value={destination} onChange={(e) => setDestination(e.target.value)} style={inp} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {DEST_PRESETS.map((d) => <button key={d.path} type="button" onClick={() => setDestination(d.path)} style={{ ...chip, ...(destination === d.path ? chipOn : {}) }}>{d.label}</button>)}
            </div>
          </Fld>
          <Fld label="Categoría">
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inp}>
              <option value="">—</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Fld>
          <Fld label="Etiqueta"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Capicua - propuesta julio" style={inp} /></Fld>
          <Fld label="Notas"><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="contexto…" style={inp} /></Fld>
          <button onClick={create} disabled={busy || !slug} style={{ background: LIME, color: BG, border: 'none', borderRadius: 8, padding: '11px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: SYNE, opacity: busy || !slug ? 0.5 : 1, alignSelf: 'end' }}>Crear</button>
        </div>
        {msg && <p style={{ marginTop: 12, fontSize: 13, color: msg.startsWith('✓') ? LIME : '#ff6b6b' }}>{msg}</p>}
      </Section>

      <Section title="Links">
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar slug/etiqueta…" style={{ ...inp, maxWidth: 220 }} />
          <select value={clicksF} onChange={(e) => setClicksF(e.target.value)} style={{ ...inp, maxWidth: 150 }}>
            <option value="">Todos</option><option value="con">Con clics</option><option value="sin">Sin clics</option>
          </select>
          <select value={catF} onChange={(e) => setCatF(e.target.value)} style={{ ...inp, maxWidth: 150 }}>
            <option value="">Toda categoría</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setUnseen(!unseen)} style={{ ...chip, ...(unseen ? chipOn : {}) }}>Sin abrir +48h</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={() => exportCsv('links')} style={chip}>⬇ CSV links</button>
            <button onClick={() => exportCsv('events')} style={chip}>⬇ CSV eventos</button>
          </div>
        </div>

        {!links ? <Empty text="Cargando…" /> : shown.length === 0 ? <Empty text="Sin links." /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr style={{ color: MUTED, textAlign: 'left' }}>
                <Th>slug</Th><Th>etiq.</Th><Th>cat</Th><Th>clics</Th><Th>ses.</Th><Th>disp.</Th><Th>ciud.</Th><Th>rev.</Th><Th>vel.</Th><Th>última</Th><Th>🔔</Th><Th></Th>
              </tr></thead>
              <tbody>
                {shown.map((l) => (
                  <Fragment key={l.id}>
                    <tr style={{ borderTop: `1px solid ${LINE}`, opacity: l.archived ? 0.45 : 1 }}>
                      <Td><span style={{ color: LIME, fontFamily: MONO }}>/r/{l.slug}</span>{l.shared && <span title="posiblemente compartido (2+ dispositivos)"> 🔗</span>}</Td>
                      <Td>{l.label || '—'}</Td>
                      <Td>{l.category ? <span style={{ fontSize: 10, background: '#23231d', color: LIME, padding: '2px 6px', borderRadius: 4 }}>{l.category}</span> : '—'}</Td>
                      <Td mono>{l.clicks}</Td>
                      <Td mono>{l.sessions}</Td>
                      <Td mono>{l.devices}</Td>
                      <Td mono>{l.cities}</Td>
                      <Td mono>{l.revisits}</Td>
                      <Td><span style={{ color: tempColor(l.temp), fontFamily: MONO }}>{speed(l)}</span></Td>
                      <Td mono>{fmt(l.lastVisit)}</Td>
                      <Td><button onClick={() => patch(l.id, { notify: !l.notify })} title={l.notify ? 'Alertas ON' : 'OFF'} style={{ ...btnSm, borderColor: l.notify ? LIME : LINE, color: l.notify ? LIME : MUTED }}>{l.notify ? '🔔' : '🔕'}</button></Td>
                      <Td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openDetail(l)} style={btnSm}>{openId === l.id ? '▲' : 'Ver'}</button>
                          <button onClick={() => copy(l.slug)} style={btnSm}>Copiar</button>
                          {!l.archived && <button onClick={() => patch(l.id, { archived: true })} style={{ ...btnSm, color: '#ff8a8a' }}>Arch.</button>}
                        </div>
                      </Td>
                    </tr>
                    {openId === l.id && (
                      <tr style={{ background: '#0d0d13' }}>
                        <td colSpan={12} style={{ padding: 16 }}>
                          <LinkDetail link={l} detail={detail} onSaveNotes={(n) => patch(l.id, { notes: n })} onSaveCat={(c) => patch(l.id, { category: c })} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  )
}

function LinkDetail({ link, detail, onSaveNotes, onSaveCat }: { link: LinkRow; detail: { sessions: Sess[]; notes: string } | null; onSaveNotes: (n: string) => void; onSaveCat: (c: string) => void }) {
  const [draft, setDraft] = useState(detail?.notes ?? link.notes ?? '')
  useEffect(() => { setDraft(detail?.notes ?? link.notes ?? '') }, [detail]) // eslint-disable-line react-hooks/exhaustive-deps
  const fmt = (iso: string) => new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={lbl}>Notas</label>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
        </div>
        <button onClick={() => onSaveNotes(draft)} style={{ ...btnSm, borderColor: LIME, color: LIME }}>Guardar notas</button>
        <div>
          <label style={lbl}>Categoría</label>
          <select defaultValue={link.category || ''} onChange={(e) => onSaveCat(e.target.value)} style={{ ...inp, minWidth: 130 }}>
            <option value="">—</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Sesiones ({detail?.sessions.length ?? '…'})</p>
        {!detail ? <Empty text="Cargando…" /> : detail.sessions.length === 0 ? <Empty text="Sin sesiones (aún nadie llegó a la landing por este link)." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {detail.sessions.map((s) => (
              <div key={s.sessionId} style={{ display: 'flex', gap: 12, fontSize: 12.5, alignItems: 'center' }}>
                <span style={{ width: 60, color: s.repeat ? MUTED : LIME, fontFamily: MONO }}>{s.repeat ? 'repite' : 'nueva'}</span>
                <span style={{ color: MUTED, minWidth: 120 }}>{fmt(s.first)}</span>
                <span>{s.device}</span>
                <span style={{ color: MUTED }}>{s.city}</span>
                <span style={{ marginLeft: 'auto', fontFamily: MONO, color: MUTED }}>{s.seconds}s</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ANALÍTICA ─────────────────────────────────────────────────────────────────
function StatsView({ stats, onRefresh }: { stats: Stats; onRefresh: () => void }) {
  const SEC_LABEL: Record<string, string> = { hero: 'Hero', problema: 'Problema', como: 'Cómo funciona', retorno: 'Retorno', precio: 'Precio', cta: 'CTA final' }
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        <Kpi label="Vistas" value={stats.totals.pageviews} />
        <Kpi label="Visitantes" value={stats.totals.visitors} accent={LIME} />
        <Kpi label="Clic demo" value={stats.totals.demoClicks} accent={EMBER} />
        <Kpi label="Clic Stripe" value={stats.totals.stripeClicks} accent={EMBER} />
        <button onClick={onRefresh} style={{ background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>↻ Refrescar</button>
      </div>

      <Section title="Visitas y sesiones por día (30d)">
        {stats.byDay.length === 0 ? <Empty /> : (() => { const max = Math.max(1, ...stats.byDay.map((d) => d.visits)); return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.byDay.map((d) => (
              <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 82, fontSize: 12, color: MUTED, fontFamily: MONO, textAlign: 'right' }}>{d.date}</span>
                <div style={{ flex: 1, height: 16, background: '#1a1a22', borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(d.visits / max) * 100}%`, background: LIME }} /></div>
                <span style={{ width: 96, fontSize: 12, color: TEXT, fontFamily: MONO }}>{d.visits}v · {d.sessions}s</span>
              </div>
            ))}
          </div>
        ) })()}
      </Section>

      <Section title="Por fuente (src)">
        {stats.bySrc.length === 0 ? <Empty /> : (
          <TableWrap head={['src', 'sesiones', 'tiempo prom.', 'llegó a precio', 'clic demo']}>
            {stats.bySrc.map((r) => <tr key={r.src} style={{ borderTop: `1px solid ${LINE}` }}><Td><span style={{ color: r.src === 'directo' ? MUTED : LIME }}>{r.src}</span></Td><Td mono>{r.sessions}</Td><Td mono>{r.avgSeconds}s</Td><Td mono>{r.scroll}</Td><Td mono>{r.demo}</Td></tr>)}
          </TableWrap>
        )}
      </Section>

      <Section title="Embudo">
        {(() => { const top = stats.funnel[0]?.sessions || 0; return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.funnel.map((s) => { const pct = top ? Math.round((s.sessions / top) * 100) : 0; return (
              <div key={s.stage}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span style={{ fontFamily: MONO }}>{s.stage}</span><span style={{ color: MUTED, fontFamily: MONO }}>{s.sessions} · {pct}%</span></div><Bar pct={pct} color={EMBER} /></div>
            ) })}
          </div>
        ) })()}
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 20 }}>
        <Section title="Profundidad de scroll">
          {(() => { const max = Math.max(1, ...stats.scrollDepth.map((d) => d.sessions)); return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.scrollDepth.map((d) => <Row key={d.depth} label={`${d.depth}%`} value={d.sessions} pct={(d.sessions / max) * 100} color={LIME} />)}
            </div>
          ) })()}
        </Section>
        <Section title="Punto de salida">
          {stats.exitPoints.length === 0 ? <Empty /> : (() => { const max = Math.max(1, ...stats.exitPoints.map((d) => d.count)); return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.exitPoints.map((d) => <Row key={d.section} label={SEC_LABEL[d.section] || d.section} value={d.count} pct={(d.count / max) * 100} color={EMBER} />)}
            </div>
          ) })()}
        </Section>
      </div>

      <Section title="Tiempo por sección (promedio)">
        {stats.sectionTime.length === 0 ? <Empty /> : (() => { const max = Math.max(1, ...stats.sectionTime.map((d) => d.avgSeconds)); return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.sectionTime.map((d) => <Row key={d.section} label={SEC_LABEL[d.section] || d.section} value={`${d.avgSeconds}s`} pct={(d.avgSeconds / max) * 100} color={LIME} />)}
          </div>
        ) })()}
      </Section>

      <Section title="Mejor hora de apertura (CDMX)">
        {(() => { const max = Math.max(1, ...stats.hours.map((h) => h.count)); return (
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 90 }}>
            {stats.hours.map((h) => (
              <div key={h.hour} title={`${h.hour}:00 · ${h.count}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: `${(h.count / max) * 70}px`, background: h.count ? EMBER : '#1a1a22', borderRadius: 2 }} />
                <span style={{ fontSize: 9, color: MUTED, fontFamily: MONO }}>{h.hour}</span>
              </div>
            ))}
          </div>
        ) })()}
      </Section>

      {stats.copyGroups.length > 0 && (
        <Section title="Comparación de copys (mismo destino)">
          {stats.copyGroups.map((g) => (
            <div key={g.destination} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: MUTED, marginBottom: 6, fontFamily: MONO }}>{g.destination}</p>
              <TableWrap head={['link', 'clics', 'sesiones', 'clic demo']}>
                {g.links.map((l) => <tr key={l.slug} style={{ borderTop: `1px solid ${LINE}` }}><Td>{l.label || l.slug}</Td><Td mono>{l.clicks}</Td><Td mono>{l.sessions}</Td><Td mono>{l.demo}</Td></tr>)}
              </TableWrap>
            </div>
          ))}
        </Section>
      )}

      <Section title="Por categoría de destinatario">
        {stats.byCategory.length === 0 ? <Empty /> : (
          <TableWrap head={['categoría', 'links', 'clics', 'sesiones', 'clic demo']}>
            {stats.byCategory.map((c) => <tr key={c.category} style={{ borderTop: `1px solid ${LINE}` }}><Td>{c.category}</Td><Td mono>{c.links}</Td><Td mono>{c.clicks}</Td><Td mono>{c.sessions}</Td><Td mono>{c.demo}</Td></tr>)}
          </TableWrap>
        )}
      </Section>

      <Section title={`Distribución del simulador (${stats.simulator.total})`}>
        {stats.simulator.total === 0 ? <Empty /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 24 }}>
            <Histogram title="Muestras / semana" items={stats.simulator.perWeek.map((d) => ({ label: String(d.value), value: d.count }))} color={LIME} />
            <Histogram title="Tasa de éxito (%)" items={stats.simulator.rate.map((d) => ({ label: `${d.value}%`, value: d.count }))} color={EMBER} />
          </div>
        )}
      </Section>
    </>
  )
}

// ── helpers UI ────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = { width: '100%', background: BG, border: `1px solid ${LINE}`, borderRadius: 8, padding: '10px 12px', color: TEXT, fontSize: 13, outline: 'none' }
const btnSm: React.CSSProperties = { background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, borderRadius: 6, padding: '4px 9px', fontSize: 12, cursor: 'pointer' }
const chip: React.CSSProperties = { background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, borderRadius: 999, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }
const chipOn: React.CSSProperties = { background: LIME, color: BG, borderColor: LIME, fontWeight: 700 }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: MUTED, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }

function Fld({ label, children }: { label: string; children: React.ReactNode }) { return <div><label style={lbl}>{label}</label>{children}</div> }
function Kpi({ label, value, accent = TEXT }: { label: string; value: number; accent?: string }) {
  return <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 12, padding: '16px 18px' }}><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div><div style={{ fontSize: 12, color: MUTED, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div></div>
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 12, padding: 20, marginBottom: 20 }}><h2 style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{title}</h2>{children}</div>
}
function Empty({ text = 'Sin datos todavía.' }: { text?: string }) { return <p style={{ color: '#666', fontSize: 13 }}>{text}</p> }
function Th({ children }: { children?: React.ReactNode }) { return <th style={{ padding: '8px 8px', fontWeight: 600, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{children}</th> }
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) { return <td style={{ padding: '8px 8px', fontFamily: mono ? MONO : undefined, whiteSpace: 'nowrap' }}>{children}</td> }
function TableWrap({ head, children }: { head: string[]; children: React.ReactNode }) {
  return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ color: MUTED, textAlign: 'left' }}>{head.map((h) => <Th key={h}>{h}</Th>)}</tr></thead><tbody>{children}</tbody></table></div>
}
function Bar({ pct, color }: { pct: number; color: string }) { return <div style={{ height: 20, background: '#1a1a22', borderRadius: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: color }} /></div> }
function Row({ label, value, pct, color }: { label: string; value: string | number; pct: number; color: string }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 96, fontSize: 12, color: '#bbb', textAlign: 'right', fontFamily: MONO }}>{label}</span><div style={{ flex: 1, height: 14, background: '#1a1a22', borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: color }} /></div><span style={{ width: 34, fontSize: 12, color: '#ddd', fontFamily: MONO }}>{value}</span></div>
}
function Histogram({ title, items, color }: { title: string; items: { label: string; value: number }[]; color: string }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return <div><p style={{ fontSize: 12, color: MUTED, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</p><div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{items.map((it) => <Row key={it.label} label={it.label} value={it.value} pct={(it.value / max) * 100} color={color} />)}</div></div>
}

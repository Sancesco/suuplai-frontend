'use client'

import { useState } from 'react'

const BG = '#0A0A0F'
const SURF = '#131319'
const LIME = '#E8FF47'
const EMBER = '#FF6B35'
const TEXT = '#F0EFE8'
const MUTED = '#8A8A94'
const LINE = '#26262f'
const SYNE = 'var(--font-syne), sans-serif'
const MONO = 'var(--font-space-mono), monospace'

// Destinos rápidos para los links (se puede escribir cualquier ruta a mano también).
const DEST_PRESETS = [
  { label: 'Inicio', path: '/' },
  { label: 'Agente Comercial', path: '/agente-comercial' },
  { label: 'Registro tienda', path: '/registro-tienda' },
  { label: 'Registro marca', path: '/registro-productor' },
]

interface Stats {
  totals: { pageviews: number; visitors: number; demoClicks: number; stripeClicks: number }
  byDay: { date: string; visits: number; sessions: number }[]
  bySrc: { src: string; sessions: number; avgSeconds: number; scroll: number; demo: number }[]
  funnel: { stage: string; sessions: number }[]
  simulator: { total: number; perWeek: { value: number; count: number }[]; rate: { value: number; count: number }[] }
}
interface LinkRow {
  id: string
  slug: string
  destination: string
  label: string | null
  clicks: number
  archived: boolean
  created_at: string
  lastVisit: string | null
}

export default function StatsPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'stats' | 'links'>('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [links, setLinks] = useState<LinkRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hdr = { 'x-admin-password': password }

  const loadStats = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/stats', { headers: hdr })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error')
      setStats(json as Stats); setAuthed(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error'); setAuthed(false)
    } finally { setLoading(false) }
  }

  const loadLinks = async () => {
    try {
      const res = await fetch('/api/links', { headers: hdr })
      const json = await res.json()
      if (res.ok && json.ok) setLinks(json.links as LinkRow[])
    } catch { /* noop */ }
  }

  const goLinks = () => { setTab('links'); if (!links) loadLinks() }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, padding: '40px 24px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ fontFamily: SYNE, fontSize: 28, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 }}>
          Analítica · Suuplai
        </h1>
        <p style={{ color: MUTED, fontSize: 14, marginBottom: 24 }}>Tráfico, embudo, simulador y links de seguimiento.</p>

        {!authed && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 420 }}>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadStats()} placeholder="Contraseña de admin"
              style={{ flex: 1, minWidth: 200, background: SURF, border: `1px solid ${LINE}`, borderRadius: 8, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
            />
            <button onClick={loadStats} disabled={loading || !password}
              style={{ background: LIME, color: BG, border: 'none', borderRadius: 8, padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading || !password ? 0.5 : 1, fontFamily: SYNE }}>
              {loading ? 'Cargando…' : 'Entrar'}
            </button>
          </div>
        )}
        {error && <p style={{ color: '#ff6b6b', marginTop: 12, fontSize: 14 }}>⚠ {error}</p>}

        {authed && (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${LINE}` }}>
              <Tab active={tab === 'stats'} onClick={() => setTab('stats')}>Stats</Tab>
              <Tab active={tab === 'links'} onClick={goLinks}>Links</Tab>
            </div>

            {tab === 'stats' && stats && <StatsView stats={stats} onRefresh={loadStats} />}
            {tab === 'links' && <LinksView links={links} reload={loadLinks} hdr={hdr} />}
          </>
        )}
      </div>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${active ? LIME : 'transparent'}`, color: active ? TEXT : MUTED, padding: '10px 14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: SYNE, marginBottom: -1 }}>
      {children}
    </button>
  )
}

// ── Stats ────────────────────────────────────────────────────────────────────
function StatsView({ stats, onRefresh }: { stats: Stats; onRefresh: () => void }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        <Kpi label="Vistas" value={stats.totals.pageviews} />
        <Kpi label="Visitantes" value={stats.totals.visitors} accent={LIME} />
        <Kpi label="Clic demo" value={stats.totals.demoClicks} accent={EMBER} />
        <Kpi label="Clic Stripe" value={stats.totals.stripeClicks} accent={EMBER} />
        <button onClick={onRefresh} style={{ background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>↻ Refrescar</button>
      </div>

      <Section title="Visitas y sesiones por día (30 días)">
        {stats.byDay.length === 0 ? <Empty /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(() => { const max = Math.max(1, ...stats.byDay.map((d) => d.visits)); return stats.byDay.map((d) => (
              <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 82, fontSize: 12, color: MUTED, fontFamily: MONO, textAlign: 'right' }}>{d.date}</span>
                <div style={{ flex: 1, height: 16, background: '#1a1a22', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(d.visits / max) * 100}%`, background: LIME }} />
                </div>
                <span style={{ width: 96, fontSize: 12, color: TEXT, fontFamily: MONO }}>{d.visits}v · {d.sessions}s</span>
              </div>
            )) })()}
          </div>
        )}
      </Section>

      <Section title="Por fuente (src)">
        {stats.bySrc.length === 0 ? <Empty /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: MUTED, textAlign: 'left' }}>
                  <Th>src</Th><Th>sesiones</Th><Th>tiempo prom.</Th><Th>llegó a precio</Th><Th>clic demo</Th>
                </tr>
              </thead>
              <tbody>
                {stats.bySrc.map((r) => (
                  <tr key={r.src} style={{ borderTop: `1px solid ${LINE}` }}>
                    <Td><span style={{ color: r.src === 'directo' ? MUTED : LIME }}>{r.src}</span></Td>
                    <Td mono>{r.sessions}</Td>
                    <Td mono>{r.avgSeconds}s</Td>
                    <Td mono>{r.scroll}</Td>
                    <Td mono>{r.demo}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Embudo">
        {(() => { const top = stats.funnel[0]?.sessions || 0; return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.funnel.map((s) => { const pct = top > 0 ? Math.round((s.sessions / top) * 100) : 0; return (
              <div key={s.stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontFamily: MONO }}>{s.stage}</span>
                  <span style={{ color: MUTED, fontFamily: MONO }}>{s.sessions} · {pct}%</span>
                </div>
                <div style={{ height: 22, background: '#1a1a22', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: EMBER }} />
                </div>
              </div>
            ) })}
          </div>
        ) })()}
      </Section>

      <Section title={`Distribución del simulador (${stats.simulator.total} interacciones)`}>
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

// ── Links ────────────────────────────────────────────────────────────────────
function LinksView({ links, reload, hdr }: { links: LinkRow[] | null; reload: () => void; hdr: Record<string, string> }) {
  const [slug, setSlug] = useState('')
  const [destination, setDestination] = useState('/agente-comercial')
  const [label, setLabel] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const create = async () => {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch('/api/links', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, destination, label }) })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error')
      setSlug(''); setLabel(''); setDestination('/agente-comercial'); setMsg('✓ Link creado'); reload()
    } catch (e) { setMsg('⚠ ' + (e instanceof Error ? e.message : 'Error')) } finally { setBusy(false) }
  }

  const archive = async (id: string) => {
    await fetch(`/api/links/${id}`, { method: 'PATCH', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: true }) })
    reload()
  }

  const copy = (slugVal: string) => {
    const url = `${window.location.origin}/r/${slugVal}`
    navigator.clipboard?.writeText(url)
    setMsg('✓ Copiado: ' + url)
  }

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—')

  return (
    <>
      <Section title="Crear link de seguimiento">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 10, alignItems: 'end' }}>
          <Fld label="Slug (ej. capicua)"><input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="capicua" style={inp} /></Fld>
          <Fld label="Destino">
            <input value={destination} onChange={(e) => setDestination(e.target.value)} style={inp} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {DEST_PRESETS.map((d) => {
                const active = destination === d.path
                return (
                  <button key={d.path} type="button" onClick={() => setDestination(d.path)}
                    style={{ background: active ? LIME : 'transparent', color: active ? BG : MUTED, border: `1px solid ${active ? LIME : LINE}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: active ? 700 : 400 }}>
                    {d.label}
                  </button>
                )
              })}
            </div>
          </Fld>
          <Fld label="Etiqueta (opcional)"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Capicua - propuesta julio" style={inp} /></Fld>
          <button onClick={create} disabled={busy || !slug} style={{ background: LIME, color: BG, border: 'none', borderRadius: 8, padding: '11px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: SYNE, opacity: busy || !slug ? 0.5 : 1 }}>Crear</button>
        </div>
        {msg && <p style={{ marginTop: 12, fontSize: 13, color: msg.startsWith('✓') ? LIME : '#ff6b6b' }}>{msg}</p>}
        <p style={{ marginTop: 8, fontSize: 12, color: MUTED }}>Si el destino no trae <code>?src=</code>, se agrega solo con el slug. El link es <code>{typeof window !== 'undefined' ? window.location.origin : ''}/r/&lt;slug&gt;</code></p>
      </Section>

      <Section title="Links">
        {!links ? <Empty text="Cargando…" /> : links.length === 0 ? <Empty text="Aún no hay links." /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ color: MUTED, textAlign: 'left' }}>
                <Th>slug</Th><Th>etiqueta</Th><Th>destino</Th><Th>clics</Th><Th>última visita</Th><Th></Th>
              </tr></thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.id} style={{ borderTop: `1px solid ${LINE}`, opacity: l.archived ? 0.45 : 1 }}>
                    <Td><span style={{ color: LIME, fontFamily: MONO }}>/r/{l.slug}</span></Td>
                    <Td>{l.label || '—'}</Td>
                    <Td><span style={{ color: MUTED, fontSize: 12 }}>{l.destination}</span></Td>
                    <Td mono>{l.clicks}</Td>
                    <Td mono>{fmt(l.lastVisit)}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => copy(l.slug)} style={btnSm}>Copiar</button>
                        {!l.archived && <button onClick={() => archive(l.id)} style={{ ...btnSm, color: '#ff8a8a' }}>Archivar</button>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  )
}

// ── UI helpers ────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = { width: '100%', background: BG, border: `1px solid ${LINE}`, borderRadius: 8, padding: '10px 12px', color: TEXT, fontSize: 13, outline: 'none' }
const btnSm: React.CSSProperties = { background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={{ display: 'block', fontSize: 11, color: MUTED, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>{children}</div>
}
function Kpi({ label, value, accent = TEXT }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  )
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <h2 style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  )
}
function Empty({ text = 'Sin datos todavía.' }: { text?: string }) {
  return <p style={{ color: '#666', fontSize: 13 }}>{text}</p>
}
function Th({ children }: { children?: React.ReactNode }) {
  return <th style={{ padding: '8px 10px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{children}</th>
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td style={{ padding: '9px 10px', fontFamily: mono ? MONO : undefined, whiteSpace: 'nowrap' }}>{children}</td>
}
function Histogram({ title, items, color }: { title: string; items: { label: string; value: number }[]; color: string }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div>
      <p style={{ fontSize: 12, color: MUTED, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((it) => (
          <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 44, fontSize: 12, color: '#bbb', textAlign: 'right', fontFamily: MONO }}>{it.label}</span>
            <div style={{ flex: 1, height: 14, background: '#1a1a22', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(it.value / max) * 100}%`, background: color }} />
            </div>
            <span style={{ width: 28, fontSize: 12, color: '#ddd', fontFamily: MONO }}>{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

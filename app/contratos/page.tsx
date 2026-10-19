'use client'

import { useState } from 'react'

// Paleta Suuplai
const C = { bg: '#0A0A0F', surf: '#131319', surf2: '#0d0d12', border: '#26262F', text: '#F0EFE8', dim: '#8A8A93', lime: '#E8FF47', warn: '#FF6B35' }

type FirmanteIn = { full_name: string; email: string; role: string }
type Firmante = { id: string; full_name: string; email: string; role: string | null; token: string; sign_order: number; signed_at: string | null }
type Contrato = { id: string; title: string; status: string; created_at: string; completed_at: string | null; pdf_url: string | null; firmantes: Firmante[] }

const ESTADO: Record<string, { txt: string; col: string }> = {
  draft: { txt: 'Borrador', col: C.dim },
  sent: { txt: 'Enviado', col: '#6AA9FF' },
  partially_signed: { txt: 'Firma parcial', col: C.warn },
  completed: { txt: 'Completado', col: C.lime },
  voided: { txt: 'Cancelado', col: '#ff6b6b' },
}

export default function ContratosPage() {
  const [pw, setPw] = useState('')
  const [authed, setAuthed] = useState(false)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'create'>('list')
  const [open, setOpen] = useState<string | null>(null)

  // formulario de creación
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [firmantes, setFirmantes] = useState<FirmanteIn[]>([
    { full_name: 'SANTIAGO CÉSPEDES COBIÁN', email: 'santiago@suups.com.mx', role: 'SUUPLAI' },
    { full_name: '', email: '', role: 'EL PRESTADOR' },
  ])
  const [creando, setCreando] = useState(false)

  const H = () => ({ 'x-admin-password': pw, 'Content-Type': 'application/json' })

  async function load() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/contratos', { headers: H() })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error al cargar')
      setContratos(json.contratos as Contrato[]); setAuthed(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setLoading(false) }
  }

  async function crear() {
    if (!file) return
    setCreando(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('pdf', file)
      fd.append('firmantes', JSON.stringify(firmantes))
      const res = await fetch('/api/contratos', { method: 'POST', headers: { 'x-admin-password': pw }, body: fd })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo crear')
      setTitle(''); setFile(null)
      setFirmantes([{ full_name: 'SANTIAGO CÉSPEDES COBIÁN', email: 'santiago@suups.com.mx', role: 'SUUPLAI' }, { full_name: '', email: '', role: 'EL PRESTADOR' }])
      setView('list'); await load(); setOpen(json.id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setCreando(false) }
  }

  async function accion(id: string, action: 'send' | 'void') {
    if (action === 'void' && !confirm('¿Cancelar este contrato? Queda en el histórico pero ya no se podrá firmar.')) return
    setError(null)
    try {
      const res = await fetch(`/api/contratos/${id}`, { method: 'PATCH', headers: H(), body: JSON.stringify({ action }) })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
  }

  const linkDe = (token: string) => (typeof window !== 'undefined' ? window.location.origin : '') + '/firmar/' + token
  const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
  const setF = (i: number, k: keyof FirmanteIn, v: string) => setFirmantes((fs) => fs.map((f, j) => (j === i ? { ...f, [k]: v } : f)))

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 2 }}>Contratos · Suuplai</h1>
        <p style={{ color: C.dim, fontSize: 14, marginBottom: 24 }}>Crea contratos y genera enlaces de firma por firmante.</p>

        {!authed ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 420 }}>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Contraseña de admin" style={inp} />
            <button onClick={load} disabled={loading || !pw} style={{ ...btn, opacity: loading || !pw ? 0.5 : 1 }}>{loading ? 'Cargando…' : 'Entrar'}</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <button onClick={() => setView('list')} style={tab(view === 'list')}>Contratos ({contratos.length})</button>
              <button onClick={() => setView('create')} style={tab(view === 'create')}>+ Nuevo contrato</button>
              <button onClick={load} style={{ ...ghost, marginLeft: 'auto' }}>↻ Refrescar</button>
            </div>

            {view === 'create' && (
              <div style={card}>
                <label style={lab}>Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contrato de prestación de servicios · Gonzalo de Guerrero" style={{ ...inp, width: '100%', marginBottom: 16 }} />

                <label style={lab}>PDF del contrato</label>
                <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ ...inp, width: '100%', marginBottom: 6 }} />
                {file && <p style={{ color: C.lime, fontSize: 13, marginBottom: 6 }}>✓ {file.name} ({Math.round(file.size / 1024)} KB)</p>}
                <p style={{ color: C.dim, fontSize: 12, marginBottom: 18 }}>Se calcula un hash SHA-256 del PDF al crear. Después no se puede editar: si hay que cambiar algo, se crea uno nuevo.</p>

                <label style={lab}>Firmantes</label>
                {firmantes.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <input value={f.full_name} onChange={(e) => setF(i, 'full_name', e.target.value)} placeholder="Nombre completo (como aparece en el contrato)" style={{ ...inp, flex: 2, minWidth: 200 }} />
                    <input value={f.email} onChange={(e) => setF(i, 'email', e.target.value)} placeholder="correo@dominio.com" style={{ ...inp, flex: 1.5, minWidth: 160 }} />
                    <input value={f.role} onChange={(e) => setF(i, 'role', e.target.value)} placeholder="Rol" style={{ ...inp, width: 120 }} />
                    {firmantes.length > 1 && <button onClick={() => setFirmantes((fs) => fs.filter((_, j) => j !== i))} style={{ ...ghost, padding: '0 12px' }}>✕</button>}
                  </div>
                ))}
                <button onClick={() => setFirmantes((fs) => [...fs, { full_name: '', email: '', role: '' }])} style={{ ...ghost, marginTop: 4 }}>+ Agregar firmante</button>

                <div style={{ marginTop: 22 }}>
                  <button onClick={crear} disabled={creando || !title || !file} style={{ ...btn, opacity: creando || !title || !file ? 0.5 : 1 }}>
                    {creando ? 'Creando…' : 'Crear contrato'}
                  </button>
                </div>
              </div>
            )}

            {view === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {contratos.length === 0 && <p style={{ color: C.dim, textAlign: 'center', padding: 32 }}>Aún no hay contratos.</p>}
                {contratos.map((c) => {
                  const est = ESTADO[c.status] || { txt: c.status, col: C.dim }
                  const firmados = c.firmantes.filter((f) => f.signed_at).length
                  return (
                    <div key={c.id} style={card}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setOpen(open === c.id ? null : c.id)}>
                        <span style={{ ...badge, color: est.col, borderColor: est.col }}>{est.txt}</span>
                        <strong style={{ fontSize: 15, flex: 1, minWidth: 120 }}>{c.title}</strong>
                        <span style={{ color: C.dim, fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>{firmados}/{c.firmantes.length} firmas</span>
                        <span style={{ color: C.dim, fontSize: 12 }}>{fmt(c.created_at)}</span>
                      </div>

                      {open === c.id && (
                        <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                          {c.firmantes.map((f) => (
                            <div key={f.id} style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 13, marginBottom: 4 }}>
                                <strong>{f.full_name}</strong> <span style={{ color: C.dim }}>· {f.role || 'firmante'} · {f.email}</span>{' '}
                                {f.signed_at ? <span style={{ color: C.lime }}>✓ firmó {fmt(f.signed_at)}</span> : <span style={{ color: C.warn }}>pendiente</span>}
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <code style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: C.dim, wordBreak: 'break-all', flex: 1, minWidth: 200 }}>{linkDe(f.token)}</code>
                                <button onClick={() => navigator.clipboard?.writeText(linkDe(f.token))} style={ghost}>Copiar enlace</button>
                              </div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                            {c.status === 'draft' && <button onClick={() => accion(c.id, 'send')} style={btn}>Marcar como enviado</button>}
                            {c.status !== 'completed' && c.status !== 'voided' && <button onClick={() => accion(c.id, 'void')} style={{ ...ghost, color: '#ff6b6b', borderColor: '#5c2b2b' }}>Cancelar</button>}
                            {c.pdf_url && <span style={{ color: C.dim, fontSize: 12, alignSelf: 'center' }}>PDF final generado</span>}
                          </div>
                          <p style={{ color: C.dim, fontSize: 11, marginTop: 10 }}>Nota: la página de firma (<code>/firmar/…</code>) se construye en la Fase 2; por ahora los enlaces aún no abren.</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {error && <p style={{ color: '#ff6b6b', marginTop: 16, fontSize: 14 }}>⚠ {error}</p>}
      </div>
    </div>
  )
}

const inp: React.CSSProperties = { background: C.surf, border: `1px solid ${C.border}`, borderRadius: 8, padding: '11px 14px', color: C.text, fontSize: 14, outline: 'none' }
const btn: React.CSSProperties = { background: C.lime, color: C.bg, border: 'none', borderRadius: 999, padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
const ghost: React.CSSProperties = { background: 'transparent', color: C.dim, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }
const card: React.CSSProperties = { background: C.surf, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }
const lab: React.CSSProperties = { display: 'block', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim, marginBottom: 6, fontFamily: 'ui-monospace, monospace' }
const badge: React.CSSProperties = { border: '1px solid', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }
const tab = (on: boolean): React.CSSProperties => ({ background: on ? C.lime : C.surf, color: on ? C.bg : C.dim, border: `1px solid ${on ? C.lime : C.border}`, borderRadius: 999, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' })

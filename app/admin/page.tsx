'use client'

import { Fragment, useState } from 'react'

interface Registro {
  id: string
  created_at: string
  tipo: string
  nombre: string | null
  apellido: string | null
  email: string | null
  whatsapp: string | null
  data: Record<string, unknown>
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [registros, setRegistros] = useState<Registro[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'todos' | 'tienda' | 'productor'>('todos')
  const [open, setOpen] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/registros', { headers: { 'x-admin-password': password } })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error al cargar')
      setRegistros(json.registros as Registro[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      setRegistros(null)
    } finally {
      setLoading(false)
    }
  }

  const fmtDate = (s: string) =>
    new Date(s).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

  const shown = (registros ?? []).filter((r) => filter === 'todos' || r.tipo === filter)
  const tiendas = (registros ?? []).filter((r) => r.tipo === 'tienda').length
  const productores = (registros ?? []).filter((r) => r.tipo === 'productor').length

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F0EFE8', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Panel de registros · Suuplai</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>Tiendas y marcas que se han registrado.</p>

        {/* Login */}
        {!registros && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 420 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Contraseña de admin"
              style={{ flex: 1, minWidth: 200, background: '#13131A', border: '1px solid #333', borderRadius: 8, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
            />
            <button
              onClick={load}
              disabled={loading || !password}
              style={{ background: '#E8FF47', color: '#0A0A0F', border: 'none', borderRadius: 8, padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading || !password ? 0.5 : 1 }}
            >
              {loading ? 'Cargando…' : 'Entrar'}
            </button>
          </div>
        )}

        {error && <p style={{ color: '#ff6b6b', marginTop: 12, fontSize: 14 }}>⚠ {error}</p>}

        {/* Tabla */}
        {registros && (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              {(['todos', 'tienda', 'productor'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  style={{
                    background: filter === t ? '#E8FF47' : '#13131A',
                    color: filter === t ? '#0A0A0F' : '#aaa',
                    border: '1px solid #333', borderRadius: 999, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {t === 'todos' ? `Todos (${registros.length})` : t === 'tienda' ? `Tiendas (${tiendas})` : `Marcas (${productores})`}
                </button>
              ))}
              <button onClick={load} style={{ marginLeft: 'auto', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
                ↻ Refrescar
              </button>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #222', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#13131A', textAlign: 'left', color: '#888' }}>
                    <th style={th}>Fecha</th>
                    <th style={th}>Tipo</th>
                    <th style={th}>Nombre</th>
                    <th style={th}>Negocio / Marca</th>
                    <th style={th}>Email</th>
                    <th style={th}>WhatsApp</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => {
                    const negocio = (r.data?.nombreTienda || r.data?.nombreMarca || '') as string
                    return (
                      <Fragment key={r.id}>
                        <tr style={{ borderTop: '1px solid #222' }}>
                          <td style={td}>{fmtDate(r.created_at)}</td>
                          <td style={td}>
                            <span style={{ background: r.tipo === 'tienda' ? 'rgba(232,255,71,0.15)' : 'rgba(255,107,53,0.15)', color: r.tipo === 'tienda' ? '#E8FF47' : '#FF6B35', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                              {r.tipo === 'tienda' ? '🏪 Tienda' : '📦 Marca'}
                            </span>
                          </td>
                          <td style={td}>{[r.nombre, r.apellido].filter(Boolean).join(' ') || '—'}</td>
                          <td style={td}>{negocio || '—'}</td>
                          <td style={td}>{r.email || '—'}</td>
                          <td style={td}>{r.whatsapp || '—'}</td>
                          <td style={td}>
                            <button onClick={() => setOpen(open === r.id ? null : r.id)} style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>
                              {open === r.id ? 'Cerrar' : 'Ver todo'}
                            </button>
                          </td>
                        </tr>
                        {open === r.id && (
                          <tr style={{ background: '#0d0d12' }}>
                            <td colSpan={7} style={{ padding: 16 }}>
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, color: '#bbb' }}>
                                {JSON.stringify(r.data, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                  {shown.length === 0 && (
                    <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#666', padding: 32 }}>Sin registros todavía.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '12px 14px', fontWeight: 600, whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '11px 14px', verticalAlign: 'top' }

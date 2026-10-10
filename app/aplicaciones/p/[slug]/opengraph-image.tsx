import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'CV de Santiago Céspedes'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const NOMBRE = 'Santiago Céspedes'

type App = { empresa: string; puesto: string; persona: string | null; idioma: string }

async function getApp(slug: string): Promise<App | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) return null
  const url = `${base}/rest/v1/app_applications?slug=eq.${encodeURIComponent(slug)}&select=empresa,puesto,persona,idioma&limit=1`
  const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' })
  if (!r.ok) return null
  const rows = (await r.json()) as App[]
  return rows[0] || null
}

// Tarjeta OG (lo que ve WhatsApp): fondo oscuro del CV, nombre grande, destinatario y marca.
export default async function Image({ params }: { params: { slug: string } }) {
  const app = await getApp(params.slug)
  const en = app?.idioma === 'en'
  const dest = app ? app.persona || app.puesto : ''
  const kicker = en ? 'RESUME' : 'CURRÍCULUM'
  const linea = app ? `${en ? 'for' : 'para'} ${dest}${app.empresa ? ` · ${app.empresa}` : ''}` : ''

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#232420', padding: '72px 80px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 8, color: '#9c948a', fontWeight: 700 }}>{kicker}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', fontSize: 108, fontWeight: 800, color: '#FCFBF6', lineHeight: 1 }}>{NOMBRE}</div>
          {dest ? <div style={{ display: 'flex', fontSize: 40, color: '#E4DECF' }}>{linea}</div> : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', width: 48, height: 14, borderRadius: 4, background: '#FFFFFF' }} />
            <div style={{ display: 'flex', width: 48, height: 14, borderRadius: 4, background: '#F5C518' }} />
            <div style={{ display: 'flex', fontSize: 30, color: '#F0EFE8', fontWeight: 700, marginLeft: 8 }}>suuplai</div>
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#B4451A', fontWeight: 700 }}>{en ? 'Open & download →' : 'Ábrelo y descárgalo →'}</div>
        </div>
      </div>
    ),
    { ...size },
  )
}

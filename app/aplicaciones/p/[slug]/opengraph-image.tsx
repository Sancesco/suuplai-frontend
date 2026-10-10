import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'CV de Santiago Céspedes'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const NOMBRE = ['Santiago', 'Céspedes']

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

// Tarjeta OG (lo que ve WhatsApp). Composición CENTRADA para que sobreviva el recorte a
// cuadro de WhatsApp: todo lo importante vive en el centro, nombre en dos líneas, con aire.
export default async function Image({ params }: { params: { slug: string } }) {
  const app = await getApp(params.slug)
  const en = app?.idioma === 'en'
  const dest = app ? app.persona || app.puesto : ''
  const kicker = en ? 'RESUME' : 'CURRÍCULUM'

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#232420', fontFamily: 'sans-serif', padding: 60, position: 'relative' }}>
        {/* marco sutil */}
        <div style={{ position: 'absolute', top: 28, left: 28, right: 28, bottom: 28, border: '1px solid rgba(228,222,207,0.14)', borderRadius: 24 }} />

        <div style={{ display: 'flex', fontSize: 24, letterSpacing: 12, color: '#9c948a', fontWeight: 700, marginBottom: 26 }}>{kicker}</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0.98 }}>
          <div style={{ display: 'flex', fontSize: 104, fontWeight: 800, color: '#FCFBF6', letterSpacing: -2 }}>{NOMBRE[0]}</div>
          <div style={{ display: 'flex', fontSize: 104, fontWeight: 800, color: '#FCFBF6', letterSpacing: -2 }}>{NOMBRE[1]}</div>
        </div>

        <div style={{ display: 'flex', width: 84, height: 6, borderRadius: 3, background: '#B4451A', margin: '30px 0 26px' }} />

        {dest ? <div style={{ display: 'flex', fontSize: 38, color: '#E4DECF' }}>{en ? 'for' : 'para'} {dest}</div> : null}
        {app?.empresa ? <div style={{ display: 'flex', fontSize: 27, color: '#9c948a', marginTop: 8 }}>{app.empresa}</div> : null}

        {/* marca suuplai, centrada abajo */}
        <div style={{ position: 'absolute', bottom: 54, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', width: 38, height: 11, borderRadius: 3, background: '#FFFFFF' }} />
          <div style={{ display: 'flex', width: 38, height: 11, borderRadius: 3, background: '#F5C518' }} />
          <div style={{ display: 'flex', fontSize: 26, color: '#F0EFE8', fontWeight: 700, marginLeft: 6 }}>suuplai</div>
        </div>
      </div>
    ),
    { ...size },
  )
}

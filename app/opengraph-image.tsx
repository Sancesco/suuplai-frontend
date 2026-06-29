import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Suuplai — El espacio en tienda ya no es solo de los grandes'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0A0A0F',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px 96px',
        }}
      >
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Slot mark — outlined rounded square with two bars */}
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '20px',
              border: '4px solid #F0EFE8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <div style={{ width: '14px', height: '50px', background: '#F0EFE8' }} />
            <div style={{ width: '14px', height: '50px', background: '#F5C518' }} />
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '72px',
              fontWeight: 700,
              letterSpacing: '-3px',
              color: '#F0EFE8',
            }}
          >
            suupl<span style={{ color: '#F5C518' }}>ai</span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '78px',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-3px',
              color: '#F0EFE8',
              maxWidth: '1000px',
            }}
          >
            El espacio en tienda
            <br />
            ya no es solo de los grandes.
          </div>
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(240,239,232,0.65)',
              maxWidth: '900px',
              lineHeight: 1.4,
            }}
          >
            +40 puntos de venta en CDMX · onboarding en menos de 14 días
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}

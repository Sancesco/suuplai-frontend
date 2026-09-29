import { NextResponse, type NextRequest } from 'next/server'

// Enruta el subdominio aplicaciones.suuplai.com.mx a las rutas del módulo:
//   /            → /aplicaciones/panel
//   /panel       → /aplicaciones/panel
//   /<slug>      → /aplicaciones/p/<slug>   (páginas públicas)
// El sitio principal (www) no se ve afectado.
export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase()
  if (!host.startsWith('aplicaciones.')) return NextResponse.next()

  const url = req.nextUrl
  const p = url.pathname
  if (p.startsWith('/api') || p.startsWith('/_next') || p.startsWith('/aplicaciones') || p === '/favicon.ico') return NextResponse.next()

  if (p === '/' || p === '/panel') { url.pathname = '/aplicaciones/panel'; return NextResponse.rewrite(url) }
  url.pathname = '/aplicaciones/p' + p // /jelou → /aplicaciones/p/jelou
  return NextResponse.rewrite(url)
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }

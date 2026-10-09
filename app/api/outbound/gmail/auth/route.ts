import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/gmail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Inicia el OAuth de Gmail. Se gatea con ?pw= (contraseña de admin) porque es navegación del browser.
export async function GET(req: Request) {
  const pw = new URL(req.url).searchParams.get('pw') || ''
  if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) return new NextResponse('no autorizado', { status: 401 })
  try { return NextResponse.redirect(getAuthUrl(), 302) }
  catch (e) { return new NextResponse(e instanceof Error ? e.message : 'error', { status: 500 }) }
}

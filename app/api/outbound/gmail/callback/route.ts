import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { exchangeCode } from '@/lib/gmail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Google redirige aquí con ?code=. Intercambia y guarda el refresh_token.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const err = url.searchParams.get('error')
  const back = new URL('/outbound', url.origin)
  if (err || !code) { back.searchParams.set('gmail', 'error'); return NextResponse.redirect(back, 302) }
  const sb = getSupabaseAdmin(); if (!sb) return new NextResponse('no config', { status: 500 })
  try {
    const email = await exchangeCode(sb, code)
    back.searchParams.set('gmail', 'ok'); if (email) back.searchParams.set('email', email)
    return NextResponse.redirect(back, 302)
  } catch (e) {
    back.searchParams.set('gmail', 'error'); back.searchParams.set('msg', (e instanceof Error ? e.message : 'error').slice(0, 120))
    return NextResponse.redirect(back, 302)
  }
}

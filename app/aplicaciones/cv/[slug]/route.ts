import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getSupabaseAdmin, ipHash, deviceOf } from '@/lib/aplicaciones'
import { sendTelegram } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Link directo al CV: registra la descarga (evento + alerta) y redirige al PDF.
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ error: 'no config' }, { status: 500 })
  const { data: app } = await sb.from('app_applications').select('id,slug,empresa,puesto,cv_url').eq('slug', params.slug).maybeSingle()
  if (!app || !app.cv_url) return new NextResponse('CV no disponible', { status: 404 })

  // visitor_id de primera parte
  const cookie = req.headers.get('cookie') || ''
  let vid = cookie.match(/(?:^|; )app_vid=([^;]+)/)?.[1]
  let setCookie: string | null = null
  if (!vid) { vid = randomBytes(16).toString('hex'); setCookie = `app_vid=${vid}; Path=/; Max-Age=31536000; SameSite=Lax` }

  await sb.from('app_events').insert({ application_id: app.id, slug: app.slug, visitor_id: vid, tipo: 'cv_download', ip_hash: ipHash(req), device: deviceOf(req), data: { via: 'link' } })

  // alerta con anti-spam (2 min)
  const { data: ev } = await sb.from('app_events').select('tipo').eq('application_id', app.id)
  const cvCount = (ev ?? []).filter((e) => e.tipo === 'cv_download').length
  const { data: last } = await sb.from('app_alerts').select('sent_at').eq('application_id', app.id).eq('tipo', 'cv_download').order('sent_at', { ascending: false }).limit(1).maybeSingle()
  if (!last || Date.now() - new Date(last.sent_at).getTime() > 2 * 60000) {
    await sb.from('app_alerts').insert({ application_id: app.id, tipo: 'cv_download' })
    const et = `<b>${app.empresa}</b> · ${app.puesto}`
    await sendTelegram(cvCount <= 1 ? `📄 <b>Descargaron tu CV</b> (link directo)\n${et}` : `📄🔁 <b>Volvieron a descargar tu CV</b> (${cvCount}ª vez)\n${et}`)
  }

  const res = NextResponse.redirect(app.cv_url, 302)
  if (setCookie) res.headers.set('Set-Cookie', setCookie)
  return res
}

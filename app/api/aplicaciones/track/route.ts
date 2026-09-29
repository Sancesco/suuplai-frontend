import { NextResponse } from 'next/server'
import { getSupabaseAdmin, ipHash, deviceOf } from '@/lib/aplicaciones'
import { sendTelegram } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIPOS = ['open', 'time_on_page', 'section_view', 'cv_download', 'demo_click', 'video_play', 'video_complete', 'schedule_click', 'chat_message']
const RANK: Record<string, number> = { enviada: 1, borrador: 1, abierta: 2, leida: 3, compartida: 4 }
const BASE = 'https://www.suuplai.com.mx/aplicaciones/p/'

// Dispara una alerta a Telegram una sola vez por (aplicación, tipo).
async function alerta(sb: ReturnType<typeof getSupabaseAdmin>, appId: string, tipo: string, texto: string) {
  if (!sb) return
  const { data: ex } = await sb.from('app_alerts').select('id').eq('application_id', appId).eq('tipo', tipo).maybeSingle()
  if (ex) return
  await sb.from('app_alerts').insert({ application_id: appId, tipo })
  await sendTelegram(texto)
}

// Registra un evento de una página pública. Público (autorizado por el slug). No guarda IP en claro.
export async function POST(req: Request) {
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false }, { status: 500 })
  const b = await req.json().catch(() => null)
  const slug = String(b?.slug ?? '').trim()
  const tipo = String(b?.tipo ?? '').trim()
  const visitor = String(b?.visitor_id ?? '').trim().slice(0, 40) || null
  if (!slug || !TIPOS.includes(tipo)) return NextResponse.json({ ok: false }, { status: 400 })

  const { data: app } = await sb.from('app_applications').select('id,estado,empresa,puesto').eq('slug', slug).maybeSingle()
  if (!app) return NextResponse.json({ ok: false }, { status: 404 })

  await sb.from('app_events').insert({
    application_id: app.id, slug, visitor_id: visitor, tipo,
    data: (b?.data && typeof b.data === 'object') ? b.data : null,
    ip_hash: ipHash(req), referrer: String(b?.referrer ?? '').slice(0, 300) || null, device: deviceOf(req),
  })

  // Estado automático + alertas (sin bajar de respondida/rechazada; nunca por heartbeat).
  const { data: ev } = await sb.from('app_events').select('tipo,visitor_id,data').eq('application_id', app.id)
  const rows = (ev ?? []) as { tipo: string; visitor_id: string | null; data: { seconds?: number } | null }[]
  const visitors = new Set(rows.filter((r) => r.visitor_id).map((r) => r.visitor_id))
  const seconds = rows.filter((r) => r.tipo === 'time_on_page').reduce((a, r) => a + Number(r.data?.seconds || 0), 0)
  const et = `<b>${app.empresa}</b> · ${app.puesto}`
  const link = BASE + slug

  if (RANK[app.estado]) {
    let nuevo = 'abierta'
    if (seconds >= 60) nuevo = 'leida'
    if (visitors.size >= 2) nuevo = 'compartida'
    if ((RANK[nuevo] || 0) > (RANK[app.estado] || 0)) await sb.from('app_applications').update({ estado: nuevo }).eq('id', app.id)
  }

  if (tipo === 'open') await alerta(sb, app.id, 'open', `👀 <b>Abrieron</b> tu aplicación\n${et}\n<a href="${link}">ver</a>`)
  if (tipo === 'cv_download') await alerta(sb, app.id, 'cv_download', `📄 <b>Descargaron tu CV</b>\n${et}`)
  if (seconds >= 60) await alerta(sb, app.id, 'read_60s', `📖 <b>Ya llevan 60s+ leyendo</b>\n${et}`)
  if (visitors.size >= 2) await alerta(sb, app.id, 'shared', `🔥🔥 <b>LO COMPARTIERON</b> (2º visitante distinto)\n${et}\n<a href="${link}">ver</a>`)

  return NextResponse.json({ ok: true })
}

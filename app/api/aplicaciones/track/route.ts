import { NextResponse } from 'next/server'
import { getSupabaseAdmin, ipHash, deviceOf, geoOf } from '@/lib/aplicaciones'
import { sendTelegram } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIPOS = ['open', 'time_on_page', 'section_view', 'cv_download', 'demo_click', 'video_play', 'video_complete', 'schedule_click', 'chat_message']
const RANK: Record<string, number> = { enviada: 1, borrador: 1, abierta: 2, leida: 3, compartida: 4 }
const BASE = 'https://www.suuplai.com.mx/aplicaciones/p/'

// Hito: alerta una sola vez por (aplicación, tipo).
async function alertaOnce(sb: ReturnType<typeof getSupabaseAdmin>, appId: string, tipo: string, texto: string) {
  if (!sb) return
  const { data: ex } = await sb.from('app_alerts').select('id').eq('application_id', appId).eq('tipo', tipo).maybeSingle()
  if (ex) return
  await sb.from('app_alerts').insert({ application_id: appId, tipo })
  await sendTelegram(texto)
}
// Repetible (re-abrir, re-descargar) pero con anti-spam: no reenvía si ya avisó hace < X minutos.
async function alertaThrottle(sb: ReturnType<typeof getSupabaseAdmin>, appId: string, tipo: string, texto: string, minutos: number) {
  if (!sb) return
  const { data: last } = await sb.from('app_alerts').select('sent_at').eq('application_id', appId).eq('tipo', tipo).order('sent_at', { ascending: false }).limit(1).maybeSingle()
  if (last && Date.now() - new Date(last.sent_at).getTime() < minutos * 60000) return
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

  const geo = geoOf(req)
  await sb.from('app_events').insert({
    application_id: app.id, slug, visitor_id: visitor, tipo,
    data: { ...(b?.data && typeof b.data === 'object' ? b.data : {}), ...(geo.label ? { geo: geo.label, ciudad: geo.ciudad } : {}) },
    ip_hash: ipHash(req), referrer: String(b?.referrer ?? '').slice(0, 300) || null, device: deviceOf(req),
  })

  // Estado automático + alertas (sin bajar de respondida/rechazada; nunca por heartbeat).
  const { data: ev } = await sb.from('app_events').select('tipo,visitor_id,data').eq('application_id', app.id)
  const rows = (ev ?? []) as { tipo: string; visitor_id: string | null; data: { seconds?: number; geo?: string; ciudad?: string } | null }[]
  const visitors = new Set(rows.filter((r) => r.visitor_id).map((r) => r.visitor_id))
  const seconds = rows.filter((r) => r.tipo === 'time_on_page').reduce((a, r) => a + Number(r.data?.seconds || 0), 0)
  const opensCount = rows.filter((r) => r.tipo === 'open').length
  const cvCount = rows.filter((r) => r.tipo === 'cv_download').length
  const et = `<b>${app.empresa}</b> · ${app.puesto}`
  const link = BASE + slug

  if (RANK[app.estado]) {
    let nuevo = 'abierta'
    if (seconds >= 60) nuevo = 'leida'
    if (visitors.size >= 2) nuevo = 'compartida'
    if ((RANK[nuevo] || 0) > (RANK[app.estado] || 0)) await sb.from('app_applications').update({ estado: nuevo }).eq('id', app.id)
  }

  // Ciudades distintas desde donde se ha abierto (señal fuerte de que lo compartieron a otro lado).
  const ciudades = new Set(rows.filter((r) => r.tipo === 'open' && r.data?.ciudad).map((r) => r.data!.ciudad as string))
  const donde = geo.label ? ` · 📍 ${geo.label}` : ''

  // Aperturas y descargas avisan también en repetidas (con anti-spam de unos minutos).
  if (tipo === 'open') {
    const texto = opensCount <= 1 ? `👀 <b>Abrieron</b> tu aplicación${donde}\n${et}\n<a href="${link}">ver</a>` : `🔁 <b>Volvieron a abrir</b> (${opensCount}ª vez)${donde}\n${et}\n<a href="${link}">ver</a>`
    await alertaThrottle(sb, app.id, 'open', texto, 3)
  }
  if (ciudades.size >= 2) await alertaOnce(sb, app.id, 'otra_ciudad', `📍🔥 <b>Abrieron desde OTRA ciudad</b> (${Array.from(ciudades).join(' · ')})\nSeñal fuerte: probablemente lo compartieron.\n${et}\n<a href="${link}">ver</a>`)
  if (tipo === 'cv_download') {
    const texto = cvCount <= 1 ? `📄 <b>Descargaron tu CV</b>\n${et}` : `📄🔁 <b>Volvieron a descargar tu CV</b> (${cvCount}ª vez)\n${et}`
    await alertaThrottle(sb, app.id, 'cv_download', texto, 2)
  }
  if (seconds >= 60) await alertaOnce(sb, app.id, 'read_60s', `📖 <b>Ya llevan 60s+ leyendo</b>\n${et}`)
  if (visitors.size >= 2) await alertaOnce(sb, app.id, 'shared', `🔥🔥 <b>LO COMPARTIERON</b> (2º visitante distinto)\n${et}\n<a href="${link}">ver</a>`)

  return NextResponse.json({ ok: true })
}

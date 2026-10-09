import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Brazo = { id: string; perilla: string; texto: string; es_control: boolean; activa: boolean; envios: number; envios_maduros: number; clics: number; respuestas: number; alfa: number; beta: number }

// Reporte de inteligencia: tasa global, "abrió y no contestó" vs "nunca abrió", y cada brazo.
export async function GET(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const { data: brazosRaw } = await sb.from('outbound_brazo').select('*').order('perilla', { ascending: true }).order('es_control', { ascending: false })
  const brazos = ((brazosRaw ?? []) as Brazo[]).map((b) => ({
    id: b.id, perilla: b.perilla, texto: b.texto, es_control: b.es_control, activa: b.activa,
    envios: b.envios, maduros: b.envios_maduros, clics: b.clics, respuestas: b.respuestas,
    // media del posterior Beta (tasa estimada de "engagement") y ancho ~ incertidumbre
    tasa: b.alfa / (b.alfa + b.beta), peso: b.envios_maduros,
  }))

  // Globales: de los que ya se enviaron, cuántos abrieron (clic en /r) y cuántos respondieron.
  const { data: pros } = await sb.from('outbound_prospecto').select('slug,estado').in('estado', ['en_secuencia', 'respondio', 'reboto', 'cerrado', 'rechazada'])
  const list = (pros ?? []) as { slug: string | null; estado: string }[]
  const slugs = list.map((p) => p.slug).filter(Boolean) as string[]
  const clicksBySlug = new Map<string, number>()
  let clicsTotales = 0
  if (slugs.length) {
    const { data: lk } = await sb.from('links').select('slug,clicks').in('slug', slugs)
    for (const l of (lk ?? []) as { slug: string; clicks: number }[]) { clicksBySlug.set(l.slug, l.clicks ?? 0); clicsTotales += l.clicks ?? 0 }
  }
  // Señales de la página de CV — por PROSPECTO ÚNICO (si uno lo abre 2 veces, cuenta 1).
  const vistos = new Set<string>(), descargaron = new Set<string>(), conChat = new Set<string>()
  let cvTiempo = 0
  if (slugs.length) {
    const { data: ev } = await sb.from('app_events').select('slug,tipo,data').in('slug', slugs)
    for (const e of (ev ?? []) as { slug: string; tipo: string; data: { seconds?: number } | null }[]) {
      if (e.tipo === 'open') vistos.add(e.slug)
      else if (e.tipo === 'cv_download') descargaron.add(e.slug)
      else if (e.tipo === 'chat_message') conChat.add(e.slug)
      else if (e.tipo === 'time_on_page') cvTiempo += Number(e.data?.seconds || 0)
    }
  }
  const cvVisitas = vistos.size, cvDescargas = descargaron.size, cvChat = conChat.size
  let enviadas = 0, abiertas = 0, respondidas = 0, rebotadas = 0
  for (const p of list) {
    enviadas++
    const clk = p.slug ? (clicksBySlug.get(p.slug) ?? 0) : 0
    if (clk > 0) abiertas++
    if (p.estado === 'respondio') respondidas++
    if (p.estado === 'reboto') rebotadas++
  }
  // En cola + envíos por toque
  const { count: enCola } = await sb.from('outbound_prospecto').select('id', { count: 'exact', head: true }).eq('estado', 'listo')
  const { data: envs } = await sb.from('outbound_envio').select('toque')
  const porToque = { t1: 0, t2: 0, t3: 0 }
  for (const e of (envs ?? []) as { toque: number }[]) { if (e.toque === 1) porToque.t1++; else if (e.toque === 2) porToque.t2++; else if (e.toque === 3) porToque.t3++ }

  const global = {
    enviadas, abiertas, respondidas, rebotadas, clics_totales: clicsTotales, en_cola: enCola ?? 0,
    tasa_respuesta: enviadas ? Math.round((respondidas / enviadas) * 1000) / 10 : 0,
    tasa_apertura: enviadas ? Math.round((abiertas / enviadas) * 1000) / 10 : 0,
    tasa_clic: enviadas ? Math.round((clicsTotales / enviadas) * 1000) / 10 : 0,
    abrio_no_contesto: Math.max(0, abiertas - respondidas), // el cuerpo es el problema
    nunca_abrio: Math.max(0, enviadas - abiertas),          // el asunto o la persona equivocada
    cv_visitas: cvVisitas, cv_descargas: cvDescargas, cv_chat: cvChat,
    cv_tiempo_prom: cvVisitas ? Math.round(cvTiempo / cvVisitas) : 0,
    correos_1: porToque.t1, correos_recordatorios: porToque.t2 + porToque.t3,
  }
  return NextResponse.json({ ok: true, global, brazos })
}

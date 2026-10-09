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
  if (slugs.length) {
    const { data: lk } = await sb.from('links').select('slug,clicks').in('slug', slugs)
    for (const l of (lk ?? []) as { slug: string; clicks: number }[]) clicksBySlug.set(l.slug, l.clicks ?? 0)
  }
  let enviadas = 0, abiertas = 0, respondidas = 0, rebotadas = 0
  for (const p of list) {
    enviadas++
    const clk = p.slug ? (clicksBySlug.get(p.slug) ?? 0) : 0
    if (clk > 0) abiertas++
    if (p.estado === 'respondio') respondidas++
    if (p.estado === 'reboto') rebotadas++
  }
  const global = {
    enviadas, abiertas, respondidas, rebotadas,
    tasa_respuesta: enviadas ? Math.round((respondidas / enviadas) * 1000) / 10 : 0,
    tasa_apertura: enviadas ? Math.round((abiertas / enviadas) * 1000) / 10 : 0,
    abrio_no_contesto: Math.max(0, abiertas - respondidas), // el cuerpo es el problema
    nunca_abrio: Math.max(0, enviadas - abiertas),          // el asunto o la persona equivocada
  }
  return NextResponse.json({ ok: true, global, brazos })
}

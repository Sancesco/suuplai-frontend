import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const DATACENTERS = ['boydton', 'ashburn', 'mountain view', 'the dalles', 'council bluffs', 'dublin']
const csvCell = (c: unknown) => '"' + String(c ?? '').replace(/"/g, '""') + '"'

// Exporta toda la data del outbound a CSV (una fila por prospecto, con señales de interés).
export async function GET(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const { data: pros } = await sb.from('outbound_prospecto').select('id,empresa,persona,email,sector,estado,slug,created_at').order('created_at', { ascending: true })
  const list = (pros ?? []) as { id: string; empresa: string; persona: string | null; email: string | null; sector: string | null; estado: string; slug: string | null; created_at: string }[]
  const slugs = list.map((p) => p.slug).filter(Boolean) as string[]

  const { data: evs } = await sb.from('outbound_envio').select('prospecto_id,toque,enviado_en,rebotado,respondido')
  const envByP = new Map<string, { toque: number; enviado_en: string; rebotado: boolean; respondido: boolean }[]>()
  for (const e of (evs ?? []) as { prospecto_id: string; toque: number; enviado_en: string; rebotado: boolean; respondido: boolean }[]) {
    if (!envByP.has(e.prospecto_id)) envByP.set(e.prospecto_id, [])
    envByP.get(e.prospecto_id)!.push(e)
  }

  const clk = new Map<string, number>()
  const bySlug = new Map<string, { opens: number; human: number; cv: number; vis: Set<string> }>()
  if (slugs.length) {
    const [lk, ev] = await Promise.all([
      sb.from('links').select('slug,clicks').in('slug', slugs),
      sb.from('app_events').select('slug,tipo,visitor_id,data').in('slug', slugs),
    ])
    for (const l of (lk.data ?? []) as { slug: string; clicks: number }[]) clk.set(l.slug, l.clicks ?? 0)
    for (const e of (ev.data ?? []) as { slug: string; tipo: string; visitor_id: string | null; data: { ciudad?: string } | null }[]) {
      if (!bySlug.has(e.slug)) bySlug.set(e.slug, { opens: 0, human: 0, cv: 0, vis: new Set() })
      const s = bySlug.get(e.slug)!
      if (e.tipo === 'open') { s.opens++; const ciu = (e.data?.ciudad || '').toLowerCase(); if (!DATACENTERS.some((d) => ciu.includes(d))) s.human++ }
      if (e.tipo === 'cv_download') s.cv++
      if (e.visitor_id) s.vis.add(e.visitor_id)
    }
  }

  const header = ['empresa', 'persona', 'email', 'sector', 'estado', 'toques_enviados', 'fecha_1er_envio', 'clics', 'aperturas', 'aperturas_humanas', 'cv_descargado', 'visitantes_distintos', 'compartio', 'respondio', 'reboto']
  const rows = [header]
  for (const p of list) {
    const e = envByP.get(p.id) ?? []
    const t1 = e.find((x) => x.toque === 1)
    const s = bySlug.get(p.slug || '') ?? { opens: 0, human: 0, cv: 0, vis: new Set() }
    const resp = p.estado === 'respondio' || e.some((x) => x.respondido)
    const reb = p.estado === 'reboto' || e.some((x) => x.rebotado)
    rows.push([p.empresa, p.persona || '', p.email || '', p.sector || '', p.estado, String(e.length), t1 ? t1.enviado_en.slice(0, 10) : '', String(clk.get(p.slug || '') ?? 0), String(s.opens), String(s.human), String(s.cv), String(s.vis.size), s.vis.size >= 2 ? 'si' : '', resp ? 'si' : '', reb ? 'si' : ''])
  }
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n')
  const fecha = new Date().toISOString().slice(0, 10)
  return new NextResponse('﻿' + csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="outbound-analisis-${fecha}.csv"` } })
}

import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkPanel, analizarVacante, type Application } from '@/lib/aplicaciones'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Lista de aplicaciones + actividad (para el panel).
export async function GET(req: Request) {
  if (!checkPanel(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const { data: apps } = await sb.from('app_applications').select('*').order('created_at', { ascending: false })
  const list = (apps ?? []) as Application[]
  const ids = list.map((a) => a.id)
  const stats = new Map<string, { opens: number; visitors: Set<string>; seconds: number; cv: number; last: string | null; followups: number; lastFollowup: string | null }>()
  if (ids.length) {
    const { data: ev } = await sb.from('app_events').select('application_id,tipo,visitor_id,data,created_at').in('application_id', ids)
    for (const e of (ev ?? []) as { application_id: string; tipo: string; visitor_id: string | null; data: { seconds?: number } | null; created_at: string }[]) {
      if (!stats.has(e.application_id)) stats.set(e.application_id, { opens: 0, visitors: new Set(), seconds: 0, cv: 0, last: null, followups: 0, lastFollowup: null })
      const s = stats.get(e.application_id)!
      if (e.visitor_id) s.visitors.add(e.visitor_id)
      if (e.tipo === 'open') s.opens++
      if (e.tipo === 'cv_download') s.cv++
      if (e.tipo === 'followup') { s.followups++; if (!s.lastFollowup || e.created_at > s.lastFollowup) s.lastFollowup = e.created_at }
      if (e.tipo === 'time_on_page') s.seconds += Number(e.data?.seconds || 0)
      if (!s.last || e.created_at > s.last) s.last = e.created_at
    }
  }
  const out = list.map((a) => {
    const s = stats.get(a.id)
    return {
      id: a.id, empresa: a.empresa, puesto: a.puesto, persona: a.persona, slug: a.slug, estado: a.estado,
      match_pct: a.analysis?.match_pct ?? null, created_at: a.created_at, solo_cv: a.solo_cv === true, idioma: a.idioma === 'en' ? 'en' : 'es',
      opens: s?.opens ?? 0, visitors: s ? s.visitors.size : 0, seconds: s?.seconds ?? 0, cv: s?.cv ?? 0, last: s?.last ?? null,
      followups: s?.followups ?? 0, lastFollowup: s?.lastFollowup ?? null,
    }
  })
  return NextResponse.json({ ok: true, applications: out })
}

// Crea una aplicación y corre el análisis de la vacante.
export async function POST(req: Request) {
  if (!checkPanel(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const empresa = String(b?.empresa ?? '').trim()
  const puesto = String(b?.puesto ?? '').trim()
  const vacante = String(b?.vacante ?? '').trim()
  const soloCv = b?.solo_cv === true
  const idioma = b?.idioma === 'en' ? 'en' : 'es'
  // Sin carta: la vacante es opcional (la cover letter ya va por otro lado, ej. el mail).
  if (!empresa || !puesto || (!soloCv && !vacante)) return NextResponse.json({ ok: false, error: 'faltan empresa, puesto o vacante' }, { status: 400 })

  let analysis = null
  if (vacante) { try { analysis = await analizarVacante(empresa, puesto, vacante, idioma) } catch { /* se puede reintentar luego */ } }

  const { data, error } = await sb.from('app_applications').insert({
    empresa, puesto, persona: String(b?.persona ?? '').trim() || null, correo: String(b?.correo ?? '').trim() || null,
    vacante, analysis, estado: 'borrador',
    ...(soloCv ? { solo_cv: true } : {}), // solo referimos las columnas nuevas cuando hace falta
    ...(idioma === 'en' ? { idioma: 'en' } : {}),
  }).select('id').single()
  if (error || !data) {
    const falta = /solo_cv|idioma/.exec(error?.message || '')
    return NextResponse.json({ ok: false, error: falta ? `Falta correr el SQL: agrega la columna ${falta[0]} en Supabase (carpeta supabase/).` : 'no se pudo crear', detail: error?.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: data.id, analysis })
}

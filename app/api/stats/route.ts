import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

interface EventRow {
  type: string
  payload: Record<string, unknown> | null
  session_id: string | null
  src: string | null
  created_at: string
}
interface LinkRow {
  slug: string
  label: string | null
  destination: string
  clicks: number
  category: string | null
  archived: boolean
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}
function hourMx(iso: string): number {
  return Number(new Date(iso).toLocaleString('en-US', { timeZone: 'America/Mexico_City', hour: '2-digit', hour12: false }).slice(0, 2)) % 24
}

export async function GET(req: Request) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (req.headers.get('x-admin-password') !== expected) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const [{ data: evData, error }, { data: linkData }] = await Promise.all([
    supabase.from('events').select('type,payload,session_id,src,created_at').order('created_at', { ascending: false }).limit(50000),
    supabase.from('links').select('slug,label,destination,clicks,category,archived'),
  ])
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  const events = (evData ?? []) as EventRow[]
  const links = (linkData ?? []) as LinkRow[]

  const sessionsWith = (type: string) => {
    const s = new Set<string>()
    events.forEach((e) => { if (e.type === type && e.session_id) s.add(e.session_id) })
    return s
  }
  const sVisit = sessionsWith('page_view')
  const sScroll = sessionsWith('scroll_price')
  const sDemo = sessionsWith('click_demo')
  const sStripe = sessionsWith('click_stripe')

  // src por sesión + sesiones/demo por src
  const sessionSrc = new Map<string, string>()
  const srcSessions = new Map<string, Set<string>>()
  const srcDemo = new Map<string, Set<string>>()
  events.forEach((e) => {
    if (!e.session_id) return
    if (e.src && !sessionSrc.has(e.session_id)) sessionSrc.set(e.session_id, e.src)
    if (e.type === 'page_view' && e.src) {
      if (!srcSessions.has(e.src)) srcSessions.set(e.src, new Set())
      srcSessions.get(e.src)!.add(e.session_id)
    }
    if (e.type === 'click_demo' && e.src) {
      if (!srcDemo.has(e.src)) srcDemo.set(e.src, new Set())
      srcDemo.get(e.src)!.add(e.session_id)
    }
  })
  const srcOf = (sid: string) => sessionSrc.get(sid) ?? 'directo'

  // byDay (30d)
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const dayMap = new Map<string, { visits: number; sessions: Set<string> }>()
  events.forEach((e) => {
    if (e.type !== 'page_view' || new Date(e.created_at).getTime() < cutoff) return
    const k = dayKey(e.created_at)
    const cur = dayMap.get(k) ?? { visits: 0, sessions: new Set<string>() }
    cur.visits++; if (e.session_id) cur.sessions.add(e.session_id)
    dayMap.set(k, cur)
  })
  const byDay = Array.from(dayMap.entries()).map(([date, v]) => ({ date, visits: v.visits, sessions: v.sessions.size })).sort((a, b) => a.date.localeCompare(b.date))

  // bySrc (con tiempo prom desde exit)
  interface SrcAgg { sessions: Set<string>; scroll: Set<string>; demo: Set<string>; secSum: number; secCount: number }
  const srcMap = new Map<string, SrcAgg>()
  const bumpSrc = (s: string): SrcAgg => { let a = srcMap.get(s); if (!a) { a = { sessions: new Set(), scroll: new Set(), demo: new Set(), secSum: 0, secCount: 0 }; srcMap.set(s, a) } return a }
  sVisit.forEach((sid) => bumpSrc(srcOf(sid)).sessions.add(sid))
  sScroll.forEach((sid) => bumpSrc(srcOf(sid)).scroll.add(sid))
  sDemo.forEach((sid) => bumpSrc(srcOf(sid)).demo.add(sid))
  events.forEach((e) => {
    if (e.type !== 'exit' || !e.session_id || !e.payload) return
    const secs = Number(e.payload.seconds); if (!Number.isFinite(secs)) return
    const a = bumpSrc(srcOf(e.session_id)); a.secSum += secs; a.secCount++
  })
  const bySrc = Array.from(srcMap.entries()).map(([src, a]) => ({ src, sessions: a.sessions.size, avgSeconds: a.secCount ? Math.round(a.secSum / a.secCount) : 0, scroll: a.scroll.size, demo: a.demo.size })).sort((a, b) => b.sessions - a.sessions)

  const funnel = [
    { stage: 'page_view', sessions: sVisit.size },
    { stage: 'scroll_price', sessions: sScroll.size },
    { stage: 'click_demo', sessions: sDemo.size },
    { stage: 'click_stripe', sessions: sStripe.size },
  ]

  // simulador
  const pw = new Map<number, number>(), rt = new Map<number, number>()
  let simCount = 0
  events.forEach((e) => {
    if (e.type !== 'simulator_change' || !e.payload) return
    const a = Number(e.payload.perWeek), b = Number(e.payload.rate)
    if (Number.isFinite(a)) pw.set(a, (pw.get(a) ?? 0) + 1)
    if (Number.isFinite(b)) rt.set(b, (rt.get(b) ?? 0) + 1)
    simCount++
  })
  const sortNum = (m: Map<number, number>) => Array.from(m.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => a.value - b.value)

  // B1 scroll depth (sesiones únicas por umbral)
  const scrollDepth = [25, 50, 75, 100].map((d) => ({ depth: d, sessions: sessionsWith(`scroll_${d}`).size }))

  // B2 tiempo por sección (promedio) + B3 punto de salida
  const secSum = new Map<string, number>(), secCnt = new Map<string, number>(), exitPt = new Map<string, number>()
  events.forEach((e) => {
    if (e.type !== 'exit' || !e.payload) return
    const secs = e.payload.sections as Record<string, number> | undefined
    if (secs) Object.keys(secs).forEach((k) => { secSum.set(k, (secSum.get(k) ?? 0) + Number(secs[k] || 0)); secCnt.set(k, (secCnt.get(k) ?? 0) + 1) })
    const ex = e.payload.exitSection as string | undefined
    if (ex) exitPt.set(ex, (exitPt.get(ex) ?? 0) + 1)
  })
  const SEC_ORDER = ['hero', 'problema', 'como', 'retorno', 'precio', 'cta']
  const sectionTime = SEC_ORDER.filter((s) => secCnt.has(s)).map((s) => ({ section: s, avgSeconds: Math.round((secSum.get(s) ?? 0) / (secCnt.get(s) || 1)) }))
  const exitPoints = Array.from(exitPt.entries()).map(([section, count]) => ({ section, count })).sort((a, b) => b.count - a.count)

  // C2 mejor hora (link_click por hora)
  const hourMap = new Map<number, number>()
  events.forEach((e) => { if (e.type === 'link_click') hourMap.set(hourMx(e.created_at), (hourMap.get(hourMx(e.created_at)) ?? 0) + 1) })
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap.get(h) ?? 0 }))

  const linkMetric = (slug: string) => ({
    sessions: srcSessions.get(slug)?.size ?? 0,
    demo: srcDemo.get(slug)?.size ?? 0,
  })

  // D1 comparación de copys (links al mismo destino base)
  const baseGroups = new Map<string, LinkRow[]>()
  links.filter((l) => !l.archived).forEach((l) => {
    const base = l.destination.split('?')[0]
    if (!baseGroups.has(base)) baseGroups.set(base, [])
    baseGroups.get(base)!.push(l)
  })
  const copyGroups = Array.from(baseGroups.entries()).filter(([, arr]) => arr.length >= 2).map(([destination, arr]) => ({
    destination,
    links: arr.map((l) => ({ slug: l.slug, label: l.label, clicks: l.clicks, ...linkMetric(l.slug) })),
  }))

  // D2 por categoría
  const catMap = new Map<string, { links: number; clicks: number; sessions: number; demo: number }>()
  links.filter((l) => !l.archived).forEach((l) => {
    const c = l.category || 'sin categoría'
    const m = catMap.get(c) ?? { links: 0, clicks: 0, sessions: 0, demo: 0 }
    const met = linkMetric(l.slug)
    m.links++; m.clicks += l.clicks; m.sessions += met.sessions; m.demo += met.demo
    catMap.set(c, m)
  })
  const byCategory = Array.from(catMap.entries()).map(([category, m]) => ({ category, ...m })).sort((a, b) => b.clicks - a.clicks)

  return NextResponse.json({
    ok: true,
    totals: { pageviews: events.filter((e) => e.type === 'page_view').length, visitors: sVisit.size, demoClicks: sDemo.size, stripeClicks: sStripe.size },
    byDay, bySrc, funnel,
    simulator: { total: simCount, perWeek: sortNum(pw), rate: sortNum(rt) },
    scrollDepth, sectionTime, exitPoints, hours, copyGroups, byCategory,
  })
}

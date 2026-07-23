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

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

export async function GET(req: Request) {
  const password = req.headers.get('x-admin-password')
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (password !== expected) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const { data, error } = await supabase
    .from('events')
    .select('type,payload,session_id,src,created_at')
    .order('created_at', { ascending: false })
    .limit(50000)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const events = (data ?? []) as EventRow[]

  // src por sesión (first-touch)
  const sessionSrc = new Map<string, string>()
  events.forEach((e) => {
    if (e.session_id && e.src && !sessionSrc.has(e.session_id)) sessionSrc.set(e.session_id, e.src)
  })
  const srcOf = (sid: string) => sessionSrc.get(sid) ?? 'directo'

  const sessionsWith = (type: string) => {
    const s = new Set<string>()
    events.forEach((e) => {
      if (e.type === type && e.session_id) s.add(e.session_id)
    })
    return s
  }
  const sVisit = sessionsWith('page_view')
  const sScroll = sessionsWith('scroll_price')
  const sDemo = sessionsWith('click_demo')
  const sStripe = sessionsWith('click_stripe')

  // ── Visitas y sesiones únicas por día (últimos 30 días) ──────────────────
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const dayMap = new Map<string, { visits: number; sessions: Set<string> }>()
  events.forEach((e) => {
    if (e.type !== 'page_view') return
    if (new Date(e.created_at).getTime() < cutoff) return
    const k = dayKey(e.created_at)
    const cur = dayMap.get(k) ?? { visits: 0, sessions: new Set<string>() }
    cur.visits++
    if (e.session_id) cur.sessions.add(e.session_id)
    dayMap.set(k, cur)
  })
  const byDay = Array.from(dayMap.entries())
    .map(([date, v]) => ({ date, visits: v.visits, sessions: v.sessions.size }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // ── Tabla por src ────────────────────────────────────────────────────────
  interface SrcAgg { sessions: Set<string>; scroll: Set<string>; demo: Set<string>; secSum: number; secCount: number }
  const srcMap = new Map<string, SrcAgg>()
  const bump = (src: string): SrcAgg => {
    let a = srcMap.get(src)
    if (!a) { a = { sessions: new Set(), scroll: new Set(), demo: new Set(), secSum: 0, secCount: 0 }; srcMap.set(src, a) }
    return a
  }
  sVisit.forEach((sid) => bump(srcOf(sid)).sessions.add(sid))
  sScroll.forEach((sid) => bump(srcOf(sid)).scroll.add(sid))
  sDemo.forEach((sid) => bump(srcOf(sid)).demo.add(sid))
  events.forEach((e) => {
    if (e.type !== 'exit' || !e.session_id || !e.payload) return
    const secs = Number((e.payload as Record<string, unknown>).seconds)
    if (!Number.isFinite(secs)) return
    const a = bump(srcOf(e.session_id))
    a.secSum += secs
    a.secCount++
  })
  const bySrc = Array.from(srcMap.entries())
    .map(([src, a]) => ({
      src,
      sessions: a.sessions.size,
      avgSeconds: a.secCount > 0 ? Math.round(a.secSum / a.secCount) : 0,
      scroll: a.scroll.size,
      demo: a.demo.size,
    }))
    .sort((a, b) => b.sessions - a.sessions)

  // ── Embudo ────────────────────────────────────────────────────────────────
  const funnel = [
    { stage: 'page_view', sessions: sVisit.size },
    { stage: 'scroll_price', sessions: sScroll.size },
    { stage: 'click_demo', sessions: sDemo.size },
    { stage: 'click_stripe', sessions: sStripe.size },
  ]

  // ── Distribución del simulador ────────────────────────────────────────────
  const perWeekDist = new Map<number, number>()
  const rateDist = new Map<number, number>()
  let simCount = 0
  events.forEach((e) => {
    if (e.type !== 'simulator_change' || !e.payload) return
    const pw = Number(e.payload.perWeek)
    const rt = Number(e.payload.rate)
    if (Number.isFinite(pw)) perWeekDist.set(pw, (perWeekDist.get(pw) ?? 0) + 1)
    if (Number.isFinite(rt)) rateDist.set(rt, (rateDist.get(rt) ?? 0) + 1)
    simCount++
  })
  const toSorted = (m: Map<number, number>) =>
    Array.from(m.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => a.value - b.value)

  return NextResponse.json({
    ok: true,
    totals: {
      pageviews: events.filter((e) => e.type === 'page_view').length,
      visitors: sVisit.size,
      demoClicks: sDemo.size,
      stripeClicks: sStripe.size,
    },
    byDay,
    bySrc,
    funnel,
    simulator: { total: simCount, perWeek: toSorted(perWeekDist), rate: toSorted(rateDist) },
  })
}

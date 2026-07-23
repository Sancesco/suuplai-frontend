import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendTelegram } from '@/lib/telegram'
import { deviceKey } from '@/lib/ua'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DAY = 24 * 60 * 60 * 1000
function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

// GET /api/cron/daily-summary — lo dispara el cron de Vercel a las 8 PM CDMX.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const [{ data: evData }, { data: linkData }] = await Promise.all([
    supabase.from('events').select('type,session_id,src,user_agent,created_at').in('type', ['page_view', 'link_click']).order('created_at', { ascending: false }).limit(50000),
    supabase.from('links').select('slug,label,clicks,archived,created_at'),
  ])
  const events = (evData ?? []) as { type: string; session_id: string | null; src: string | null; user_agent: string | null; created_at: string }[]
  const links = (linkData ?? []) as { slug: string; label: string | null; clicks: number; archived: boolean; created_at: string }[]

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
  const todays = events.filter((e) => dayKey(e.created_at) === today)

  const visits = todays.filter((e) => e.type === 'page_view').length
  const people = new Set(todays.filter((e) => e.type === 'page_view' && e.session_id).map((e) => e.session_id as string)).size
  const clicksToday = todays.filter((e) => e.type === 'link_click')

  // Si no hubo NADA, no mandamos nada (prefiere silencio a ruido).
  if (visits === 0 && clicksToday.length === 0) {
    return NextResponse.json({ ok: true, sent: false })
  }

  const labelOf = (slug: string) => links.find((l) => l.slug === slug)?.label || slug

  // Links abiertos hoy
  const opened = Array.from(new Set(clicksToday.map((e) => e.src).filter(Boolean) as string[]))

  // Revisitas y compartidos hoy (usando el histórico completo de link_click)
  const clickHistory = events.filter((e) => e.type === 'link_click')
  const revisits = new Set<string>()
  const shared = new Set<string>()
  clicksToday.forEach((e) => {
    if (!e.src) return
    const dk = deviceKey(e.user_agent)
    const t = new Date(e.created_at).getTime()
    const priors = clickHistory.filter((p) => p.src === e.src && new Date(p.created_at).getTime() < t)
    // revisita: mismo dispositivo visto hace 24h+
    if (priors.some((p) => deviceKey(p.user_agent) === dk && t - new Date(p.created_at).getTime() >= DAY)) revisits.add(e.src)
    // compartido: dispositivo NUEVO respecto a los previos
    if (priors.length > 0 && !priors.some((p) => deviceKey(p.user_agent) === dk)) shared.add(e.src)
  })

  const now = Date.now()
  const sinAbrir = links.filter((l) => !l.archived && l.clicks === 0 && now - new Date(l.created_at).getTime() > 2 * DAY).length

  const lines: string[] = ['📊 <b>Resumen del día</b>']
  lines.push(`· ${visits} visitas de ${people} personas distintas`)
  lines.push(`· Links abiertos: ${opened.length ? opened.map(labelOf).join(', ') : 'ninguno'}`)
  if (revisits.size) lines.push(`· 🔥 Revisitas: ${Array.from(revisits).map(labelOf).join(', ')}`)
  if (shared.size) lines.push(`· 🔥 Compartidos: ${Array.from(shared).map(labelOf).join(', ')}`)
  lines.push(`· Sin abrir hace +48h: ${sinAbrir} links`)

  await sendTelegram(lines.join('\n'))
  return NextResponse.json({ ok: true, sent: true })
}

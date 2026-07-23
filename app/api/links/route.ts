import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { deviceKey } from '@/lib/ua'

export const runtime = 'nodejs'

function authed(req: Request): boolean | null {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return null
  return req.headers.get('x-admin-password') === expected
}

function slugify(raw: string): string {
  const noAccents = raw
    .normalize('NFD')
    .split('')
    .filter((ch) => {
      const c = ch.charCodeAt(0)
      return c < 0x0300 || c > 0x036f
    })
    .join('')
  return noAccents.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function withSrc(dest: string, slug: string): string {
  if (/[?&]src=/.test(dest)) return dest
  return dest + (dest.includes('?') ? '&' : '?') + 'src=' + encodeURIComponent(slug)
}

const DAY = 24 * 60 * 60 * 1000

interface LinkDb {
  id: string
  slug: string
  destination: string
  label: string | null
  clicks: number
  notify: boolean
  archived: boolean
  category: string | null
  notes: string | null
  created_at: string
  first_click_at: string | null
  last_click_at: string | null
}

// ── GET /api/links — lista con agregados por link + filtros ──────────────────
export async function GET(req: Request) {
  const ok = authed(req)
  if (ok === null) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (!ok) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const { data: linksData, error } = await supabase
    .from('links')
    .select('id,slug,destination,label,clicks,notify,archived,category,notes,created_at,first_click_at,last_click_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  const links = (linksData ?? []) as LinkDb[]

  // Eventos para agregados por src
  const { data: clickEv } = await supabase
    .from('events').select('src,user_agent,city,created_at').eq('type', 'link_click').limit(50000)
  const { data: pvEv } = await supabase
    .from('events').select('src,session_id').eq('type', 'page_view').limit(50000)

  // Agregados por slug
  const agg = new Map<string, { devices: Set<string>; cities: Set<string>; sessions: Set<string>; revisits: number; firstByDevice: Map<string, number> }>()
  const get = (slug: string) => {
    let a = agg.get(slug)
    if (!a) { a = { devices: new Set(), cities: new Set(), sessions: new Set(), revisits: 0, firstByDevice: new Map() }; agg.set(slug, a) }
    return a
  }
  ;((clickEv ?? []) as { src: string | null; user_agent: string | null; city: string | null; created_at: string }[])
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .forEach((e) => {
      if (!e.src) return
      const a = get(e.src)
      const dk = deviceKey(e.user_agent)
      a.devices.add(dk)
      a.cities.add(e.city || 'desconocido')
      const t = new Date(e.created_at).getTime()
      const first = a.firstByDevice.get(dk)
      if (first == null) a.firstByDevice.set(dk, t)
      else if (t - first >= DAY) a.revisits++
    })
  ;((pvEv ?? []) as { src: string | null; session_id: string | null }[]).forEach((e) => {
    if (e.src && e.session_id) get(e.src).sessions.add(e.session_id)
  })

  const rows = links.map((l) => {
    const a = agg.get(l.slug)
    const created = new Date(l.created_at).getTime()
    const timeToFirstMs = l.first_click_at ? new Date(l.first_click_at).getTime() - created : null
    let temp: 'caliente' | 'tibio' | 'frio' | null = null
    if (timeToFirstMs != null) temp = timeToFirstMs < 60 * 60 * 1000 ? 'caliente' : timeToFirstMs < DAY ? 'tibio' : timeToFirstMs > 3 * DAY ? 'frio' : 'tibio'
    const devices = a?.devices.size ?? 0
    return {
      ...l,
      lastVisit: l.last_click_at,
      sessions: a?.sessions.size ?? 0,
      devices,
      cities: a?.cities.size ?? 0,
      revisits: a?.revisits ?? 0,
      shared: devices >= 2,
      timeToFirstMs,
      temp,
    }
  })

  // ── Filtros (query params) ─────────────────────────────────────────────────
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.toLowerCase() || ''
  const clicksF = url.searchParams.get('clicks') || '' // 'con' | 'sin'
  const cat = url.searchParams.get('category') || ''
  const from = url.searchParams.get('from') || ''
  const to = url.searchParams.get('to') || ''

  let filtered = rows
  if (q) filtered = filtered.filter((r) => r.slug.toLowerCase().includes(q) || (r.label || '').toLowerCase().includes(q))
  if (clicksF === 'con') filtered = filtered.filter((r) => r.clicks > 0)
  if (clicksF === 'sin') filtered = filtered.filter((r) => r.clicks === 0)
  if (cat) filtered = filtered.filter((r) => (r.category || '') === cat)
  if (from) filtered = filtered.filter((r) => r.created_at >= from)
  if (to) filtered = filtered.filter((r) => r.created_at <= to + 'T23:59:59')

  return NextResponse.json({ ok: true, links: filtered })
}

// ── POST /api/links — crear (con categoría y notas) ──────────────────────────
export async function POST(req: Request) {
  const ok = authed(req)
  if (ok === null) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (!ok) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  let body: { slug?: string; destination?: string; label?: string; category?: string; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 })
  }

  const slug = slugify(String(body.slug ?? ''))
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: 'Slug inválido (usa minúsculas, sin espacios ni acentos)' }, { status: 400 })
  }

  let destination = String(body.destination ?? '').trim() || '/agente-comercial'
  destination = withSrc(destination, slug)

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const { data, error } = await supabase
    .from('links')
    .insert({
      slug,
      destination,
      label: body.label?.trim() || null,
      category: body.category?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .select('id,slug')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ ok: false, error: 'Ese slug ya existe' }, { status: 409 })
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, link: data })
}

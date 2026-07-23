import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

function authed(req: Request): boolean | null {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return null // no configurado
  return req.headers.get('x-admin-password') === expected
}

// slug: minúsculas, sin espacios ni acentos, solo a-z 0-9 y guiones.
function slugify(raw: string): string {
  // Quita marcas combinantes (acentos) por code-point, sin depender de rangos regex.
  const noAccents = raw
    .normalize('NFD')
    .split('')
    .filter((ch) => {
      const c = ch.charCodeAt(0)
      return c < 0x0300 || c > 0x036f
    })
    .join('')
  return noAccents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function withSrc(dest: string, slug: string): string {
  if (/[?&]src=/.test(dest)) return dest
  return dest + (dest.includes('?') ? '&' : '?') + 'src=' + encodeURIComponent(slug)
}

// ── GET /api/links — lista con clics y última visita ─────────────────────────
export async function GET(req: Request) {
  const ok = authed(req)
  if (ok === null) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (!ok) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const { data: links, error } = await supabase
    .from('links')
    .select('id,slug,destination,label,clicks,archived,created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  // Última visita por slug (desde events link_click)
  const { data: clicks } = await supabase
    .from('events')
    .select('src,created_at')
    .eq('type', 'link_click')
    .order('created_at', { ascending: false })
    .limit(20000)
  const lastVisit = new Map<string, string>()
  ;(clicks ?? []).forEach((c: { src: string | null; created_at: string }) => {
    if (c.src && !lastVisit.has(c.src)) lastVisit.set(c.src, c.created_at)
  })

  const rows = (links ?? []).map((l: { slug: string } & Record<string, unknown>) => ({
    ...l,
    lastVisit: lastVisit.get(l.slug) ?? null,
  }))

  return NextResponse.json({ ok: true, links: rows })
}

// ── POST /api/links — crear ──────────────────────────────────────────────────
export async function POST(req: Request) {
  const ok = authed(req)
  if (ok === null) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (!ok) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  let body: { slug?: string; destination?: string; label?: string }
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
  const label = body.label?.trim() || null

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const { data, error } = await supabase
    .from('links')
    .insert({ slug, destination, label })
    .select('id,slug,destination,label,clicks,archived,created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: false, error: 'Ese slug ya existe' }, { status: 409 })
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, link: data })
}

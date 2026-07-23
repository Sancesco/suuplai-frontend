import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

interface TrackBody {
  type?: string
  payload?: unknown
  sessionId?: string
  src?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  referrer?: string | null
  userAgent?: string | null
  path?: string | null
}

// Rate limit simple en memoria por IP (best-effort; se reinicia con cada instancia).
const WINDOW_MS = 10_000
const MAX_PER_WINDOW = 40
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const cur = hits.get(ip)
  if (!cur || now > cur.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  cur.count++
  return cur.count > MAX_PER_WINDOW
}

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.slice(0, max) : null)

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: 'rate limit' }, { status: 429 })
  }

  let body: TrackBody
  try {
    body = (await req.json()) as TrackBody
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 })
  }

  const type = typeof body.type === 'string' && body.type.length <= 64 ? body.type : null
  if (!type) {
    return NextResponse.json({ ok: false, error: 'type requerido' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'analytics no configurado' }, { status: 503 })
  }

  const { error } = await supabase.from('events').insert({
    type,
    payload: body.payload ?? null,
    session_id: str(body.sessionId, 80),
    src: str(body.src, 120),
    utm_source: str(body.utmSource, 120),
    utm_medium: str(body.utmMedium, 120),
    utm_campaign: str(body.utmCampaign, 120),
    referrer: str(body.referrer, 500),
    user_agent: str(body.userAgent, 400),
    path: str(body.path, 200),
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

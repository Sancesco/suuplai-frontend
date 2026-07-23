import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/live — sesiones con actividad en los últimos 5 minutos.
export async function GET(req: Request) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (req.headers.get('x-admin-password') !== expected) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('events')
    .select('session_id,src,path,city,created_at')
    .in('type', ['heartbeat', 'page_view'])
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2000)

  const seen = new Map<string, { src: string | null; path: string | null; city: string | null; lastSeen: string }>()
  ;((data ?? []) as { session_id: string | null; src: string | null; path: string | null; city: string | null; created_at: string }[]).forEach((e) => {
    if (e.session_id && !seen.has(e.session_id)) {
      seen.set(e.session_id, { src: e.src, path: e.path, city: e.city, lastSeen: e.created_at })
    }
  })

  const sessions = Array.from(seen.entries()).map(([sessionId, v]) => ({ sessionId, ...v }))
  return NextResponse.json({ ok: true, count: sessions.length, sessions })
}

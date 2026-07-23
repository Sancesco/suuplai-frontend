import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { deviceKey } from '@/lib/ua'

export const runtime = 'nodejs'

function authed(req: Request): boolean | null {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return null
  return req.headers.get('x-admin-password') === expected
}

// GET /api/links/:id — detalle con lista de sesiones
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const ok = authed(req)
  if (ok === null) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (!ok) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const { data: link } = await supabase.from('links').select('*').eq('id', params.id).maybeSingle()
  if (!link) return NextResponse.json({ ok: false, error: 'No existe' }, { status: 404 })

  const { data: ev } = await supabase
    .from('events')
    .select('type,session_id,user_agent,city,created_at,payload')
    .eq('src', (link as { slug: string }).slug)
    .in('type', ['page_view', 'exit'])
    .order('created_at', { ascending: true })
    .limit(5000)

  interface Sess { sessionId: string; device: string; city: string; first: string; last: string; seconds: number }
  const byS = new Map<string, Sess>()
  ;((ev ?? []) as { type: string; session_id: string | null; user_agent: string | null; city: string | null; created_at: string; payload: Record<string, unknown> | null }[])
    .forEach((e) => {
      if (!e.session_id) return
      let s = byS.get(e.session_id)
      if (!s) {
        s = { sessionId: e.session_id, device: deviceKey(e.user_agent), city: e.city || 'desconocido', first: e.created_at, last: e.created_at, seconds: 0 }
        byS.set(e.session_id, s)
      }
      s.last = e.created_at
      if (e.type === 'exit') {
        const sec = Number(e.payload?.seconds)
        if (Number.isFinite(sec)) s.seconds = Math.max(s.seconds, sec)
      }
    })

  // Ordenar por primera visita y marcar new vs repeat (por dispositivo)
  const sessions = Array.from(byS.values()).sort((a, b) => new Date(a.first).getTime() - new Date(b.first).getTime())
  const seenDevice = new Set<string>()
  const withFlag = sessions.map((s) => {
    const repeat = seenDevice.has(s.device)
    seenDevice.add(s.device)
    return { ...s, repeat }
  }).reverse() // más recientes primero

  return NextResponse.json({ ok: true, link, sessions: withFlag })
}

// PATCH /api/links/:id — archivar / notify / notas / categoría
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ok = authed(req)
  if (ok === null) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (!ok) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  let body: { archived?: boolean; notify?: boolean; notes?: string; category?: string }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const update: Record<string, boolean | string | null> = {}
  if (typeof body.archived === 'boolean') update.archived = body.archived
  if (typeof body.notify === 'boolean') update.notify = body.notify
  if (typeof body.notes === 'string') update.notes = body.notes.trim() || null
  if (typeof body.category === 'string') update.category = body.category.trim() || null
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: 'Nada que actualizar' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const { error } = await supabase.from('links').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  return `"${s.replace(/"/g, '""')}"`
}
function toCsv(rows: Record<string, unknown>[], cols: string[]): string {
  const head = cols.join(',')
  const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n')
  return head + '\n' + body
}

// GET /api/export?type=links|events → descarga CSV
export async function GET(req: Request) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (req.headers.get('x-admin-password') !== expected) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const type = new URL(req.url).searchParams.get('type') === 'events' ? 'events' : 'links'
  let csv = ''
  if (type === 'links') {
    const { data } = await supabase.from('links').select('*').order('created_at', { ascending: false })
    csv = toCsv((data ?? []) as Record<string, unknown>[], [
      'slug', 'label', 'category', 'destination', 'clicks', 'notify', 'archived',
      'created_at', 'first_click_at', 'last_click_at', 'notes',
    ])
  } else {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(50000)
    csv = toCsv((data ?? []) as Record<string, unknown>[], [
      'created_at', 'type', 'src', 'session_id', 'city', 'country', 'path', 'user_agent', 'payload',
    ])
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="suuplai-${type}.csv"`,
    },
  })
}

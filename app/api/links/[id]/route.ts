import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

function authed(req: Request): boolean | null {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return null
  return req.headers.get('x-admin-password') === expected
}

// PATCH /api/links/:id — archivar (no borra, conserva el histórico)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ok = authed(req)
  if (ok === null) return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  if (!ok) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  let body: { archived?: boolean; notify?: boolean }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const update: Record<string, boolean> = {}
  if (typeof body.archived === 'boolean') update.archived = body.archived
  if (typeof body.notify === 'boolean') update.notify = body.notify
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: 'Nada que actualizar' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const { error } = await supabase.from('links').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

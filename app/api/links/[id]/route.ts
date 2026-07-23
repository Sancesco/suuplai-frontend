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

  let body: { archived?: boolean }
  try {
    body = await req.json()
  } catch {
    body = { archived: true }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })

  const { error } = await supabase
    .from('links')
    .update({ archived: body.archived ?? true })
    .eq('id', params.id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

// Lista los registros para el panel /admin. Protegido por contraseña.
export async function GET(req: Request) {
  const password = req.headers.get('x-admin-password')
  const expected = process.env.ADMIN_PASSWORD

  if (!expected) {
    return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurada' }, { status: 503 })
  }
  if (password !== expected) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Backend no configurado' }, { status: 503 })
  }

  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, registros: data })
}

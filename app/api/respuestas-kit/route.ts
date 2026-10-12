import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'
import { KIT } from '@/lib/vacantes/kit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Lee el banco de respuestas. Si está vacío, lo siembra con el KIT por defecto.
export async function GET(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const { data: ex } = await sb.from('respuestas_kit').select('id').limit(1)
  if (!ex || ex.length === 0) {
    await sb.from('respuestas_kit').insert(KIT.map((r) => ({ atajo: r.atajo, titulo: r.titulo, texto: r.texto, orden: r.orden })))
  }
  const { data } = await sb.from('respuestas_kit').select('*').order('orden', { ascending: true })
  return NextResponse.json({ ok: true, respuestas: data ?? [] })
}

// Edita una respuesta (texto / título).
export async function PATCH(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const id = String(b?.id ?? ''); if (!id) return NextResponse.json({ ok: false, error: 'falta id' }, { status: 400 })
  const patch: Record<string, unknown> = { actualizada_en: new Date().toISOString() }
  if (b.texto !== undefined) patch.texto = String(b.texto ?? '')
  if (b.titulo !== undefined) patch.titulo = String(b.titulo ?? '')
  const { error } = await sb.from('respuestas_kit').update(patch).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

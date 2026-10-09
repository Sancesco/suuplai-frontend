import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const { data } = await sb.from('outbound_plantilla').select('*').eq('activa', true).order('version', { ascending: false }).limit(1).maybeSingle()
  return NextResponse.json({ ok: true, plantilla: data })
}

// Guarda una nueva versión (la anterior queda inactiva pero guardada).
export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const asunto = String(b?.asunto ?? '').trim()
  const cuerpo = String(b?.cuerpo ?? '').trim()
  if (!asunto || !cuerpo) return NextResponse.json({ ok: false, error: 'falta asunto o cuerpo' }, { status: 400 })
  if (!/\{\{slug\}\}/.test(cuerpo)) return NextResponse.json({ ok: false, error: 'el cuerpo debe incluir {{slug}} (para el link rastreado y el CV)' }, { status: 400 })
  const { data: act } = await sb.from('outbound_plantilla').select('version').order('version', { ascending: false }).limit(1).maybeSingle()
  const version = (act?.version ?? 0) + 1
  await sb.from('outbound_plantilla').update({ activa: false }).eq('activa', true)
  const { error } = await sb.from('outbound_plantilla').insert({
    version, asunto, cuerpo, recordatorio_1: String(b?.recordatorio_1 ?? '').trim(), recordatorio_2: String(b?.recordatorio_2 ?? '').trim(), activa: true,
  })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, version })
}

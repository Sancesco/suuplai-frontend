import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'
import { detectarEmpresaDesdeUrl } from '@/lib/vacantes/descubrir'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Lista las empresas descubiertas (las de más vacantes relevantes primero).
export async function GET(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const { data } = await sb.from('empresas_objetivo').select('*').order('vacantes_relevantes', { ascending: false }).order('descubierta_en', { ascending: false })
  return NextResponse.json({ ok: true, empresas: data ?? [] })
}

// Pausar / activar / bloquear una empresa.
export async function PATCH(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const id = String(b?.id ?? ''); if (!id) return NextResponse.json({ ok: false, error: 'falta id' }, { status: 400 })
  const patch: Record<string, unknown> = {}
  if (b.activa !== undefined) patch.activa = b.activa === true
  if (b.bloqueada !== undefined) { patch.bloqueada = b.bloqueada === true; if (b.bloqueada === true) patch.activa = false }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: 'nada que actualizar' }, { status: 400 })
  const { error } = await sb.from('empresas_objetivo').update(patch).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Alta manual desde una URL de ATS (flujo secundario).
export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const det = detectarEmpresaDesdeUrl(String(b?.url ?? ''))
  if (!det) return NextResponse.json({ ok: false, error: 'esa URL no es de Greenhouse, Lever ni Ashby' }, { status: 400 })
  const nombre = String(b?.nombre ?? '').trim() || det.token
  const { error } = await sb.from('empresas_objetivo').upsert({ nombre, ats: det.ats, token: det.token, origen: 'manual', activa: true, bloqueada: false }, { onConflict: 'ats,token' })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, ...det })
}

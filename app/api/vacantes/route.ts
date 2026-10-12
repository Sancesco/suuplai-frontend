import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Lista todas las vacantes (ordenadas por puntaje y fecha). El filtrado fino se hace en el cliente.
export async function GET(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const { data } = await sb.from('vacantes').select('*').order('fit', { ascending: false, nullsFirst: false }).order('puntaje', { ascending: false }).order('fecha_publicada', { ascending: false, nullsFirst: false })
  return NextResponse.json({ ok: true, vacantes: data ?? [] })
}

// Mete una vacante A MANO (las que ves en LinkedIn/Indeed y quieres encolar). Dedup por clave.
export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const titulo = String(b?.titulo ?? '').trim()
  if (!titulo) return NextResponse.json({ ok: false, error: 'falta el puesto' }, { status: 400 })
  const empresa = String(b?.empresa ?? '').trim()
  const clave = crypto.createHash('md5').update((titulo + empresa).toLowerCase().replace(/\W+/g, '')).digest('hex').slice(0, 16)

  const { data: dup } = await sb.from('vacantes').select('id').eq('clave', clave).maybeSingle()
  if (dup) return NextResponse.json({ ok: true, id: dup.id, duplicada: true })

  const { data: ins, error } = await sb.from('vacantes').insert({
    clave, titulo, empresa: empresa || null,
    ubicacion: String(b?.ubicacion ?? '').trim() || null,
    descripcion: String(b?.descripcion ?? '').trim() || null,
    sueldo: String(b?.sueldo ?? '').trim() || null,
    link: String(b?.link ?? '').trim() || null,
    fuente: 'manual', puntaje: 5, estado: 'nueva',
  }).select('id').single()
  if (error || !ins) return NextResponse.json({ ok: false, error: error?.message || 'error' }, { status: 500 })
  return NextResponse.json({ ok: true, id: ins.id })
}

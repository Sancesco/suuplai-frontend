import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'
import { correrRadar, HAY_LLAVES } from '@/lib/vacantes/radar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Corre el radar y hace upsert por `clave`: inserta solo las vacantes nuevas, sin pisar estado,
// notas ni textos ya preparados de las que ya existen. Devuelve { nuevas, total, ejemplo }.
export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const b = await req.json().catch(() => null)
  const minPuntaje = Number.isFinite(b?.minPuntaje) ? Number(b.minPuntaje) : 3
  const encontradas = await correrRadar(minPuntaje)

  // claves ya en la base
  const { data: prev } = await sb.from('vacantes').select('clave')
  const existentes = new Set((prev ?? []).map((r: { clave: string }) => r.clave))

  const nuevas = encontradas.filter((v) => v.clave && !existentes.has(v.clave))
  if (nuevas.length) {
    await sb.from('vacantes').insert(nuevas.map((v) => ({
      clave: v.clave, titulo: v.titulo, empresa: v.empresa || null, ubicacion: v.ubicacion || null,
      descripcion: v.descripcion || null, sueldo: v.sueldo || null, link: v.link || null,
      fuente: v.fuente || null, fecha_publicada: v.fecha_publicada, puntaje: v.puntaje ?? 0, ingles: !!v.ingles,
    })))
  }
  return NextResponse.json({ ok: true, nuevas: nuevas.length, total: encontradas.length, ejemplo: !HAY_LLAVES() })
}

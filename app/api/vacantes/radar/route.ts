import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'
import { HAY_LLAVES } from '@/lib/vacantes/radar'
import { correrRadar } from '@/lib/vacantes/correr'
import { leerPreguntasGreenhouse, enLotes } from '@/lib/vacantes/ats'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const maxDuration = 60

// Corre el radar completo (agregadores + descubrimiento + empresas ATS) y hace upsert por `clave`:
// inserta solo las nuevas, sin pisar estado/notas/textos de las existentes. Jala preguntas de las
// nuevas de Greenhouse (máx 20). Devuelve { nuevas, total, ejemplo }.
export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const b = await req.json().catch(() => null)
  const minPuntaje = Number.isFinite(b?.minPuntaje) ? Number(b.minPuntaje) : 2
  const encontradas = await correrRadar(sb, { minPuntaje, descubrir: 'links' })

  const { data: prev } = await sb.from('vacantes').select('clave')
  const existentes = new Set((prev ?? []).map((r: { clave: string }) => r.clave))
  const nuevas = encontradas.filter((v) => v.clave && !existentes.has(v.clave))

  if (nuevas.length) {
    await sb.from('vacantes').insert(nuevas.map((v) => ({
      clave: v.clave, titulo: v.titulo, empresa: v.empresa || null, ubicacion: v.ubicacion || null,
      descripcion: v.descripcion || null, sueldo: v.sueldo || null, link: v.link || null, fuente: v.fuente || null,
      ats: v.ats || null, ats_token: v.ats_token || null, ats_job_id: v.ats_job_id || null,
      fecha_publicada: v.fecha_publicada, puntaje: v.puntaje ?? 0, ingles: !!v.ingles,
    })))

    // Preguntas de Greenhouse para las nuevas (máx 20, en lotes).
    const gh = nuevas.filter((v) => v.ats === 'greenhouse' && v.ats_token && v.ats_job_id).slice(0, 20)
    await enLotes(gh.map((v) => async () => {
      const preguntas = await leerPreguntasGreenhouse(v.ats_token!, v.ats_job_id!)
      if (preguntas.length) await sb.from('vacantes').update({ preguntas }).eq('clave', v.clave)
    }), 4)
  }
  return NextResponse.json({ ok: true, nuevas: nuevas.length, total: encontradas.length, ejemplo: !HAY_LLAVES() })
}

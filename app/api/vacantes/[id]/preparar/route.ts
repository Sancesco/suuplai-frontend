import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'
import { aiRawJSON } from '@/lib/ai'
import { PERFIL } from '@/lib/vacantes/perfil'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Prep = {
  respuestas?: { sueldo?: string; anios_ventas?: string; ingles?: string; disponibilidad?: string; porque?: string; experiencia_relevante?: string }
  carta?: string
  mensaje_contacto?: string
  nota_ingles?: string
}

const SYSTEM = `Eres el asistente de aplicaciones de Santiago Céspedes. Preparas respuestas para postularse a una vacante.
Reglas estrictas:
- Usa SOLO datos del PERFIL. Nunca inventes cifras, empresas, logros ni fechas que no estén ahí.
- Español de México, tono humano y directo. Nada de frases de IA ("en el dinámico mundo de...", "apasionado por") ni exageraciones.
- Adapta el "porque" a lo que hace la empresa según la descripción de la vacante.
- La carta: máximo 120 palabras. El mensaje_contacto (LinkedIn): máximo 600 caracteres.
- Si la vacante pide inglés y el perfil dice intermedio, dilo con honestidad en "nota_ingles".
Responde SOLO con un objeto JSON con esta forma:
{"respuestas":{"sueldo","anios_ventas","ingles","disponibilidad","porque","experiencia_relevante"},"carta","mensaje_contacto","nota_ingles"}`

// Genera carta + respuestas + mensaje de contacto para una vacante y los guarda en la fila.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const { data: v } = await sb.from('vacantes').select('*').eq('id', params.id).maybeSingle()
  if (!v) return NextResponse.json({ ok: false, error: 'no encontrada' }, { status: 404 })

  const user = `PERFIL:\n${PERFIL}\n\nVACANTE:\nPuesto: ${v.titulo}\nEmpresa: ${v.empresa || '—'}\nUbicación: ${v.ubicacion || '—'}\nSueldo: ${v.sueldo || '—'}\nDescripción: ${(v.descripcion || '').slice(0, 2500)}`

  let prep: Prep = {}
  try {
    const raw = await aiRawJSON(SYSTEM, user, 0.4, 1200)
    prep = JSON.parse(raw) as Prep
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'la IA no respondió bien: ' + (e instanceof Error ? e.message : 'error') }, { status: 502 })
  }

  const patch: Record<string, unknown> = {
    respuestas: prep.respuestas ?? {},
    carta: prep.carta ?? null,
    mensaje_contacto: prep.mensaje_contacto ?? null,
    actualizada_en: new Date().toISOString(),
  }
  // Al preparar, sube de 'nueva'/'interesa' a 'preparada' (sin bajar estados más avanzados).
  if (v.estado === 'nueva' || v.estado === 'interesa') patch.estado = 'preparada'

  const { error } = await sb.from('vacantes').update(patch).eq('id', params.id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, respuestas: prep.respuestas ?? {}, carta: prep.carta ?? '', mensaje_contacto: prep.mensaje_contacto ?? '', nota_ingles: prep.nota_ingles ?? '' })
}

import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'
import { aiRawJSON } from '@/lib/ai'
import { PERFIL } from '@/lib/vacantes/perfil'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const maxDuration = 60

type Base = { sueldo?: string; anios_ventas?: string; ingles?: string; disponibilidad?: string; porque?: string; experiencia_relevante?: string }
type Custom = { label: string; respuesta: string }
type Prep = { base?: Base; custom?: Custom[]; carta?: string; mensaje_contacto?: string; nota_ingles?: string }
type Pregunta = { label: string; required?: boolean; type?: string; opciones?: string[]; auto?: boolean }

const SYSTEM = `Eres el asistente de aplicaciones de Santiago Céspedes. Preparas respuestas para postularse a una vacante.
Reglas estrictas:
- Usa SOLO datos del PERFIL. Nunca inventes cifras, empresas, logros ni fechas que no estén ahí.
- Idioma: español de México si la vacante está en español; inglés si la vacante y sus preguntas están en inglés.
- Tono humano y directo. Nada de frases de IA ("apasionado por", "en el dinámico mundo de...") ni exageraciones.
- NUNCA uses guiones largos (— ni –) como puntuación; usa comas, puntos o paréntesis. (El guión largo delata texto de IA.)
- "custom": una respuesta por cada pregunta del formulario que te paso, EN EL MISMO ORDEN.
  - Para las preguntas marcadas auto=true (nombre, correo, teléfono, CV, LinkedIn, ubicación, EEO/demográficos) NO escribas respuesta: pon respuesta "".
  - Si la pregunta es de opción múltiple (trae opciones), la respuesta debe ser EXACTAMENTE una de las opciones.
  - Si una pregunta pide un dato que no está en el PERFIL, responde "[COMPLETAR: qué falta]".
- "base": { sueldo, anios_ventas, ingles, disponibilidad, porque, experiencia_relevante } para formularios sin preguntas conocidas.
- "carta": máximo 120 palabras. "mensaje_contacto": máximo 600 caracteres, para LinkedIn, con [link] donde va el CV.
- Adapta "porque" a lo que hace la empresa según la descripción.
- Si la vacante pide inglés avanzado, dilo en "nota_ingles".
Responde SOLO con JSON: {"base":{...},"custom":[{"label","respuesta"}],"carta","mensaje_contacto","nota_ingles"}`

// Genera respuestas (custom por pregunta + base) + carta + mensaje y las guarda.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const { data: v } = await sb.from('vacantes').select('*').eq('id', params.id).maybeSingle()
  if (!v) return NextResponse.json({ ok: false, error: 'no encontrada' }, { status: 404 })

  const preguntas = (Array.isArray(v.preguntas) ? v.preguntas : []) as Pregunta[]
  const listaPreg = preguntas.length
    ? 'PREGUNTAS DEL FORMULARIO (contesta en este orden en "custom"):\n' + preguntas.map((q, i) => `${i + 1}. ${q.label}${q.auto ? ' [auto=true]' : ''}${q.opciones && q.opciones.length ? ` [opciones: ${q.opciones.join(' | ')}]` : ''}`).join('\n')
    : 'No hay preguntas conocidas del formulario; deja "custom" vacío y llena "base".'
  const user = `PERFIL:\n${PERFIL}\n\nVACANTE:\nPuesto: ${v.titulo}\nEmpresa: ${v.empresa || '—'}\nUbicación: ${v.ubicacion || '—'}\nDescripción: ${(v.descripcion || '').slice(0, 2500)}\n\n${listaPreg}`

  let prep: Prep = {}
  try {
    const raw = await aiRawJSON(SYSTEM, user, 0.4, 1600)
    prep = JSON.parse(raw) as Prep
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'la IA no respondió bien: ' + (e instanceof Error ? e.message : 'error') }, { status: 502 })
  }

  const respuestas = { base: prep.base ?? {}, custom: Array.isArray(prep.custom) ? prep.custom : [] }
  const patch: Record<string, unknown> = { respuestas, carta: prep.carta ?? null, mensaje_contacto: prep.mensaje_contacto ?? null, actualizada_en: new Date().toISOString() }
  if (v.estado === 'nueva' || v.estado === 'interesa') patch.estado = 'preparada'

  const { error } = await sb.from('vacantes').update(patch).eq('id', params.id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, respuestas, carta: prep.carta ?? '', mensaje_contacto: prep.mensaje_contacto ?? '', nota_ingles: prep.nota_ingles ?? '' })
}

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRh, getTemplateById, type Invite, type Answer, type Template } from '@/lib/interview'
import { defaultRole } from '@/lib/roles'
import { aiRawJSON, parseJSON } from '@/lib/ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const body = await req.json().catch(() => null)
  const inviteId = String(body?.inviteId ?? '')
  if (!inviteId) return NextResponse.json({ ok: false, error: 'falta inviteId' }, { status: 400 })

  const { data: invRow } = await sb.from('interview_invites').select('*').eq('id', inviteId).maybeSingle()
  const invite = invRow as Invite | null
  if (!invite) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  const template = await getTemplateById(invite.template_id)
  if (!template) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  const { data: ansRows } = await sb.from('interview_answers').select('*').eq('invite_id', inviteId)
  const answers = new Map((ansRows as Answer[] ?? []).map((a) => [a.question_order, a]))

  const role = defaultRole()
  const dims = role.dimensions.map((dm) => `- ${dm.label}: ${dm.desc}`).join('\n')
  const quick = (template as Template).quick_fields.map((f) => `${f.label}: ${invite.quick_answers?.[f.key] ?? '(sin responder)'}`).join('\n')
  const qa = template.questions
    .filter((q) => answers.get(q.order)?.transcript)
    .map((q) => `Pregunta ${q.order}: ${q.text}\nRespuesta: "${answers.get(q.order)?.transcript}"`).join('\n\n')
  if (!qa) return NextResponse.json({ ok: false, error: 'aún no hay respuestas transcritas para calificar' }, { status: 400 })

  const SYSTEM = `Eres reclutador de Suuplai calificando para el rol "${role.name}".
CONTEXTO: ${role.context}
OBJETIVO: encontrar talento, NO descartar. Buscas fortalezas; premia ejemplos concretos y reales, no respuestas fluidas pero vacías. No castigues a alguien solo por sonar con poca energía. PROHIBIDO inferir emociones, personalidad o si miente.
Con base en TODAS las respuestas + los datos rápidos, califica estas dimensiones de 1 a 3 con una nota corta cada una:
${dims}
Luego da: un "perfil" de fortalezas de 3 líneas; el "superpoder" (la dimensión donde más destaca y a qué rol podría crecer: operación, ventas o contenido); "banderas" honestas (sueldo fuera de rango, encaje de formato, respuestas vacías); y una "recomendacion": "AGENDAR LLAMADA", "REVISAR" o "MEJOR NO".
SÉ CONCISO: cada "nota" máximo 10 palabras; "perfil" máximo 3 líneas; máximo 4 banderas cortas.
Responde SOLO JSON:
{"dimensiones":[{"label":"Palabra y constancia","score":2,"nota":"..."}],"perfil":"...","superpoder":{"dimension":"...","crecer":"..."},"banderas":["..."],"recomendacion":"AGENDAR LLAMADA"}`

  const user = `DATOS RÁPIDOS:\n${quick}\n\nRESPUESTAS (transcritas):\n${qa}`

  try {
    const raw = await aiRawJSON(SYSTEM, user)
    const calificacion = parseJSON(raw)
    const prev = (invite.analysis && typeof invite.analysis === 'object') ? invite.analysis as Record<string, unknown> : {}
    const analysis = { ...prev, calificacion }
    const { error: upErr } = await sb.from('interview_invites').update({ analysis }).eq('id', inviteId)
    return NextResponse.json({ ok: true, calificacion, saved: !upErr })
  } catch (e) {
    const m = e instanceof Error ? e.message : ''
    const sat = /429|too large|rate|limit|quota/i.test(m)
    return NextResponse.json({ ok: false, error: sat ? 'La IA está saturada (límite gratis por minuto). Espera ~1 min.' : 'No se pudo calificar, intenta de nuevo.', detail: m.slice(0, 200) }, { status: 502 })
  }
}

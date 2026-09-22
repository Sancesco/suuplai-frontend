import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRh, getTemplateById, type Invite, type Answer, type Template } from '@/lib/interview'
import { aiRawJSON, parseJSON } from '@/lib/ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SYSTEM = `Eres analista de RH de Suuplai. Analizas SOLO el contenido textual de las respuestas de una entrevista.
PROHIBIDO: inferir emociones, estado de ánimo, personalidad, ni si la persona miente. Nada de veredictos. Son señales orientativas.
Para CADA pregunta contestada evalúa:
- "concrecion" de 1 a 3: 3 si menciona nombres, números, lugares, fechas o resultados verificables; 1 si es vago y genérico.
- "contesto": "Sí" / "Parcial" / "No" (¿respondió lo que se preguntó?), con "porque" en una línea.
A nivel candidato:
- "contradicciones": entre respuestas o contra los datos rápidos. Cita las FRASES EXACTAS ("cita1","cita2") y una "nota" corta. Si no hay, arreglo vacío.
- "frasesAbsolutas": frases absolutas o que suenan ensayadas ("siempre","nunca","absolutamente","yo siempre cumplo"). Cita la frase exacta ("cita") y el número de "order". Si no hay, arreglo vacío.
SÉ MUY CONCISO: cada "porque" máximo 10 palabras; máximo 3 contradicciones y 4 frases absolutas.
Responde SOLO JSON:
{"porPregunta":[{"order":1,"concrecion":2,"contesto":"Sí","porque":"..."}],"contradicciones":[{"cita1":"...","cita2":"...","nota":"..."}],"frasesAbsolutas":[{"cita":"...","order":1}]}`

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

  const quick = (template as Template).quick_fields.map((f) => `${f.label}: ${invite.quick_answers?.[f.key] ?? '(sin responder)'}`).join('\n')
  const qa = template.questions
    .filter((q) => answers.get(q.order)?.transcript)
    .map((q) => `Pregunta ${q.order}: ${q.text}\nRespuesta: "${answers.get(q.order)?.transcript}"`).join('\n\n')
  if (!qa) return NextResponse.json({ ok: false, error: 'aún no hay respuestas transcritas para analizar' }, { status: 400 })

  const user = `DATOS RÁPIDOS (formulario):\n${quick}\n\nRESPUESTAS DE AUDIO (transcritas):\n${qa}`

  try {
    const raw = await aiRawJSON(SYSTEM, user)
    const content = parseJSON(raw) as Record<string, unknown>
    // Fusiona con lo previo (para no borrar una calificación ya hecha).
    const prev = (invite.analysis && typeof invite.analysis === 'object') ? invite.analysis as Record<string, unknown> : {}
    const analysis = { ...prev, porPregunta: content.porPregunta, contradicciones: content.contradicciones, frasesAbsolutas: content.frasesAbsolutas }
    const { error: upErr } = await sb.from('interview_invites').update({ analysis }).eq('id', inviteId)
    return NextResponse.json({ ok: true, analysis, saved: !upErr })
  } catch (e) {
    const m = e instanceof Error ? e.message : ''
    const sat = /429|too large|rate|limit|quota/i.test(m)
    return NextResponse.json({ ok: false, error: sat ? 'La IA está saturada (límite gratis por minuto). Espera ~1 min.' : 'No se pudo analizar, intenta de nuevo.', detail: m.slice(0, 200) }, { status: 502 })
  }
}

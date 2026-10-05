import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkPanel, getPerfil, type Application } from '@/lib/aplicaciones'
import { aiRawJSON, parseJSON } from '@/lib/ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SYS_ES = `Escribes correos de SEGUIMIENTO breves para una postulación de empleo que no ha tenido respuesta.
Tono cordial, directo, sin presionar ni sonar desesperado. Máximo 2 párrafos muy cortos. Recuerda quién eres en una línea, reitera interés y facilita el siguiente paso (una llamada / responder dudas). Usa SOLO lo que está en el PERFIL; no inventes.
Devuelve SOLO JSON: {"asunto":"asunto corto","cuerpo":"el correo en texto plano, con saludo y despedida"}`
const SYS_EN = `You write short FOLLOW-UP emails for a job application that hasn't gotten a reply.
Warm, direct tone, no pressure, not desperate. 2 very short paragraphs max. Remind who you are in one line, reiterate interest, make the next step easy (a quick call / answer questions). Use ONLY what's in the PROFILE; invent nothing.
Return ONLY JSON: {"asunto":"short subject (English)","cuerpo":"the email as plain text with greeting and sign-off (English)"}`

export async function POST(req: Request) {
  if (!checkPanel(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const id = String(b?.id ?? '')
  const { data: app } = await sb.from('app_applications').select('*').eq('id', id).maybeSingle()
  if (!app) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  const a = app as Application
  const idioma = a.idioma === 'en' ? 'en' : 'es'
  const dias = Math.max(0, Math.floor((Date.now() - new Date(a.created_at).getTime()) / 86400000))

  const user = `PERFIL:\n${getPerfil(idioma)}\n\nPOSTULACIÓN: ${a.empresa} — ${a.puesto}${a.persona ? `, dirigida a ${a.persona}` : ''}.\nHan pasado ${dias} días sin respuesta.`
  try {
    const raw = await aiRawJSON(idioma === 'en' ? SYS_EN : SYS_ES, user, 0.5, 700)
    const p = parseJSON(raw) as { asunto?: string; cuerpo?: string }
    const asunto = String(p.asunto ?? '').trim()
    const cuerpo = String(p.cuerpo ?? '').trim()
    if (!cuerpo) return NextResponse.json({ ok: false, error: 'la IA no devolvió correo' }, { status: 502 })
    return NextResponse.json({ ok: true, asunto, cuerpo })
  } catch (e) {
    const m = e instanceof Error ? e.message : ''
    const sat = /429|rate|limit|quota|too large/i.test(m)
    return NextResponse.json({ ok: false, error: sat ? 'La IA está saturada, espera ~1 min.' : 'No se pudo generar el correo.', detail: m.slice(0, 200) }, { status: 502 })
  }
}

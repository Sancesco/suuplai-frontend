import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkPanel, getPerfil, type Application } from '@/lib/aplicaciones'
import { aiRawJSON, parseJSON } from '@/lib/ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SYSTEM = `Escribes cartas de presentación para postularse a una vacante. REGLA DURA: solo usas lo que está en el PERFIL; nunca inventes ni infles experiencia, años, tecnologías ni números.
Tono directo, humano, SIN autobombo. Máximo 4 párrafos cortos. Apóyate en los argumentos fuertes del análisis. Si hay un hueco relevante, reconócelo en una línea sin dramatizar.
Devuelve SOLO JSON: {"posicionamiento":"una línea de posicionamiento para el encabezado","carta_html":"la carta en HTML simple: solo <p> y <strong>, sin estilos ni encabezados"}`
const SYSTEM_EN = `You write cover letters to apply for a job. HARD RULE: use ONLY what is in the PROFILE; never invent or inflate experience, years, technologies or numbers.
Direct, human tone, NO self-aggrandizing. 4 short paragraphs max. Lean on the analysis's strong arguments. If there is a relevant gap, acknowledge it in one line without drama.
Return ONLY JSON: {"posicionamiento":"a one-line positioning for the header (in English)","carta_html":"the letter in simple HTML: only <p> and <strong>, no styles or headings (in English)"}`

export async function POST(req: Request) {
  if (!checkPanel(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const id = String(b?.id ?? '')
  const { data: app } = await sb.from('app_applications').select('*').eq('id', id).maybeSingle()
  if (!app) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  const a = app as Application

  const idioma = a.idioma === 'en' ? 'en' : 'es'
  const user = `PERFIL:\n${getPerfil(idioma)}\n\nVACANTE (${a.empresa} — ${a.puesto}${a.persona ? ', dirigida a ' + a.persona : ''}):\n${a.vacante.slice(0, 6000)}\n\nARGUMENTOS FUERTES (del análisis): ${(a.analysis?.argumentos || []).join(' · ')}\nHUECOS: ${(a.analysis?.huecos || []).join(' · ')}`
  try {
    const raw = await aiRawJSON(idioma === 'en' ? SYSTEM_EN : SYSTEM, user, 0.5, 1200)
    const p = parseJSON(raw) as { posicionamiento?: string; carta_html?: string }
    const posicionamiento = String(p.posicionamiento ?? '').trim()
    const carta = String(p.carta_html ?? '').trim()
    if (!carta) return NextResponse.json({ ok: false, error: 'la IA no devolvió carta' }, { status: 502 })
    await sb.from('app_applications').update({ carta, posicionamiento: posicionamiento || a.posicionamiento }).eq('id', id)
    return NextResponse.json({ ok: true, posicionamiento, carta })
  } catch (e) {
    const m = e instanceof Error ? e.message : ''
    const sat = /429|rate|limit|quota|too large/i.test(m)
    return NextResponse.json({ ok: false, error: sat ? 'La IA está saturada, espera ~1 min.' : 'No se pudo generar la carta.', detail: m.slice(0, 200) }, { status: 502 })
  }
}

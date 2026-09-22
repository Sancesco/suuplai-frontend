import { NextResponse } from 'next/server'
import { checkRh } from '@/lib/interview'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Genera 3 preguntas personalizadas (indirectas) a partir del texto del CV.
// Usa Groq (gratis, Llama 3.3 70B) si hay GROQ_API_KEY; si no, Gemini con GEMINI_API_KEY.
// No guarda el CV.
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

const GUIA = `Eres reclutador de Suuplai. El puesto es de CAMPO Y OPERACIÓN: ventas y visitas a tiendas, trabajo de calle, pago por día.
Vas a escribir 3 preguntas de entrevista PERSONALIZADAS para este candidato, en español de México.
Reglas MUY importantes:
- Son INDIRECTAS: no deben delatar qué estás midiendo, y NO menciones "tiendas", "calle" ni "ventas" de forma obvia.
- Deben lograr que, por la respuesta, se note si sirve para trabajo de calle: constancia, trato con la gente, iniciativa, aguante ante un "no", energía.
- NO hagas preguntas que inviten a autodescartarse (ej. "¿te aguantas la talacha?"). Convencerlo es parte del trabajo.
- Haz un guiño neutral a su experiencia del CV, pero sin revelar la intención.
- Cada pregunta pide contar una anécdota concreta ("cuéntame de una vez que...").
- Cada pregunta trae una rúbrica de 3 niveles (1 flojo, 2 aceptable, 3 muy bien), cortita.
Responde SOLO un JSON válido con esta forma exacta:
{"perfil":"una línea con el perfil","duda":"una línea con la duda principal a resolver","questions":[{"text":"...","rubric":{"1":"...","2":"...","3":"..."}},{"text":"...","rubric":{"1":"...","2":"...","3":"..."}},{"text":"...","rubric":{"1":"...","2":"...","3":"..."}}]}`

// Llama a Groq (OpenAI-compatible) y devuelve el texto JSON crudo.
async function callGroq(key: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: GUIA }, { role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

// Llama a Gemini y devuelve el texto JSON crudo.
async function callGemini(key: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: `${GUIA}\n\n${prompt}` }] }], generationConfig: { temperature: 0.7, responseMimeType: 'application/json' } }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function POST(req: Request) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  if (!groqKey && !geminiKey) return NextResponse.json({ ok: false, error: 'falta GROQ_API_KEY (o GEMINI_API_KEY) en el servidor' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const name = String(body?.name ?? '').trim()
  const cvText = String(body?.cvText ?? '').trim().slice(0, 12000)
  if (!cvText) return NextResponse.json({ ok: false, error: 'no se pudo leer el CV (¿es una imagen escaneada sin texto?)' }, { status: 400 })

  const prompt = `Nombre: ${name || '(sin nombre)'}\n\nTexto del CV:\n"""${cvText}"""`

  try {
    const raw = groqKey ? await callGroq(groqKey, prompt) : await callGemini(geminiKey as string, prompt)
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '')) }
    const p = parsed as { perfil?: string; duda?: string; questions?: { text?: string; rubric?: Record<string, string> }[] }
    const questions = (p.questions ?? []).slice(0, 3).map((q) => ({
      text: String(q?.text ?? '').trim(),
      rubric: {
        '1': String(q?.rubric?.['1'] ?? '').trim() || 'Flojo o no responde',
        '2': String(q?.rubric?.['2'] ?? '').trim() || 'Aceptable',
        '3': String(q?.rubric?.['3'] ?? '').trim() || 'Muy bien, ejemplo concreto',
      },
    })).filter((q) => q.text)
    if (!questions.length) return NextResponse.json({ ok: false, error: 'la IA no devolvió preguntas' }, { status: 502 })
    return NextResponse.json({ ok: true, perfil: String(p.perfil ?? '').trim(), duda: String(p.duda ?? '').trim(), questions })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'error llamando a la IA', detail: e instanceof Error ? e.message : '' }, { status: 502 })
  }
}

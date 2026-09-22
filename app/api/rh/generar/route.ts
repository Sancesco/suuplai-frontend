import { NextResponse } from 'next/server'
import { checkRh } from '@/lib/interview'
import { getRole, defaultRole, type Role } from '@/lib/roles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Genera 3 preguntas personalizadas (indirectas) a partir del texto del CV, según el ROL.
// Usa Groq (gratis) si hay GROQ_API_KEY; si no, Gemini con GEMINI_API_KEY. No guarda el CV.
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

function guiaFor(role: Role): string {
  const dims = role.dimensions.map((d) => `- ${d.label}: ${d.desc}`).join('\n')
  return `Eres reclutador de Suuplai contratando para el rol "${role.name}".

CONTEXTO DEL PUESTO:
${role.context}

OBJETIVO DE LA ENTREVISTA:
${role.objetivo}

DIMENSIONES QUE LA ENTREVISTA DEBE PODER MEDIR (en conjunto):
${dims}

TU TAREA: arma la entrevista COMPLETA para ESTE candidato, en español de México, a partir de su CV.
- TÚ DECIDES cuántas preguntas necesitas: entre 3 y 10, las que hagan falta para cubrir bien las dimensiones según este perfil. Un CV con más que mostrar puede llevar más preguntas; uno sencillo, menos.
- Las preguntas juntas deben cubrir las 8 dimensiones (constancia, trato, resolver, aguante, observación, iniciativa, motor y encaje). No repitas dimensión sin razón.
- Están tailoreadas al CV: haz un guiño neutral a su experiencia real.
Reglas:
- INDIRECTAS: no delates qué mides; NO menciones "tiendas", "calle" ni "ventas" de forma obvia.
- Cada pregunta debe DARLE LA OPORTUNIDAD DE LUCIRSE (buscamos fortalezas, no descartar). Nada que invite a autodescartarse.
- Pide una anécdota concreta ("cuéntame de una vez que...").
- Rúbrica de 3 niveles cortita (1 flojo, 2 aceptable, 3 muy bien).
Además EXTRAE del CV el nombre completo del candidato y su teléfono celular (10 dígitos, solo números). Si no aparece alguno, déjalo como "". NO extraigas ningún otro dato personal.
Responde SOLO un JSON válido (la lista "questions" con la cantidad que TÚ decidas, entre 3 y 10):
{"nombre":"nombre completo o \"\"","telefono":"10 dígitos o \"\"","perfil":"una línea que resuma su experiencia y posible superpoder, no solo el nombre","duda":"una línea con la duda principal a resolver","questions":[{"text":"...","rubric":{"1":"...","2":"...","3":"..."}}]}`
}

// Llama a Groq (OpenAI-compatible) y devuelve el texto JSON crudo.
async function callGroq(key: string, guia: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: guia }, { role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

// Llama a Gemini y devuelve el texto JSON crudo.
async function callGemini(key: string, guia: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: `${guia}\n\n${prompt}` }] }], generationConfig: { temperature: 0.7, responseMimeType: 'application/json' } }),
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
  const role = getRole(body?.roleKey) ?? defaultRole()
  const cvText = String(body?.cvText ?? '').trim().slice(0, 12000)
  if (!cvText) return NextResponse.json({ ok: false, error: 'no se pudo leer el CV (¿es una imagen escaneada sin texto?)' }, { status: 400 })

  const guia = guiaFor(role)
  const prompt = `Nombre: ${name || '(sin nombre)'}\n\nTexto del CV:\n"""${cvText}"""`

  try {
    const raw = groqKey ? await callGroq(groqKey, guia, prompt) : await callGemini(geminiKey as string, guia, prompt)
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '')) }
    const p = parsed as { nombre?: string; telefono?: string; perfil?: string; duda?: string; questions?: { text?: string; rubric?: Record<string, string> }[] }
    const telefono = String(p.telefono ?? '').replace(/\D/g, '').slice(-10)
    const questions = (p.questions ?? []).slice(0, 10).map((q) => ({
      text: String(q?.text ?? '').trim(),
      rubric: {
        '1': String(q?.rubric?.['1'] ?? '').trim() || 'Flojo o no responde',
        '2': String(q?.rubric?.['2'] ?? '').trim() || 'Aceptable',
        '3': String(q?.rubric?.['3'] ?? '').trim() || 'Muy bien, ejemplo concreto',
      },
    })).filter((q) => q.text)
    if (!questions.length) return NextResponse.json({ ok: false, error: 'la IA no devolvió preguntas' }, { status: 502 })
    return NextResponse.json({ ok: true, nombre: String(p.nombre ?? '').trim(), telefono, perfil: String(p.perfil ?? '').trim(), duda: String(p.duda ?? '').trim(), questions })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'error llamando a la IA', detail: e instanceof Error ? e.message : '' }, { status: 502 })
  }
}

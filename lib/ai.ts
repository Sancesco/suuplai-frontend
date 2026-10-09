// Router de IA con failover en cadena: si una llave/proveedor se satura (rate limit)
// o falla, pasa a la siguiente. Orden: Groq(1) → Groq(2) → AionLabs → Gemini.
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
const AION_MODEL = process.env.AIONLABS_MODEL || 'aion-labs/aion-3.5-mini'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

// Proveedores compatibles con OpenAI (Groq y AionLabs comparten formato).
async function openaiCompatJSON(baseUrl: string, key: string, model: string, system: string, user: string, temperature: number, maxTokens: number): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature, max_tokens: maxTokens, response_format: { type: 'json_object' } }),
  })
  if (!res.ok) throw new Error(`${model} ${res.status}: ${(await res.text()).slice(0, 160)}`)
  const d = await res.json()
  return d?.choices?.[0]?.message?.content ?? ''
}

async function geminiJSON(key: string, system: string, user: string, temperature: number, maxTokens: number): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: `${system}\n\n${user}` }] }], generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: 'application/json' } }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 160)}`)
  const d = await res.json()
  return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// maxTokens capa la salida (el tier gratis de Groq limita los tokens de salida por minuto).
export async function aiRawJSON(system: string, user: string, temperature = 0.3, maxTokens = 900): Promise<string> {
  const chain: { nombre: string; run: () => Promise<string> }[] = []
  if (process.env.GROQ_API_KEY) chain.push({ nombre: 'groq-1', run: () => openaiCompatJSON('https://api.groq.com/openai/v1', process.env.GROQ_API_KEY!, GROQ_MODEL, system, user, temperature, maxTokens) })
  if (process.env.GROQ_API_KEY_2) chain.push({ nombre: 'groq-2', run: () => openaiCompatJSON('https://api.groq.com/openai/v1', process.env.GROQ_API_KEY_2!, GROQ_MODEL, system, user, temperature, maxTokens) })
  if (process.env.AIONLABS_API_KEY) chain.push({ nombre: 'aionlabs', run: () => openaiCompatJSON('https://api.aionlabs.ai/v1', process.env.AIONLABS_API_KEY!, AION_MODEL, system, user, temperature, maxTokens) })
  if (process.env.GEMINI_API_KEY) chain.push({ nombre: 'gemini', run: () => geminiJSON(process.env.GEMINI_API_KEY!, system, user, temperature, maxTokens) })
  if (!chain.length) throw new Error('falta alguna API key de IA (GROQ_API_KEY / AIONLABS_API_KEY / GEMINI_API_KEY)')

  let lastErr: unknown
  for (const p of chain) {
    try { const out = await p.run(); if (out && out.trim()) return out } // vacío → siguiente
    catch (e) { lastErr = e } // rate limit / error → siguiente proveedor
  }
  throw lastErr instanceof Error ? lastErr : new Error('todas las IAs fallaron')
}

export function parseJSON(raw: string): unknown {
  try { return JSON.parse(raw) } catch { return JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '').trim()) }
}

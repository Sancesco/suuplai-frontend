// Llamada a IA que devuelve JSON crudo. Usa Groq si hay GROQ_API_KEY, si no Gemini.
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

export async function aiRawJSON(system: string, user: string, temperature = 0.3): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  if (groqKey) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature, response_format: { type: 'json_object' } }),
    })
    if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const d = await res.json()
    return d?.choices?.[0]?.message?.content ?? ''
  }
  if (geminiKey) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${system}\n\n${user}` }] }], generationConfig: { temperature, responseMimeType: 'application/json' } }),
    })
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const d = await res.json()
    return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }
  throw new Error('falta GROQ_API_KEY o GEMINI_API_KEY en el servidor')
}

export function parseJSON(raw: string): unknown {
  try { return JSON.parse(raw) } catch { return JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '').trim()) }
}

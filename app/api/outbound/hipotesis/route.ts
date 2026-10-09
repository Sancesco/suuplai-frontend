import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'
import { aiRawJSON, parseJSON } from '@/lib/ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const maxDuration = 60

type Brazo = { id: string; texto: string; es_control: boolean; envios_maduros: number; clics: number; respuestas: number }

const SYSTEM = `Eres el optimizador de una campaña de correos en frío para la búsqueda de trabajo de Santiago. Lees el DESEMPEÑO actual (asuntos probados, cuántos clics y respuestas llevan, cuántos abren pero no contestan vs nunca abren) y propones 1 o 2 ASUNTOS NUEVOS para probar.
REGLAS:
- Fúndate SOLO en los datos que te doy. No inventes cifras.
- Si "nunca abren" es alto → el problema es el asunto: propón asuntos más intrigantes o directos.
- Si "abren y no contestan" es alto → el asunto jala pero el cuerpo no; propón asuntos que no sobrevendan.
- Voz de Santiago: directo, sin relaciones públicas. Asuntos cortos (máx 8 palabras). Puedes usar {{empresa}}.
- Si no hay señal suficiente, propón variaciones conservadoras del asunto que mejor va.
Devuelve SOLO JSON: {"propuestas":[{"texto":"el asunto","hipotesis":"qué esperas","fundamento":"qué dato lo motiva"}]}`

export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const { data: brRaw } = await sb.from('outbound_brazo').select('*').eq('perilla', 'asunto')
  const brazos = (brRaw ?? []) as Brazo[]
  if (brazos.filter((b) => b.es_control === false).length >= 6) return NextResponse.json({ ok: false, error: 'Ya hay muchos asuntos en prueba; deja que maduren antes de agregar más.' }, { status: 400 })

  // Globales (reusa la misma señal que el reporte, resumida)
  const { data: pros } = await sb.from('outbound_prospecto').select('slug,estado,sector').in('estado', ['en_secuencia', 'respondio', 'reboto', 'cerrado', 'rechazada'])
  const list = (pros ?? []) as { slug: string | null; estado: string; sector: string | null }[]
  const slugs = list.map((p) => p.slug).filter(Boolean) as string[]
  const clk = new Map<string, number>()
  if (slugs.length) { const { data: lk } = await sb.from('links').select('slug,clicks').in('slug', slugs); for (const l of (lk ?? []) as { slug: string; clicks: number }[]) clk.set(l.slug, l.clicks ?? 0) }
  let abiertas = 0, respondidas = 0
  const sectoresResp: string[] = []
  for (const p of list) { if (p.slug && (clk.get(p.slug) ?? 0) > 0) abiertas++; if (p.estado === 'respondio') { respondidas++; if (p.sector) sectoresResp.push(p.sector) } }

  const ctx = `ASUNTOS PROBADOS:\n${brazos.map((b) => `- "${b.texto}"${b.es_control ? ' (control)' : ''}: ${b.envios_maduros} maduros, ${b.clics} clics, ${b.respuestas} respuestas`).join('\n')}\n\nGLOBAL: ${list.length} enviados · ${abiertas} abrieron · ${respondidas} respondieron.\nAbren y NO contestan: ${Math.max(0, abiertas - respondidas)}. Nunca abren: ${Math.max(0, list.length - abiertas)}.\nSectores que respondieron: ${sectoresResp.join(', ') || '(ninguno aún)'}`

  try {
    const raw = await aiRawJSON(SYSTEM, ctx, 0.6, 500)
    const j = parseJSON(raw) as { propuestas?: { texto: string; hipotesis?: string; fundamento?: string }[] }
    const props = (Array.isArray(j.propuestas) ? j.propuestas : []).filter((p) => p?.texto && String(p.texto).trim()).slice(0, 2)
    if (!props.length) return NextResponse.json({ ok: false, error: 'la IA no propuso asuntos' }, { status: 502 })
    for (const p of props) {
      await sb.from('outbound_brazo').insert({ perilla: 'asunto', texto: String(p.texto).trim(), hipotesis: String(p.hipotesis ?? '').trim() || null, fundamento: String(p.fundamento ?? '').trim() || null, es_control: false, activa: true })
    }
    return NextResponse.json({ ok: true, creados: props.length, propuestas: props })
  } catch (e) {
    const m = e instanceof Error ? e.message : ''
    return NextResponse.json({ ok: false, error: /429|rate|limit|quota/i.test(m) ? 'IA saturada, intenta en 1 min.' : 'No se pudieron generar hipótesis.', detail: m.slice(0, 200) }, { status: 502 })
  }
}

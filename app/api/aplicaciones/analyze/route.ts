import { NextResponse } from 'next/server'
import { checkPanel, analizarVacante } from '@/lib/aplicaciones'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Analiza una vacante contra perfil.md. Devuelve requisitos, match, veredicto, argumentos, huecos, obligatoria.
export async function POST(req: Request) {
  if (!checkPanel(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const b = await req.json().catch(() => null)
  const empresa = String(b?.empresa ?? '').trim()
  const puesto = String(b?.puesto ?? '').trim()
  const vacante = String(b?.vacante ?? '').trim()
  if (!vacante) return NextResponse.json({ ok: false, error: 'pega el texto de la vacante' }, { status: 400 })
  try {
    const analysis = await analizarVacante(empresa, puesto, vacante)
    return NextResponse.json({ ok: true, analysis })
  } catch (e) {
    const m = e instanceof Error ? e.message : ''
    const sat = /429|rate|limit|quota|too large/i.test(m)
    return NextResponse.json({ ok: false, error: sat ? 'La IA está saturada, espera ~1 min.' : 'No se pudo analizar.', detail: m.slice(0, 200) }, { status: 502 })
  }
}

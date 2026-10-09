import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound, type Prospecto } from '@/lib/outbound'
import { investigar } from '@/lib/investigador'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Investiga UN prospecto (lee su sitio + LLM), guarda el gancho y aplica la compuerta:
// auto_enviable (alta confianza, sin cifra) → estado 'listo'; si no → 'sin_gancho'.
export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const id = String(b?.id ?? '')
  const { data: pr } = await sb.from('outbound_prospecto').select('*').eq('id', id).maybeSingle()
  if (!pr) return NextResponse.json({ ok: false, error: 'no encontrado' }, { status: 404 })
  const p = pr as Prospecto & { sitio_web?: string | null }
  // No re-investigar algo que ya está en secuencia/respondió.
  if (['en_secuencia', 'respondio', 'reboto', 'rechazada', 'cerrado'].includes(p.estado)) {
    return NextResponse.json({ ok: false, error: 'ya está en marcha, no se re-investiga' }, { status: 409 })
  }
  try {
    const r = await investigar({ empresa: p.empresa, puesto: p.puesto, sitio_web: p.sitio_web, email: p.email })
    const nuevoEstado = r.auto_enviable ? 'listo' : 'sin_gancho'
    await sb.from('outbound_prospecto').update({
      gancho: r.gancho, cita: r.cita, confianza: r.confianza, afirma_cifra: r.afirma_cifra,
      angulo: r.angulo, sector: r.sector || p.sector, asunto_sugerido: r.asunto_sugerido,
      evidencia_url: r.evidencia_url, auto_enviable: r.auto_enviable, investigado_en: new Date().toISOString(),
      estado: nuevoEstado,
    }).eq('id', id)
    return NextResponse.json({ ok: true, ...r, estado: nuevoEstado })
  } catch (e) {
    const m = e instanceof Error ? e.message : ''
    const sat = /429|rate|limit|quota|too large/i.test(m)
    return NextResponse.json({ ok: false, error: sat ? 'La IA está saturada, espera ~1 min.' : 'No se pudo investigar.', detail: m.slice(0, 200) }, { status: 502 })
  }
}

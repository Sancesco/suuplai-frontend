import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound, type Prospecto } from '@/lib/outbound'
import { rellenar, primerNombre, topeRampa } from '@/lib/outboundSend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Próxima corrida de envío: siguiente día hábil a las 9:00 CDMX (15:00 UTC) en el futuro.
function proximaCorrida(): Date {
  const now = new Date()
  const d = new Date(now)
  for (let i = 0; i < 9; i++) {
    const cand = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 15, 0, 0))
    const cdmx = new Date(cand.getTime() - 6 * 3600000)
    const dow = cdmx.getUTCDay()
    if (cand.getTime() > now.getTime() && dow >= 1 && dow <= 5) return cand
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 15, 0, 0))
}
function sumarHabiles(desde: Date, n: number): Date {
  const d = new Date(desde); let c = 0
  while (c < n) { d.setUTCDate(d.getUTCDate() + 1); const dow = new Date(d.getTime() - 6 * 3600000).getUTCDay(); if (dow >= 1 && dow <= 5) c++ }
  return d
}

export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const id = String(b?.prospectoId ?? '')
  const { data: pr } = await sb.from('outbound_prospecto').select('*').eq('id', id).maybeSingle()
  if (!pr) return NextResponse.json({ ok: false, error: 'no encontrado' }, { status: 404 })
  const p = pr as Prospecto

  const { data: tpl } = await sb.from('outbound_plantilla').select('*').eq('activa', true).order('version', { ascending: false }).limit(1).maybeSingle()
  if (!tpl) return NextResponse.json({ ok: false, error: 'no hay plantilla activa' }, { status: 400 })
  const { data: cfgRows } = await sb.from('outbound_config').select('clave,valor')
  const cm = new Map((cfgRows ?? []).map((r: { clave: string; valor: unknown }) => [r.clave, r.valor]))
  const from = `${String(cm.get('from_nombre') || 'Santiago Céspedes')} <${String(cm.get('from_email') || 'santiago@suups.com.mx')}>`
  const rampaDesde = String(cm.get('rampa_desde') || new Date().toISOString())
  const pausa = cm.get('pausa_global') === true || cm.get('pausa_global') === 'true'

  const vars = { nombre: primerNombre(p.persona), empresa: p.empresa, gancho: p.gancho || '', slug: p.slug || 'SLUG' }
  const asunto = rellenar(tpl.asunto, vars)
  const cuerpo = rellenar(tpl.cuerpo, vars)

  // Estimación de cuándo sale (solo si está en cola)
  let cuando: string | null = null
  let detalleCola: string | null = null
  if (p.estado === 'listo' || p.estado === 'nuevo') {
    if (!p.email) { detalleCola = 'Sin correo — no se puede enviar.' }
    else if (pausa) { detalleCola = 'Envío en pausa global.' }
    else {
      // posición en la cola (por antigüedad) y tope diario
      const { data: cola } = await sb.from('outbound_prospecto').select('id,created_at').in('estado', ['listo', 'nuevo']).not('email', 'is', null).order('created_at', { ascending: true })
      const pos = (cola ?? []).findIndex((x: { id: string }) => x.id === id) // 0-based
      const cap = topeRampa(rampaDesde)
      const diaIdx = pos < 0 ? 0 : Math.floor(pos / Math.max(1, cap))
      const fecha = sumarHabiles(proximaCorrida(), diaIdx)
      cuando = fecha.toISOString()
      detalleCola = `Posición ${pos + 1} en la cola · tope ${cap}/día`
    }
  }

  // Árbol de la secuencia: correo 1, recordatorio 2 (+5 háb), 3 (+7 háb), cierre (+7 háb).
  const { data: evs } = await sb.from('outbound_envio').select('toque,enviado_en').eq('prospecto_id', id).order('toque', { ascending: true })
  const porToque = new Map((evs ?? []).map((e: { toque: number; enviado_en: string }) => [e.toque, e.enviado_en]))
  const baseT1 = porToque.get(1) ? new Date(porToque.get(1)!) : (cuando ? new Date(cuando) : null)
  let plan: { paso: string; fecha: string; hecho: boolean }[] = []
  if (baseT1) {
    const t2 = porToque.get(2) ? new Date(porToque.get(2)!) : sumarHabiles(baseT1, 5)
    const t3 = porToque.get(3) ? new Date(porToque.get(3)!) : sumarHabiles(t2, 7)
    const cierre = sumarHabiles(t3, 7)
    const detenida = p.estado === 'respondio' || p.estado === 'rechazada' || p.estado === 'cerrado' || p.estado === 'reboto'
    plan = [
      { paso: 'Correo 1 (presentación)', fecha: baseT1.toISOString(), hecho: porToque.has(1) },
      { paso: 'Recordatorio 2 (mismo hilo)', fecha: t2.toISOString(), hecho: porToque.has(2) },
      { paso: 'Recordatorio 3 (último)', fecha: t3.toISOString(), hecho: porToque.has(3) },
      { paso: detenida ? 'Secuencia terminada' : 'Se cierra si no responde', fecha: cierre.toISOString(), hecho: detenida },
    ]
  }

  return NextResponse.json({ ok: true, from, to: p.email, asunto, cuerpo, estado: p.estado, cuando, detalleCola, plan })
}

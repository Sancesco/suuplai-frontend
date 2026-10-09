import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound, prepararProspecto, programarEnvio, type Prospecto } from '@/lib/outbound'
import { gmailConectado } from '@/lib/gmail'
import { sumarDiasHabiles, topeRampa } from '@/lib/outboundSend'

// Hora objetivo del recordatorio (misma fórmula que el cron) para estimar el próximo movimiento.
function horaObj(seed: string): number { let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; return 8 + (h % 9) }
function aHoraCDMX(d: Date, hour: number): string { const c = new Date(d.getTime() - 6 * 3600000); return new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate(), hour + 6, 0, 0)).toISOString() }
// Próximo movimiento: para 'listo' = su hora programada; para 'en_secuencia' = el próximo recordatorio.
function proximoMovimiento(id: string, estado: string, programado: string | null, env: { toque: number; enviado_en: string } | undefined): { proximo: string | null; tipo: string | null } {
  if (estado === 'listo' || estado === 'nuevo') return { proximo: programado, tipo: 'Correo 1' }
  if (estado === 'en_secuencia' && env) {
    const base = new Date(env.enviado_en)
    if (env.toque === 1) return { proximo: aHoraCDMX(sumarDiasHabiles(base, 5), horaObj(id + 't2')), tipo: 'Recordatorio 2' }
    if (env.toque === 2) return { proximo: aHoraCDMX(sumarDiasHabiles(base, 7), horaObj(id + 't3')), tipo: 'Recordatorio 3' }
    if (env.toque === 3) return { proximo: aHoraCDMX(sumarDiasHabiles(base, 7), 9), tipo: 'Se cierra' }
  }
  return { proximo: null, tipo: null }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store' // supabase-js cachea su fetch; esto lo fuerza a leer siempre fresco

// Lista de prospectos + señales (clics del /r, aperturas/tiempo/descarga/chat de la página de CV).
export async function GET(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const { data: pros } = await sb.from('outbound_prospecto').select('*').order('created_at', { ascending: false })
  const list = (pros ?? []) as Prospecto[]
  const slugs = list.map((p) => p.slug).filter(Boolean) as string[]

  // envíos por prospecto (último toque + fecha)
  const envios = new Map<string, { toque: number; enviado_en: string }>()
  if (list.length) {
    const { data: evs } = await sb.from('outbound_envio').select('prospecto_id,toque,enviado_en').in('prospecto_id', list.map((p) => p.id)).order('toque', { ascending: false })
    for (const e of (evs ?? []) as { prospecto_id: string; toque: number; enviado_en: string }[]) if (!envios.has(e.prospecto_id)) envios.set(e.prospecto_id, { toque: e.toque, enviado_en: e.enviado_en })
  }

  const clicks = new Map<string, number>()
  const ev = new Map<string, { open: number; seconds: number; cv: number; chat: number; last: string | null; visitors: Set<string> }>()
  if (slugs.length) {
    const [lk, events] = await Promise.all([
      sb.from('links').select('slug,clicks,last_click_at').in('slug', slugs),
      sb.from('app_events').select('slug,tipo,data,created_at,visitor_id').in('slug', slugs),
    ])
    for (const l of (lk.data ?? []) as { slug: string; clicks: number }[]) clicks.set(l.slug, l.clicks ?? 0)
    for (const e of (events.data ?? []) as { slug: string; tipo: string; data: { seconds?: number } | null; created_at: string; visitor_id: string | null }[]) {
      if (!ev.has(e.slug)) ev.set(e.slug, { open: 0, seconds: 0, cv: 0, chat: 0, last: null, visitors: new Set() })
      const s = ev.get(e.slug)!
      if (e.visitor_id) s.visitors.add(e.visitor_id)
      if (e.tipo === 'open') s.open++
      else if (e.tipo === 'cv_download') s.cv++
      else if (e.tipo === 'chat_message') s.chat++
      else if (e.tipo === 'time_on_page') s.seconds += Number(e.data?.seconds || 0)
      if (!s.last || e.created_at > s.last) s.last = e.created_at
    }
  }

  const out = list.map((p) => {
    const e = p.slug ? ev.get(p.slug) : undefined
    const env = envios.get(p.id)
    return {
      id: p.id, empresa: p.empresa, persona: p.persona, puesto: p.puesto, email: p.email,
      sector: p.sector, idioma: p.idioma, slug: p.slug, estado: p.estado, pausado: p.pausado, created_at: p.created_at,
      clicks: p.slug ? (clicks.get(p.slug) ?? 0) : 0,
      abierto: e?.open ?? 0, seconds: e?.seconds ?? 0, cv: e?.cv ?? 0, chat: e?.chat ?? 0, last: e?.last ?? null,
      visitantes: e ? e.visitors.size : 0, compartido: e ? e.visitors.size >= 2 : false,
      toque: env?.toque ?? 0, enviado_en: env?.enviado_en ?? null,
      gancho: p.gancho ?? null, cita: p.cita ?? null, confianza: p.confianza ?? null, angulo: p.angulo ?? null,
      afirma_cifra: p.afirma_cifra ?? false, evidencia_url: p.evidencia_url ?? null, auto_enviable: p.auto_enviable ?? false,
      ...proximoMovimiento(p.id, p.estado, (p as { programado_en?: string | null }).programado_en ?? null, env),
    }
  })
  const gmail = await gmailConectado(sb)
  const { data: cfgR } = await sb.from('outbound_config').select('valor').eq('clave', 'rampa_desde').maybeSingle()
  const tope = topeRampa(cfgR?.valor ? String(cfgR.valor) : new Date().toISOString())
  return NextResponse.json({ ok: true, prospectos: out, gmail, tope })
}

// Crea prospectos (bloque o uno) y les prepara el link de CV + /r. Dedup por correo.
export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const idioma: 'es' | 'en' = b?.idioma === 'en' ? 'en' : 'es'
  const filas = Array.isArray(b?.prospectos) ? b.prospectos : []
  if (!filas.length) return NextResponse.json({ ok: false, error: 'no hay prospectos' }, { status: 400 })

  let creados = 0; const saltados: string[] = []; const errores: string[] = []; const ids: string[] = []
  for (const f of filas) {
    const empresa = String(f?.empresa ?? '').trim()
    const email = String(f?.email ?? '').trim().toLowerCase()
    if (!empresa) { continue }
    // dedup por correo
    if (email) {
      const { data: dup } = await sb.from('outbound_prospecto').select('id').eq('email', email).maybeSingle()
      if (dup) { saltados.push(email); continue }
    }
    try {
      const { slug, appId } = await prepararProspecto(sb, { empresa, persona: String(f?.persona ?? '').trim() || null, puesto: String(f?.puesto ?? '').trim() || null, idioma })
      const { data: ins, error } = await sb.from('outbound_prospecto').insert({
        empresa, persona: String(f?.persona ?? '').trim() || null, puesto: String(f?.puesto ?? '').trim() || null,
        email: email || null, sitio_web: String(f?.sitio_web ?? '').trim() || null, linkedin: String(f?.linkedin ?? '').trim() || null,
        idioma, slug, app_id: appId, estado: 'listo',
      }).select('id').single()
      if (error || !ins) { errores.push(empresa + ': ' + (error?.message || '')); continue }
      creados++; ids.push(ins.id as string)
      // Programa su envío (franja + día con cupo). Si la Fase 4 no está, el cron lo manda igual.
      try { await programarEnvio(sb, ins.id as string) } catch { /* sin Fase 4 todavía */ }
    } catch (e) { errores.push(empresa + ': ' + (e instanceof Error ? e.message : 'error')) }
  }
  return NextResponse.json({ ok: true, creados, saltados, errores, ids })
}

// Edita un prospecto: aprobar (estado), editar gancho, pausar, descartar.
export async function PATCH(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const id = String(b?.id ?? ''); if (!id) return NextResponse.json({ ok: false, error: 'falta id' }, { status: 400 })
  const patch: Record<string, unknown> = {}
  const ESTADOS = ['nuevo', 'sin_gancho', 'listo', 'descartado', 'cerrado']
  if (b?.estado && ESTADOS.includes(String(b.estado))) patch.estado = b.estado
  if (b?.empresa !== undefined) { const v = String(b.empresa ?? '').trim(); if (v) patch.empresa = v }
  if (b?.persona !== undefined) patch.persona = String(b.persona ?? '').trim() || null
  if (b?.puesto !== undefined) patch.puesto = String(b.puesto ?? '').trim() || null
  if (b?.gancho !== undefined) patch.gancho = String(b.gancho ?? '')
  if (b?.pausado !== undefined) patch.pausado = b.pausado === true
  if (b?.nota !== undefined) patch.nota = String(b.nota ?? '') || null
  if (b?.email !== undefined) {
    const em = String(b.email ?? '').trim().toLowerCase()
    if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return NextResponse.json({ ok: false, error: 'correo inválido' }, { status: 400 })
    patch.email = em || null
  }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: 'nada que actualizar' }, { status: 400 })
  const { error } = await sb.from('outbound_prospecto').update(patch).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

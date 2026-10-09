import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { elegirAsunto, programarEnvio } from '@/lib/outbound'
import { enviarCorreo, leerHilo, gmailConectado } from '@/lib/gmail'
import { rellenar, primerNombre, diasHabilesEntre, topeRampa, horarioHabilCDMX } from '@/lib/outboundSend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SB = NonNullable<ReturnType<typeof getSupabaseAdmin>>

// Hora objetivo (8..16 CDMX) estable y variada por (prospecto, toque): los recordatorios
// no salen todos a la misma hora. Determinista → no cambia entre corridas.
function horaObjetivo(seed: string): number {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return 8 + (h % 9)
}
type Envio = { id: string; toque: number; enviado_en: string; gmail_thread_id: string | null; gmail_message_id: string | null; asunto_final: string | null; rebotado: boolean; respondido: boolean }
type Prospecto = { id: string; empresa: string; persona: string | null; email: string | null; slug: string | null; estado: string; gancho?: string | null; brazo_hora?: string | null }

async function cfgMap(sb: SB) {
  const { data } = await sb.from('outbound_config').select('clave,valor')
  const m = new Map((data ?? []).map((r: { clave: string; valor: unknown }) => [r.clave, r.valor]))
  const bool = (k: string) => m.get(k) === true || m.get(k) === 'true'
  return {
    pausa: bool('pausa_global'),
    from_email: String(m.get('from_email') || 'santiago@suups.com.mx'),
    from_nombre: String(m.get('from_nombre') || 'Santiago Céspedes'),
    rampa_desde: String(m.get('rampa_desde') || new Date().toISOString()),
    no_antes_de: m.get('no_antes_de') ? new Date(String(m.get('no_antes_de'))) : null,
  }
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || ''
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('no autorizado', { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false }, { status: 500 })

  const gm = await gmailConectado(sb)
  if (!gm.conectado) return NextResponse.json({ ok: true, nota: 'gmail no conectado' })
  const miEmail = gm.email || ''
  const cfg = await cfgMap(sb)
  const { data: tpl } = await sb.from('outbound_plantilla').select('*').eq('activa', true).order('version', { ascending: false }).limit(1).maybeSingle()
  if (!tpl) return NextResponse.json({ ok: true, nota: 'sin plantilla' })

  const log = { respondio: 0, reboto: 0, recordatorios: 0, nuevos: 0, cerrados: 0 }
  const now = new Date()
  const habil = horarioHabilCDMX(now) && !cfg.pausa

  const enviarToque = async (p: Prospecto, toque: number, prev: Envio | null) => {
    const vars = { nombre: primerNombre(p.persona), empresa: p.empresa, gancho: p.gancho || '', slug: p.slug || '' }
    const cuerpo = toque === 1 ? rellenar(tpl.cuerpo, vars) : rellenar(toque === 2 ? tpl.recordatorio_1 : tpl.recordatorio_2, vars)
    // Toque 1: el bandit elige el asunto; toques 2/3: respuesta en el mismo hilo.
    const pick = toque === 1 ? await elegirAsunto(sb, vars) : { brazoId: null, asunto: null }
    const asunto = toque === 1 ? (pick.asunto || rellenar(tpl.asunto, vars)) : `Re: ${prev?.asunto_final || rellenar(tpl.asunto, vars)}`
    const r = await enviarCorreo(sb, {
      from: cfg.from_email, fromNombre: cfg.from_nombre, to: p.email!, subject: asunto, text: cuerpo,
      threadId: prev?.gmail_thread_id || null, inReplyTo: prev?.gmail_message_id || null, references: prev?.gmail_message_id || null,
    })
    await sb.from('outbound_envio').insert({ prospecto_id: p.id, toque, asunto_final: toque === 1 ? asunto : prev?.asunto_final, cuerpo_final: cuerpo, gmail_thread_id: r.threadId, gmail_message_id: r.messageId, plantilla_version: tpl.version, brazo_asunto: pick.brazoId, brazo_hora: toque === 1 ? (p.brazo_hora ?? null) : null })
    if (toque === 1) await sb.from('outbound_prospecto').update({ estado: 'en_secuencia' }).eq('id', p.id)
  }

  // ── 1) En secuencia: detectar respuesta/rebote; si no, recordatorio en hilo ──
  const { data: enSec } = await sb.from('outbound_prospecto').select('*').eq('estado', 'en_secuencia').eq('pausado', false)
  for (const p of (enSec ?? []) as Prospecto[]) {
    const { data: evs } = await sb.from('outbound_envio').select('*').eq('prospecto_id', p.id).order('toque', { ascending: true })
    const envios = (evs ?? []) as Envio[]
    const last = envios[envios.length - 1]; const first = envios[0]
    if (!last?.gmail_thread_id) continue
    // detectar respuesta / rebote leyendo el hilo
    try {
      const msgs = await leerHilo(sb, last.gmail_thread_id, miEmail)
      if (msgs.some((m) => m.esRebote)) { await sb.from('outbound_prospecto').update({ estado: 'reboto' }).eq('id', p.id); await sb.from('outbound_envio').update({ rebotado: true }).eq('prospecto_id', p.id); log.reboto++; continue }
      const firstMs = first ? new Date(first.enviado_en).getTime() : 0
      if (msgs.some((m) => !m.fromMe && m.internalDate > firstMs)) { await sb.from('outbound_prospecto').update({ estado: 'respondio' }).eq('id', p.id); await sb.from('outbound_envio').update({ respondido: true }).eq('prospecto_id', p.id); log.respondio++; continue }
    } catch { /* si falla la lectura, no bloquea */ }
    if (!habil) continue
    const dias = diasHabilesEntre(new Date(last.enviado_en), now)
    const curH = new Date(now.getTime() - 6 * 3600000).getUTCHours() // hora CDMX
    try {
      // Cada recordatorio sale a su propia hora (variada por prospecto) el día que toca.
      if (last.toque === 1 && dias >= 5 && curH >= horaObjetivo(p.id + 't2')) { await enviarToque(p, 2, last); log.recordatorios++ }
      else if (last.toque === 2 && dias >= 7 && curH >= horaObjetivo(p.id + 't3')) { await enviarToque(p, 3, last); log.recordatorios++ }
      else if (last.toque === 3 && dias >= 7) { await sb.from('outbound_prospecto').update({ estado: 'cerrado' }).eq('id', p.id); log.cerrados++ }
    } catch { /* un fallo no detiene el resto */ }
  }

  // ── 2a) Programa franja/día a los 'listo' que aún no tienen hora (bandit de horarios) ──
  const { data: sinProg } = await sb.from('outbound_prospecto').select('id').eq('estado', 'listo').eq('pausado', false).is('programado_en', null).limit(20)
  for (const p of (sinProg ?? []) as { id: string }[]) { try { await programarEnvio(sb, p.id) } catch { break /* sin Fase 4 todavía */ } }

  // ── 2b) Cola: manda los 'listo' cuya hora programada ya llegó (o sin programar, respaldo) ──
  const antesDeArranque = cfg.no_antes_de && now < cfg.no_antes_de
  if (habil && !antesDeArranque) {
    const nowIso = now.toISOString()
    const { data: cola } = await sb.from('outbound_prospecto').select('*').eq('estado', 'listo').eq('pausado', false).not('email', 'is', null)
      .or(`programado_en.lte.${nowIso},programado_en.is.null`).order('programado_en', { ascending: true, nullsFirst: true }).limit(10)
    for (const p of (cola ?? []) as Prospecto[]) { try { await enviarToque(p, 1, null); log.nuevos++ } catch { /* sigue */ } }
  }

  // ── 3) Madurar: a los 7 días, aprende qué asunto funcionó (señal = clic) ──
  const hace7 = new Date(now.getTime() - 7 * 86400000).toISOString()
  const { data: mad } = await sb.from('outbound_envio').select('id,prospecto_id,brazo_asunto,brazo_hora').eq('toque', 1).eq('maduro', false).lte('enviado_en', hace7).limit(40)
  const madurarBrazo = async (brazoId: string | null, clicked: boolean, respondido: boolean) => {
    if (!brazoId) return
    const { data: b } = await sb.from('outbound_brazo').select('*').eq('id', brazoId).maybeSingle()
    if (!b) return
    await sb.from('outbound_brazo').update({
      envios_maduros: (b.envios_maduros ?? 0) + 1, clics: (b.clics ?? 0) + (clicked ? 1 : 0), respuestas: (b.respuestas ?? 0) + (respondido ? 1 : 0),
      alfa: (b.alfa ?? 1) + (clicked ? 1 : 0), beta: (b.beta ?? 4) + (clicked ? 0 : 1),
    }).eq('id', b.id)
  }
  for (const e of (mad ?? []) as { id: string; prospecto_id: string; brazo_asunto: string | null; brazo_hora: string | null }[]) {
    await sb.from('outbound_envio').update({ maduro: true }).eq('id', e.id)
    const { data: pp } = await sb.from('outbound_prospecto').select('slug,estado').eq('id', e.prospecto_id).maybeSingle()
    let clics = 0
    if (pp?.slug) { const { data: lk } = await sb.from('links').select('clicks').eq('slug', pp.slug).maybeSingle(); clics = lk?.clicks ?? 0 }
    const clicked = clics > 0, respondido = pp?.estado === 'respondio'
    await madurarBrazo(e.brazo_asunto, clicked, respondido) // asunto aprende del clic
    await madurarBrazo(e.brazo_hora, clicked, respondido)   // franja aprende del clic
  }

  return NextResponse.json({ ok: true, ...log, madurados: (mad ?? []).length })
}

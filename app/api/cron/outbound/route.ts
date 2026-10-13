import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { elegirAsunto, programarEnvio } from '@/lib/outbound'
import { enviarCorreo, leerHilo, gmailConectado } from '@/lib/gmail'
import { rellenar, primerNombre, diasHabilesEntre, topeRampa, horarioHabilCDMX } from '@/lib/outboundSend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SB = NonNullable<ReturnType<typeof getSupabaseAdmin>>

type Envio ={ id: string; toque: number; enviado_en: string; gmail_thread_id: string | null; gmail_message_id: string | null; asunto_final: string | null; rebotado: boolean; respondido: boolean }
type Prospecto = { id: string; empresa: string; persona: string | null; email: string | null; slug: string | null; estado: string; gancho?: string | null; brazo_hora?: string | null; asunto_custom?: string | null; cuerpo_custom?: string | null }

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
    // Override por prospecto (correo a la medida): si tiene cuerpo_custom, el toque 1 usa ESE cuerpo
    // y su propio asunto (sin bandit). Los recordatorios 2/3 siguen con la plantilla, en el hilo.
    const usaCustom = toque === 1 && !!p.cuerpo_custom
    const cuerpo = usaCustom
      ? rellenar(p.cuerpo_custom!, vars)
      : toque === 1 ? rellenar(tpl.cuerpo, vars) : rellenar(toque === 2 ? tpl.recordatorio_1 : tpl.recordatorio_2, vars)
    // Toque 1 normal: el bandit elige el asunto. Custom: su propio asunto. Toques 2/3: hilo.
    const pick = (toque === 1 && !usaCustom) ? await elegirAsunto(sb, vars) : { brazoId: null, asunto: null }
    const asunto = toque === 1
      ? (usaCustom ? rellenar(p.asunto_custom || tpl.asunto, vars) : (pick.asunto || rellenar(tpl.asunto, vars)))
      : `Re: ${prev?.asunto_final || rellenar(tpl.asunto, vars)}`
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
    if (!last) continue
    // Detectar respuesta / rebote SOLO si hay hilo de Gmail. Los correos que el usuario mandó a mano
    // no tienen hilo: igual se les manda recordatorio (como correo nuevo, no respuesta en hilo).
    if (last.gmail_thread_id) {
      try {
        const msgs = await leerHilo(sb, last.gmail_thread_id, miEmail)
        if (msgs.some((m) => m.esRebote)) { await sb.from('outbound_prospecto').update({ estado: 'reboto' }).eq('id', p.id); await sb.from('outbound_envio').update({ rebotado: true }).eq('prospecto_id', p.id); log.reboto++; continue }
        const firstMs = first ? new Date(first.enviado_en).getTime() : 0
        if (msgs.some((m) => !m.fromMe && m.internalDate > firstMs)) { await sb.from('outbound_prospecto').update({ estado: 'respondio' }).eq('id', p.id); await sb.from('outbound_envio').update({ respondido: true }).eq('prospecto_id', p.id); log.respondio++; continue }
      } catch { /* si falla la lectura, no bloquea */ }
    }
    if (!habil) continue
    const dias = diasHabilesEntre(new Date(last.enviado_en), now)
    // Guard anti-duplicado: ¿ya existe un envío de ese toque? (evita dobles si chocan dos crons)
    const yaTiene = async (toque: number) => { const { count } = await sb.from('outbound_envio').select('id', { count: 'exact', head: true }).eq('prospecto_id', p.id).eq('toque', toque); return (count ?? 0) > 0 }
    try {
      // El cron corre 1 vez/día (9am): el recordatorio sale el día que cumple sus días hábiles,
      // sin gate de hora (si no, una hora objetivo > 9am nunca se alcanzaría).
      if (last.toque === 1 && dias >= 5) { if (!(await yaTiene(2))) { await enviarToque(p, 2, last); log.recordatorios++ } }
      else if (last.toque === 2 && dias >= 7) { if (!(await yaTiene(3))) { await enviarToque(p, 3, last); log.recordatorios++ } }
      else if (last.toque === 3 && dias >= 7) { await sb.from('outbound_prospecto').update({ estado: 'cerrado' }).eq('id', p.id); log.cerrados++ }
    } catch { /* un fallo no detiene el resto */ }
  }

  // ── 2a) Programa franja/día a los 'listo' que aún no tienen hora (bandit de horarios) ──
  const { data: sinProg } = await sb.from('outbound_prospecto').select('id').eq('estado', 'listo').eq('pausado', false).is('programado_en', null).limit(20)
  for (const p of (sinProg ?? []) as { id: string }[]) { try { await programarEnvio(sb, p.id) } catch { break /* sin Fase 4 todavía */ } }

  // ── 2b) Cola: manda el LOTE COMPLETO del día (hasta el tope de la rampa, descontando lo ya
  //     enviado hoy). Pensado para 1 corrida/día de Vercel (9am): al primer disparo del día sale
  //     todo el lote; corridas extra ese día no mandan nada (ya se alcanzó el tope). Robusto tanto
  //     con el cron de Vercel como con el ping horario de GitHub (lo que dispare primero, manda). ──
  const antesDeArranque = cfg.no_antes_de && now < cfg.no_antes_de
  if (habil && !antesDeArranque) {
    const cdmx = new Date(now.getTime() - 6 * 3600000)
    const iniHoy = new Date(Date.UTC(cdmx.getUTCFullYear(), cdmx.getUTCMonth(), cdmx.getUTCDate(), 6, 0, 0)).toISOString()
    const finHoy = new Date(Date.UTC(cdmx.getUTCFullYear(), cdmx.getUTCMonth(), cdmx.getUTCDate() + 1, 6, 0, 0)).toISOString()
    const topeHoy = topeRampa(cfg.rampa_desde)
    const { count: yaHoy } = await sb.from('outbound_envio').select('id', { count: 'exact', head: true }).eq('toque', 1).gte('enviado_en', iniHoy)
    const restante = Math.max(0, topeHoy - (yaHoy ?? 0))
    if (restante > 0) {
      const { data: cola } = await sb.from('outbound_prospecto').select('*').eq('estado', 'listo').eq('pausado', false).not('email', 'is', null)
        .or(`programado_en.lte.${finHoy},programado_en.is.null`).order('programado_en', { ascending: true, nullsFirst: true }).limit(restante)
      for (const p of (cola ?? []) as Prospecto[]) {
        try {
          // Claim ATÓMICO: solo manda si logra pasar el prospecto de 'listo' a 'en_secuencia'.
          // Si dos crons corren a la vez (Vercel + cron-job.org), solo UNO gana el update → cero duplicados.
          const { data: tomado } = await sb.from('outbound_prospecto').update({ estado: 'en_secuencia' }).eq('id', p.id).eq('estado', 'listo').select('id')
          if (!tomado || !tomado.length) continue
          await enviarToque(p, 1, null); log.nuevos++
        } catch { /* sigue */ }
      }
    }
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

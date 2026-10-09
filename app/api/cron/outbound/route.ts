import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { enviarCorreo, leerHilo, gmailConectado } from '@/lib/gmail'
import { rellenar, primerNombre, diasHabilesEntre, topeRampa, horarioHabilCDMX } from '@/lib/outboundSend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SB = NonNullable<ReturnType<typeof getSupabaseAdmin>>
type Envio = { id: string; toque: number; enviado_en: string; gmail_thread_id: string | null; gmail_message_id: string | null; asunto_final: string | null; rebotado: boolean; respondido: boolean }
type Prospecto = { id: string; empresa: string; persona: string | null; email: string | null; slug: string | null; estado: string }

async function cfgMap(sb: SB) {
  const { data } = await sb.from('outbound_config').select('clave,valor')
  const m = new Map((data ?? []).map((r: { clave: string; valor: unknown }) => [r.clave, r.valor]))
  const bool = (k: string) => m.get(k) === true || m.get(k) === 'true'
  return {
    pausa: bool('pausa_global'),
    from_email: String(m.get('from_email') || 'santiago@suups.com.mx'),
    from_nombre: String(m.get('from_nombre') || 'Santiago Céspedes'),
    rampa_desde: String(m.get('rampa_desde') || new Date().toISOString()),
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
    const vars = { nombre: primerNombre(p.persona), empresa: p.empresa, gancho: '', slug: p.slug || '' }
    const cuerpo = toque === 1 ? rellenar(tpl.cuerpo, vars) : rellenar(toque === 2 ? tpl.recordatorio_1 : tpl.recordatorio_2, vars)
    const asunto = toque === 1 ? rellenar(tpl.asunto, vars) : `Re: ${prev?.asunto_final || rellenar(tpl.asunto, vars)}`
    const r = await enviarCorreo(sb, {
      from: cfg.from_email, fromNombre: cfg.from_nombre, to: p.email!, subject: asunto, text: cuerpo,
      threadId: prev?.gmail_thread_id || null, inReplyTo: prev?.gmail_message_id || null, references: prev?.gmail_message_id || null,
    })
    await sb.from('outbound_envio').insert({ prospecto_id: p.id, toque, asunto_final: toque === 1 ? asunto : prev?.asunto_final, cuerpo_final: cuerpo, gmail_thread_id: r.threadId, gmail_message_id: r.messageId, plantilla_version: tpl.version })
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
    try {
      if (last.toque === 1 && dias >= 5) { await enviarToque(p, 2, last); log.recordatorios++ }
      else if (last.toque === 2 && dias >= 7) { await enviarToque(p, 3, last); log.recordatorios++ }
      else if (last.toque === 3 && dias >= 7) { await sb.from('outbound_prospecto').update({ estado: 'cerrado' }).eq('id', p.id); log.cerrados++ }
    } catch { /* un fallo no detiene el resto */ }
  }

  // ── 2) Cola de nuevos (toque 1) con rampa/tope/horario ──
  if (habil) {
    const cdmx = new Date(now.getTime() - 6 * 3600000)
    const inicioDiaUtc = new Date(Date.UTC(cdmx.getUTCFullYear(), cdmx.getUTCMonth(), cdmx.getUTCDate(), 6, 0, 0)).toISOString()
    const { count } = await sb.from('outbound_envio').select('id', { count: 'exact', head: true }).eq('toque', 1).gte('enviado_en', inicioDiaUtc)
    const restante = topeRampa(cfg.rampa_desde) - (count ?? 0)
    if (restante > 0) {
      // Reparte el restante del día entre las horas hábiles que quedan, para que no salgan todos juntos.
      const horaCdmx = cdmx.getUTCHours()
      const pingsRestantes = Math.max(1, 17 - horaCdmx)
      const porPing = Math.max(1, Math.ceil(restante / pingsRestantes))
      const { data: cola } = await sb.from('outbound_prospecto').select('*').eq('estado', 'listo').eq('pausado', false).not('email', 'is', null).order('created_at', { ascending: true }).limit(Math.min(restante, porPing))
      for (const p of (cola ?? []) as Prospecto[]) { try { await enviarToque(p, 1, null); log.nuevos++ } catch { /* sigue */ } }
    }
  }

  return NextResponse.json({ ok: true, ...log })
}

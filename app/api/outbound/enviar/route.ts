import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound, type Prospecto } from '@/lib/outbound'
import { enviarCorreo } from '@/lib/gmail'
import { rellenar, primerNombre } from '@/lib/outboundSend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function config(sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const { data } = await sb.from('outbound_config').select('clave,valor')
  const m = new Map((data ?? []).map((r: { clave: string; valor: unknown }) => [r.clave, r.valor]))
  return { from_email: String(m.get('from_email') || 'santiago@suups.com.mx'), from_nombre: String(m.get('from_nombre') || 'Santiago Céspedes') }
}

// Envía el toque 1 a un prospecto.
export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const id = String(b?.prospectoId ?? '')
  const { data: pr } = await sb.from('outbound_prospecto').select('*').eq('id', id).maybeSingle()
  if (!pr) return NextResponse.json({ ok: false, error: 'prospecto no encontrado' }, { status: 404 })
  const p = pr as Prospecto
  if (!p.email) return NextResponse.json({ ok: false, error: 'el prospecto no tiene correo' }, { status: 400 })
  if (!p.slug) return NextResponse.json({ ok: false, error: 'el prospecto no tiene link (slug)' }, { status: 400 })

  const { data: prev } = await sb.from('outbound_envio').select('id').eq('prospecto_id', id).eq('toque', 1).maybeSingle()
  if (prev && !b?.forzar) return NextResponse.json({ ok: false, error: 'ya se envió el primer correo' }, { status: 409 })

  const { data: tpl } = await sb.from('outbound_plantilla').select('*').eq('activa', true).order('version', { ascending: false }).limit(1).maybeSingle()
  if (!tpl) return NextResponse.json({ ok: false, error: 'no hay plantilla activa' }, { status: 400 })
  const cfg = await config(sb)

  const vars = { nombre: primerNombre(p.persona), empresa: p.empresa, gancho: p.gancho || '', slug: p.slug }
  const asunto = rellenar(tpl.asunto, vars)
  const cuerpo = rellenar(tpl.cuerpo, vars)
  try {
    const r = await enviarCorreo(sb, { from: cfg.from_email, fromNombre: cfg.from_nombre, to: p.email, subject: asunto, text: cuerpo })
    await sb.from('outbound_envio').insert({ prospecto_id: id, toque: 1, asunto_final: asunto, cuerpo_final: cuerpo, gmail_thread_id: r.threadId, gmail_message_id: r.messageId, plantilla_version: tpl.version })
    await sb.from('outbound_prospecto').update({ estado: 'en_secuencia' }).eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'error al enviar' }, { status: 502 })
  }
}

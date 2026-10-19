import { NextResponse } from 'next/server'
import {
  getSupabaseAdmin, checkAdmin, getContractById, getSignersByContract, logEvent,
  type ContractEvent,
} from '@/lib/contratos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Detalle de un contrato: contenido, firmantes y bitácora de eventos.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!checkAdmin(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const c = await getContractById(sb, params.id)
  if (!c) return NextResponse.json({ ok: false, error: 'no existe' }, { status: 404 })
  const firmantes = await getSignersByContract(sb, c.id)
  const { data: evs } = await sb.from('contract_events').select('*').eq('contract_id', c.id).order('created_at', { ascending: true })

  return NextResponse.json({
    ok: true,
    contrato: c,
    firmantes: firmantes.map((s) => ({
      id: s.id, full_name: s.full_name, email: s.email, role: s.role,
      token: s.token, sign_order: s.sign_order, signed_at: s.signed_at,
      ip: s.ip, user_agent: s.user_agent,
    })),
    eventos: (evs ?? []) as ContractEvent[],
  })
}

// Acciones sobre el contrato. Nunca se edita el contenido ni se borra: solo se marca.
//  - action 'send'  → draft → sent (los correos llegan en la Fase 4)
//  - action 'void'  → cancela (si no está completado)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!checkAdmin(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const b = await req.json().catch(() => null)
  const action = String(b?.action ?? '')
  const c = await getContractById(sb, params.id)
  if (!c) return NextResponse.json({ ok: false, error: 'no existe' }, { status: 404 })

  if (action === 'void') {
    if (c.status === 'completed') return NextResponse.json({ ok: false, error: 'un contrato completado no se puede cancelar' }, { status: 409 })
    await sb.from('contracts').update({ status: 'voided' }).eq('id', c.id)
    await logEvent(sb, c.id, 'voided', { payload: { from: c.status } })
    return NextResponse.json({ ok: true, status: 'voided' })
  }

  if (action === 'send') {
    if (c.status !== 'draft') return NextResponse.json({ ok: false, error: `solo se puede enviar un borrador (está en ${c.status})` }, { status: 409 })
    await sb.from('contracts').update({ status: 'sent' }).eq('id', c.id)
    await logEvent(sb, c.id, 'sent', {})
    return NextResponse.json({ ok: true, status: 'sent' })
  }

  return NextResponse.json({ ok: false, error: 'acción no reconocida' }, { status: 400 })
}

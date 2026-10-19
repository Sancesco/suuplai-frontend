import { NextResponse } from 'next/server'
import {
  getSupabaseAdmin, checkAdmin, hashContent, tokenUnico, logEvent,
  type Contract, type Signer,
} from '@/lib/contratos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Lista contratos (con sus firmantes) para el panel.
export async function GET(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const { data: cs } = await sb.from('contracts').select('id,title,content_hash,status,created_at,completed_at,pdf_url').order('created_at', { ascending: false })
  const contratos = (cs ?? []) as Omit<Contract, 'content'>[]
  const ids = contratos.map((c) => c.id)

  const porContrato = new Map<string, Signer[]>()
  if (ids.length) {
    const { data: ss } = await sb.from('signers').select('*').in('contract_id', ids).order('sign_order', { ascending: true })
    for (const s of (ss ?? []) as Signer[]) {
      const arr = porContrato.get(s.contract_id) ?? []
      arr.push(s); porContrato.set(s.contract_id, arr)
    }
  }

  const out = contratos.map((c) => ({
    ...c,
    firmantes: (porContrato.get(c.id) ?? []).map((s) => ({
      id: s.id, full_name: s.full_name, email: s.email, role: s.role,
      token: s.token, sign_order: s.sign_order, signed_at: s.signed_at,
    })),
  }))
  return NextResponse.json({ ok: true, contratos: out })
}

// Crea un contrato (status draft) con sus firmantes y sus tokens de firma.
export async function POST(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const b = await req.json().catch(() => null)
  const title = String(b?.title ?? '').trim()
  const content = String(b?.content ?? '').trim()
  const firmantesRaw = Array.isArray(b?.firmantes) ? b.firmantes : []
  if (!title) return NextResponse.json({ ok: false, error: 'falta el título' }, { status: 400 })
  if (content.length < 40) return NextResponse.json({ ok: false, error: 'el contenido del contrato está vacío o es muy corto' }, { status: 400 })

  const firmantes = firmantesRaw
    .map((f: Record<string, unknown>) => ({
      full_name: String(f?.full_name ?? '').trim(),
      email: String(f?.email ?? '').trim().toLowerCase(),
      role: String(f?.role ?? '').trim() || null,
    }))
    .filter((f: { full_name: string; email: string }) => f.full_name && f.email)
  if (firmantes.length < 1) return NextResponse.json({ ok: false, error: 'agrega al menos un firmante con nombre y correo' }, { status: 400 })
  const malo = firmantes.find((f: { email: string }) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email))
  if (malo) return NextResponse.json({ ok: false, error: `correo inválido: ${malo.email}` }, { status: 400 })

  const content_hash = hashContent(content)
  const { data: ins, error } = await sb.from('contracts').insert({ title, content, content_hash, status: 'draft' }).select('id,title,status,created_at,content_hash').single()
  if (error || !ins) return NextResponse.json({ ok: false, error: 'no se pudo crear el contrato: ' + (error?.message || '') }, { status: 500 })
  const contractId = ins.id as string

  const creados: { id: string; full_name: string; email: string; role: string | null; token: string; sign_order: number }[] = []
  for (let i = 0; i < firmantes.length; i++) {
    const f = firmantes[i]
    const token = await tokenUnico(sb)
    const { data: s, error: se } = await sb.from('signers').insert({
      contract_id: contractId, full_name: f.full_name, email: f.email, role: f.role, token, sign_order: i + 1,
    }).select('id,full_name,email,role,token,sign_order').single()
    if (se || !s) {
      // rollback best-effort: borra el contrato recién creado (aún en draft, sin firmas)
      await sb.from('contracts').delete().eq('id', contractId)
      return NextResponse.json({ ok: false, error: 'no se pudo crear un firmante: ' + (se?.message || '') }, { status: 500 })
    }
    creados.push(s as (typeof creados)[number])
  }

  await logEvent(sb, contractId, 'created', { payload: { title, firmantes: creados.length } })
  return NextResponse.json({ ok: true, id: contractId, title, status: 'draft', content_hash, firmantes: creados })
}

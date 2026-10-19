import { NextResponse } from 'next/server'
import {
  getSupabaseAdmin, checkAdmin, hashBuffer, tokenUnico, logEvent, SOURCE_BUCKET,
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
  const contratos = (cs ?? []) as Omit<Contract, 'content' | 'source_pdf'>[]
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

// Crea un contrato subiendo el PDF original (multipart). Genera un token por firmante.
export async function POST(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ ok: false, error: 'body inválido' }, { status: 400 })

  const title = String(form.get('title') ?? '').trim()
  const file = form.get('pdf')
  let firmantesRaw: unknown[] = []
  try { firmantesRaw = JSON.parse(String(form.get('firmantes') ?? '[]')) } catch { firmantesRaw = [] }

  if (!title) return NextResponse.json({ ok: false, error: 'falta el título' }, { status: 400 })
  if (!(file instanceof Blob)) return NextResponse.json({ ok: false, error: 'sube el PDF del contrato' }, { status: 400 })
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'el PDF es muy grande (máx 15MB)' }, { status: 413 })

  const firmantes = (Array.isArray(firmantesRaw) ? firmantesRaw : [])
    .map((f) => {
      const o = (f ?? {}) as Record<string, unknown>
      return { full_name: String(o.full_name ?? '').trim(), email: String(o.email ?? '').trim().toLowerCase(), role: String(o.role ?? '').trim() || null }
    })
    .filter((f) => f.full_name && f.email)
  if (firmantes.length < 1) return NextResponse.json({ ok: false, error: 'agrega al menos un firmante con nombre y correo' }, { status: 400 })
  const malo = firmantes.find((f) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email))
  if (malo) return NextResponse.json({ ok: false, error: `correo inválido: ${malo.email}` }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.subarray(0, 5).toString('latin1') !== '%PDF-') return NextResponse.json({ ok: false, error: 'el archivo no es un PDF válido' }, { status: 400 })
  const content_hash = hashBuffer(buf) // hash de los bytes del PDF

  const { data: ins, error } = await sb.from('contracts').insert({ title, content: null, content_hash, status: 'draft' }).select('id').single()
  if (error || !ins) return NextResponse.json({ ok: false, error: 'no se pudo crear el contrato: ' + (error?.message || '') }, { status: 500 })
  const contractId = ins.id as string

  const path = `${contractId}/original.pdf`
  const { error: upErr } = await sb.storage.from(SOURCE_BUCKET).upload(path, buf, { contentType: 'application/pdf', upsert: true })
  if (upErr) {
    await sb.from('contracts').delete().eq('id', contractId)
    return NextResponse.json({ ok: false, error: 'no se pudo subir el PDF (¿corriste el SQL del bucket contract-source?): ' + upErr.message }, { status: 500 })
  }
  await sb.from('contracts').update({ source_pdf: path }).eq('id', contractId)

  const creados: { id: string; full_name: string; email: string; role: string | null; token: string; sign_order: number }[] = []
  for (let i = 0; i < firmantes.length; i++) {
    const f = firmantes[i]
    const token = await tokenUnico(sb)
    const { data: s, error: se } = await sb.from('signers').insert({
      contract_id: contractId, full_name: f.full_name, email: f.email, role: f.role, token, sign_order: i + 1,
    }).select('id,full_name,email,role,token,sign_order').single()
    if (se || !s) {
      await sb.from('contracts').delete().eq('id', contractId)
      return NextResponse.json({ ok: false, error: 'no se pudo crear un firmante: ' + (se?.message || '') }, { status: 500 })
    }
    creados.push(s as (typeof creados)[number])
  }

  await logEvent(sb, contractId, 'created', { payload: { title, archivo: (file as File).name || 'contrato.pdf', firmantes: creados.length } })
  return NextResponse.json({ ok: true, id: contractId, title, status: 'draft', content_hash, firmantes: creados })
}

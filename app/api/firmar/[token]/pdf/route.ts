import { NextResponse } from 'next/server'
import { getSupabaseAdmin, getSignerByToken, getContractById, SOURCE_BUCKET } from '@/lib/contratos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Sirve el PDF original del contrato al firmante que tenga el token válido.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const signer = await getSignerByToken(sb, params.token)
  if (!signer) return NextResponse.json({ ok: false, error: 'enlace no válido' }, { status: 404 })
  const c = await getContractById(sb, signer.contract_id)
  if (!c || !c.source_pdf) return NextResponse.json({ ok: false, error: 'sin documento' }, { status: 404 })

  const { data, error } = await sb.storage.from(SOURCE_BUCKET).download(c.source_pdf)
  if (error || !data) return NextResponse.json({ ok: false, error: 'no se pudo leer el PDF' }, { status: 500 })
  const buf = Buffer.from(await data.arrayBuffer())

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="contrato.pdf"',
      'Cache-Control': 'no-store',
    },
  })
}

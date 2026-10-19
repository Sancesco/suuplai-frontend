import { NextResponse } from 'next/server'
import {
  getSupabaseAdmin, getSignerByToken, getContractById, getSignersByContract,
  hashContent, nombreCoincide, enlaceExpirado, logEvent, ipDeReq, SIGN_BUCKET,
} from '@/lib/contratos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET: el firmante abre su enlace. Devuelve el contrato para leerlo y firmar.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const signer = await getSignerByToken(sb, params.token)
  if (!signer) return NextResponse.json({ ok: false, error: 'enlace no válido' }, { status: 404 })
  const c = await getContractById(sb, signer.contract_id)
  if (!c) return NextResponse.json({ ok: false, error: 'contrato no encontrado' }, { status: 404 })

  // Registra la primera apertura (una sola vez por firmante).
  if (!signer.signed_at) {
    const { data: yaVio } = await sb.from('contract_events').select('id').eq('signer_id', signer.id).eq('event_type', 'viewed').limit(1).maybeSingle()
    if (!yaVio) await logEvent(sb, c.id, 'viewed', { signerId: signer.id })
  }

  return NextResponse.json({
    ok: true,
    expirado: enlaceExpirado(c),
    contrato: { title: c.title, content: c.content, status: c.status },
    firmante: { full_name: signer.full_name, role: signer.role, email: signer.email, signed_at: signer.signed_at },
  })
}

// POST: el firmante firma. Valida nombre, consentimiento, hash intacto y no expirado.
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const signer = await getSignerByToken(sb, params.token)
  if (!signer) return NextResponse.json({ ok: false, error: 'enlace no válido' }, { status: 404 })
  const c = await getContractById(sb, signer.contract_id)
  if (!c) return NextResponse.json({ ok: false, error: 'contrato no encontrado' }, { status: 404 })

  if (signer.signed_at) return NextResponse.json({ ok: false, error: 'este enlace ya fue firmado' }, { status: 409 })
  if (c.status === 'voided') return NextResponse.json({ ok: false, error: 'el contrato fue cancelado' }, { status: 409 })
  if (c.status === 'completed') return NextResponse.json({ ok: false, error: 'el contrato ya está completo' }, { status: 409 })
  if (enlaceExpirado(c)) return NextResponse.json({ ok: false, error: 'el enlace de firma expiró (30 días)' }, { status: 410 })

  // El contenido no debe haber cambiado desde que se calculó el hash.
  if (hashContent(c.content) !== c.content_hash) return NextResponse.json({ ok: false, error: 'el documento cambió y no se puede firmar; contacta a quien te lo envió' }, { status: 409 })

  const b = await req.json().catch(() => null)
  const fullName = String(b?.full_name ?? '').trim()
  const consent = b?.consent === true
  const dataUrl = String(b?.signature_png ?? '')

  if (!consent) return NextResponse.json({ ok: false, error: 'falta marcar la casilla de consentimiento' }, { status: 400 })
  if (!nombreCoincide(fullName, signer.full_name)) return NextResponse.json({ ok: false, error: 'el nombre no coincide con el del contrato' }, { status: 400 })
  const m = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/)
  if (!m) return NextResponse.json({ ok: false, error: 'falta la firma dibujada' }, { status: 400 })
  const buf = Buffer.from(m[1], 'base64')
  if (buf.length < 200) return NextResponse.json({ ok: false, error: 'la firma está vacía' }, { status: 400 })
  if (buf.length > 2 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'la firma es demasiado grande' }, { status: 413 })

  // Sube el PNG al bucket privado (no se guarda base64 en la tabla).
  const path = `${c.id}/${signer.id}.png`
  const { error: upErr } = await sb.storage.from(SIGN_BUCKET).upload(path, buf, { contentType: 'image/png', upsert: true })
  if (upErr) return NextResponse.json({ ok: false, error: 'no se pudo guardar la firma: ' + upErr.message }, { status: 500 })

  const ip = ipDeReq(req)
  const ua = req.headers.get('user-agent') || null
  const signedAt = new Date().toISOString()
  await sb.from('signers').update({ signed_at: signedAt, signature_image: path, ip, user_agent: ua }).eq('id', signer.id)
  await logEvent(sb, c.id, 'signed', { signerId: signer.id, payload: { ip, user_agent: ua } })

  // ¿Ya firmaron todos? Entonces el contrato queda completo.
  const firmantes = await getSignersByContract(sb, c.id)
  const faltan = firmantes.filter((s) => s.id !== signer.id && !s.signed_at).length
  let estado = c.status
  if (faltan === 0) {
    estado = 'completed'
    await sb.from('contracts').update({ status: 'completed', completed_at: signedAt }).eq('id', c.id)
    await logEvent(sb, c.id, 'completed', {})
    // Fase 3 (PDF final) y Fase 4 (correo con el PDF) se disparan aquí.
  } else {
    estado = 'partially_signed'
    await sb.from('contracts').update({ status: 'partially_signed' }).eq('id', c.id)
  }

  return NextResponse.json({ ok: true, estado, completo: faltan === 0 })
}

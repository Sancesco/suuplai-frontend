import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkPanel } from '@/lib/aplicaciones'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const BUCKET = 'aplicaciones-cv'

// Sube un CV (PDF) al bucket y lo asocia a la aplicación. Devuelve la URL pública.
export async function POST(req: Request) {
  if (!checkPanel(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ ok: false, error: 'body inválido' }, { status: 400 })
  const file = form.get('file')
  const id = String(form.get('id') ?? '').trim()
  const nombre = String(form.get('nombre') ?? '').trim()
  if (!(file instanceof Blob) || !id) return NextResponse.json({ ok: false, error: 'falta archivo o id' }, { status: 400 })
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'archivo muy grande (máx 15MB)' }, { status: 413 })

  const orig = (file as File).name || 'cv.pdf'
  const ext = orig.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf'
  const path = `${id}/${Date.now()}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: file.type || 'application/pdf', upsert: true })
  if (upErr) return NextResponse.json({ ok: false, error: 'no se pudo subir (¿corriste el SQL que crea el bucket?)', detail: upErr.message }, { status: 400 })
  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path)
  const url = pub.publicUrl
  await sb.from('app_applications').update({ cv_url: url, cv_nombre: nombre || orig }).eq('id', id)
  return NextResponse.json({ ok: true, url, nombre: nombre || orig })
}

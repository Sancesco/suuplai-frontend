import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound, prepararProspecto } from '@/lib/outbound'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.suuplai.com.mx'
const ESTADOS = ['nueva', 'interesa', 'preparada', 'aplicada', 'contacto_enviado', 'entrevista', 'descartada']

// Una vacante por id (para la página de detalle).
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const { data } = await sb.from('vacantes').select('*').eq('id', params.id).maybeSingle()
  if (!data) return NextResponse.json({ ok: false, error: 'no encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true, vacante: data })
}

// Edita una vacante: estado, notas, datos de contacto, textos preparados (editables). Con
// generarCv:true crea el link de CV rastreable (reusa el sistema de /aplicaciones/p/<slug>).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const id = params.id
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ ok: false, error: 'body inválido' }, { status: 400 })

  // Generar link de CV rastreado, en español o inglés (CV distinto por idioma). Base del slug:
  // empresa (o el puesto si no hay). Se puede regenerar para cambiar de idioma.
  if (b.generarCv === true) {
    const idioma: 'es' | 'en' = b.idioma === 'en' ? 'en' : 'es'
    const { data: v } = await sb.from('vacantes').select('empresa,titulo,contacto_nombre').eq('id', id).maybeSingle()
    if (!v) return NextResponse.json({ ok: false, error: 'no encontrada' }, { status: 404 })
    try {
      const base = `${(v.empresa || v.titulo || 'vacante').toString().slice(0, 36)}${idioma === 'en' ? ' en' : ''}`
      const { slug } = await prepararProspecto(sb, { empresa: base, persona: v.contacto_nombre || null, puesto: v.titulo || null, idioma })
      const cv_link = `${SITE}/aplicaciones/p/${slug}`
      await sb.from('vacantes').update({ cv_link, actualizada_en: new Date().toISOString() }).eq('id', id)
      return NextResponse.json({ ok: true, cv_link, idioma })
    } catch (e) {
      return NextResponse.json({ ok: false, error: 'no se pudo generar el link: ' + (e instanceof Error ? e.message : 'error') }, { status: 500 })
    }
  }

  const patch: Record<string, unknown> = { actualizada_en: new Date().toISOString() }
  if (b.estado && ESTADOS.includes(String(b.estado))) {
    patch.estado = b.estado
    if (b.estado === 'aplicada') patch.aplicada_en = new Date().toISOString()
  }
  for (const k of ['notas', 'contacto_nombre', 'contacto_linkedin', 'contacto_email', 'carta', 'mensaje_contacto'] as const) {
    if (b[k] !== undefined) patch[k] = String(b[k] ?? '') || null
  }
  if (b.respuestas !== undefined && typeof b.respuestas === 'object') patch.respuestas = b.respuestas

  const { error } = await sb.from('vacantes').update(patch).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

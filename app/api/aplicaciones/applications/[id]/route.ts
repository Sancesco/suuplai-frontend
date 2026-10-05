import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkPanel, slugify, analizarVacante, type Application } from '@/lib/aplicaciones'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ESTADOS = ['borrador', 'enviada', 'abierta', 'leida', 'compartida', 'respondida', 'rechazada']

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!checkPanel(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const { data: app } = await sb.from('app_applications').select('*').eq('id', params.id).maybeSingle()
  if (!app) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  const { data: events } = await sb.from('app_events').select('tipo,visitor_id,data,device,referrer,created_at').eq('application_id', params.id).order('created_at', { ascending: false }).limit(500)
  return NextResponse.json({ ok: true, app, events: events ?? [] })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!checkPanel(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const { data: app } = await sb.from('app_applications').select('*').eq('id', params.id).maybeSingle()
  if (!app) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  const a = app as Application

  const patch: Record<string, unknown> = {}
  for (const k of ['posicionamiento', 'carta', 'cv_url', 'cv_nombre', 'video_url']) if (b?.[k] !== undefined) patch[k] = b[k]
  if (b?.solo_cv !== undefined) patch.solo_cv = b.solo_cv === true
  if (b?.idioma !== undefined) patch.idioma = b.idioma === 'en' ? 'en' : 'es'
  if (b?.estado && ESTADOS.includes(String(b.estado))) patch.estado = b.estado

  const idiomaActual = patch.idioma !== undefined ? String(patch.idioma) : (a.idioma === 'en' ? 'en' : 'es')

  // Registrar un correo de seguimiento enviado (reinicia el contador de X días).
  if (b?.action === 'seguimiento') {
    await sb.from('app_events').insert({ application_id: a.id, slug: a.slug, tipo: 'followup', data: { via: 'panel' } })
    const { data: fresh } = await sb.from('app_applications').select('*').eq('id', a.id).maybeSingle()
    return NextResponse.json({ ok: true, app: fresh })
  }

  // Reanalizar (si falló al crear o cambió la vacante)
  if (b?.action === 'reanalizar') {
    try { patch.analysis = await analizarVacante(a.empresa, a.puesto, a.vacante, idiomaActual) }
    catch (e) { return NextResponse.json({ ok: false, error: 'no se pudo analizar', detail: e instanceof Error ? e.message : '' }, { status: 502 }) }
  }

  // Publicar: genera slug único y deja el link listo.
  if (b?.action === 'publicar') {
    const soloCv = patch.solo_cv !== undefined ? patch.solo_cv === true : a.solo_cv === true
    if (soloCv) {
      const cv = patch.cv_url !== undefined ? String(patch.cv_url ?? '').trim() : String(a.cv_url ?? '').trim()
      if (!cv) return NextResponse.json({ ok: false, error: 'Sube el CV antes de publicar el link de solo CV.' }, { status: 400 })
    } else if (a.analysis?.obligatoria && !String(a.carta ?? '').trim() && !b?.forzar) {
      return NextResponse.json({ ok: false, error: 'La vacante pide algo obligatorio: ' + a.analysis.obligatoria + '. Cúbrelo en la carta antes de publicar.' }, { status: 400 })
    }
    let slug = a.slug
    if (!slug) {
      let base = slugify(b?.slug ? String(b.slug) : a.empresa)
      slug = base
      for (let i = 0; i < 20; i++) {
        const { data: ex } = await sb.from('app_applications').select('id').eq('slug', slug).maybeSingle()
        if (!ex) break
        slug = `${base}-${Math.random().toString(36).slice(2, 5)}`
      }
      patch.slug = slug
    }
    if (a.estado === 'borrador') patch.estado = 'enviada'
  }

  const { error } = await sb.from('app_applications').update(patch).eq('id', params.id)
  if (error) return NextResponse.json({ ok: false, error: 'no se pudo guardar', detail: error.message }, { status: 500 })
  const { data: fresh } = await sb.from('app_applications').select('*').eq('id', params.id).maybeSingle()
  return NextResponse.json({ ok: true, app: fresh })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!checkPanel(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  await sb.from('app_applications').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}

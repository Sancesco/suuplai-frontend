import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound, prepararProspecto, type Prospecto } from '@/lib/outbound'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Lista de prospectos + señales (clics del /r, aperturas/tiempo/descarga/chat de la página de CV).
export async function GET(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const { data: pros } = await sb.from('outbound_prospecto').select('*').order('created_at', { ascending: false })
  const list = (pros ?? []) as Prospecto[]
  const slugs = list.map((p) => p.slug).filter(Boolean) as string[]

  const clicks = new Map<string, number>()
  const ev = new Map<string, { open: number; seconds: number; cv: number; chat: number; last: string | null }>()
  if (slugs.length) {
    const [lk, events] = await Promise.all([
      sb.from('links').select('slug,clicks,last_click_at').in('slug', slugs),
      sb.from('app_events').select('slug,tipo,data,created_at').in('slug', slugs),
    ])
    for (const l of (lk.data ?? []) as { slug: string; clicks: number }[]) clicks.set(l.slug, l.clicks ?? 0)
    for (const e of (events.data ?? []) as { slug: string; tipo: string; data: { seconds?: number } | null; created_at: string }[]) {
      if (!ev.has(e.slug)) ev.set(e.slug, { open: 0, seconds: 0, cv: 0, chat: 0, last: null })
      const s = ev.get(e.slug)!
      if (e.tipo === 'open') s.open++
      else if (e.tipo === 'cv_download') s.cv++
      else if (e.tipo === 'chat_message') s.chat++
      else if (e.tipo === 'time_on_page') s.seconds += Number(e.data?.seconds || 0)
      if (!s.last || e.created_at > s.last) s.last = e.created_at
    }
  }

  const out = list.map((p) => {
    const e = p.slug ? ev.get(p.slug) : undefined
    return {
      id: p.id, empresa: p.empresa, persona: p.persona, puesto: p.puesto, email: p.email,
      sector: p.sector, idioma: p.idioma, slug: p.slug, estado: p.estado, pausado: p.pausado, created_at: p.created_at,
      clicks: p.slug ? (clicks.get(p.slug) ?? 0) : 0,
      abierto: e?.open ?? 0, seconds: e?.seconds ?? 0, cv: e?.cv ?? 0, chat: e?.chat ?? 0, last: e?.last ?? null,
    }
  })
  return NextResponse.json({ ok: true, prospectos: out })
}

// Crea prospectos (bloque o uno) y les prepara el link de CV + /r. Dedup por correo.
export async function POST(req: Request) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const idioma: 'es' | 'en' = b?.idioma === 'en' ? 'en' : 'es'
  const filas = Array.isArray(b?.prospectos) ? b.prospectos : []
  if (!filas.length) return NextResponse.json({ ok: false, error: 'no hay prospectos' }, { status: 400 })

  let creados = 0; const saltados: string[] = []; const errores: string[] = []
  for (const f of filas) {
    const empresa = String(f?.empresa ?? '').trim()
    const email = String(f?.email ?? '').trim().toLowerCase()
    if (!empresa) { continue }
    // dedup por correo
    if (email) {
      const { data: dup } = await sb.from('outbound_prospecto').select('id').eq('email', email).maybeSingle()
      if (dup) { saltados.push(email); continue }
    }
    try {
      const { slug, appId } = await prepararProspecto(sb, { empresa, persona: String(f?.persona ?? '').trim() || null, puesto: String(f?.puesto ?? '').trim() || null, idioma })
      const { error } = await sb.from('outbound_prospecto').insert({
        empresa, persona: String(f?.persona ?? '').trim() || null, puesto: String(f?.puesto ?? '').trim() || null,
        email: email || null, sitio_web: String(f?.sitio_web ?? '').trim() || null, linkedin: String(f?.linkedin ?? '').trim() || null,
        idioma, slug, app_id: appId, estado: 'listo',
      })
      if (error) { errores.push(empresa + ': ' + error.message); continue }
      creados++
    } catch (e) { errores.push(empresa + ': ' + (e instanceof Error ? e.message : 'error')) }
  }
  return NextResponse.json({ ok: true, creados, saltados, errores })
}

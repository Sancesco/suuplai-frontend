import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRh } from '@/lib/interview'
import { getRoles } from '@/lib/roles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function slugify(s: string) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'rol' }
function keyify(s: string) { return slugify(s).replace(/-/g, '_') }

// Lista completa de roles (para el editor).
export async function GET(req: Request) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const roles = await getRoles()
  return NextResponse.json({ ok: true, roles })
}

// Crea o actualiza un rol.
export async function POST(req: Request) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const b = await req.json().catch(() => null)
  const name = String(b?.name ?? '').trim()
  if (!name) return NextResponse.json({ ok: false, error: 'falta el nombre del rol' }, { status: 400 })

  const dimsIn = Array.isArray(b?.dimensions) ? b.dimensions : []
  const dimensions = dimsIn
    .map((d: { key?: string; label?: string; desc?: string }) => ({ label: String(d?.label ?? '').trim(), desc: String(d?.desc ?? '').trim() }))
    .filter((d: { label: string }) => d.label)
    .map((d: { label: string; desc: string }) => ({ key: keyify(d.label), label: d.label, desc: d.desc }))

  const qfIn = Array.isArray(b?.quick_fields) ? b.quick_fields : []
  const quick_fields = qfIn
    .map((f: { label?: string; type?: string; options?: unknown; required?: boolean; knockout?: unknown }) => {
      const label = String(f?.label ?? '').trim()
      const type = ['text', 'number', 'select'].includes(String(f?.type)) ? String(f?.type) : 'text'
      const options = type === 'select' && Array.isArray(f?.options) ? (f.options as unknown[]).map(String).filter(Boolean) : undefined
      const knockout = Array.isArray(f?.knockout) ? (f.knockout as unknown[]).map(String).filter(Boolean) : undefined
      return { key: keyify(label), label, type, options, required: !!f?.required, knockout }
    })
    .filter((f: { label: string }) => f.label)

  const row = {
    name,
    context: String(b?.context ?? '').trim(),
    objetivo: String(b?.objetivo ?? '').trim(),
    salario: String(b?.salario ?? '').trim(),
    dimensions, quick_fields,
    active: true,
  }

  const id = String(b?.id ?? '')
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (isUuid) {
    const { error } = await sb.from('interview_roles').update(row).eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: 'no se pudo guardar (¿corriste el SQL de interview_roles?)', detail: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, id })
  }
  // nuevo: slug único
  let slug = slugify(b?.slug ? String(b.slug) : name)
  const { data: ex } = await sb.from('interview_roles').select('id').eq('slug', slug).maybeSingle()
  if (ex) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
  const { data, error } = await sb.from('interview_roles').insert({ ...row, slug }).select('id').single()
  if (error || !data) return NextResponse.json({ ok: false, error: 'no se pudo crear (¿corriste el SQL de interview_roles?)', detail: error?.message }, { status: 400 })
  return NextResponse.json({ ok: true, id: data.id })
}

// Borra (desactiva) un rol.
export async function DELETE(req: Request) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const { searchParams } = new URL(req.url)
  const id = String(searchParams.get('id') ?? '')
  if (!id) return NextResponse.json({ ok: false, error: 'falta id' }, { status: 400 })
  await sb.from('interview_roles').update({ active: false }).eq('id', id)
  return NextResponse.json({ ok: true })
}

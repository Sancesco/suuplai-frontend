import { NextResponse } from 'next/server'
import { getSupabaseAdmin, checkOutbound } from '@/lib/outbound'
import { leerPreguntasGreenhouse } from '@/lib/vacantes/ats'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const AUTO = /first name|last name|full name|email|correo|phone|tel[eé]fono|resume|cv|cover letter|linkedin|github|website|portfolio|location|ubicaci[oó]n|city|ciudad|gender|race|ethnic|veteran|disab/i

// Si la vacante es de Greenhouse, re-jala las preguntas reales. Si no, acepta texto pegado con las
// preguntas (una por línea) y lo convierte en lista [{label, required, auto}].
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!checkOutbound(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const { data: v } = await sb.from('vacantes').select('id,ats,ats_token,ats_job_id').eq('id', params.id).maybeSingle()
  if (!v) return NextResponse.json({ ok: false, error: 'no encontrada' }, { status: 404 })

  let preguntas: { label: string; required: boolean; auto: boolean; type?: string; opciones?: string[] }[] = []
  if (v.ats === 'greenhouse' && v.ats_token && v.ats_job_id) {
    preguntas = await leerPreguntasGreenhouse(v.ats_token, v.ats_job_id)
  } else {
    const b = await req.json().catch(() => null)
    const texto = String(b?.texto ?? '')
    preguntas = texto.split('\n').map((l) => l.trim()).filter((l) => l.length >= 3)
      .map((label) => ({ label: label.replace(/\s*\*\s*$/, ''), required: /\*\s*$/.test(label), auto: AUTO.test(label) }))
  }
  await sb.from('vacantes').update({ preguntas, actualizada_en: new Date().toISOString() }).eq('id', params.id)
  return NextResponse.json({ ok: true, preguntas })
}

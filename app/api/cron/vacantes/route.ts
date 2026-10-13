import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { HAY_LLAVES } from '@/lib/vacantes/radar'
import { correrRadar } from '@/lib/vacantes/correr'
import { leerPreguntasGreenhouse, enLotes } from '@/lib/vacantes/ats'
import { calificarVarias } from '@/lib/vacantes/fit'
import { sendTelegram } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.suuplai.com.mx'

// Cron diario: radar completo (agregadores + descubrimiento + empresas ATS), guarda nuevas, jala
// preguntas de Greenhouse y manda el top 10 por Telegram (empresas objetivo primero).
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || ''
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('no autorizado', { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false }, { status: 500 })

  const encontradas = await correrRadar(sb, { minPuntaje: 2, descubrir: 'full' })
  const { data: prev } = await sb.from('vacantes').select('clave')
  const existentes = new Set((prev ?? []).map((r: { clave: string }) => r.clave))
  const nuevas = encontradas.filter((v) => v.clave && !existentes.has(v.clave))

  if (nuevas.length) {
    const { data: ins } = await sb.from('vacantes').insert(nuevas.map((v) => ({
      clave: v.clave, titulo: v.titulo, empresa: v.empresa || null, ubicacion: v.ubicacion || null,
      descripcion: v.descripcion || null, sueldo: v.sueldo || null, link: v.link || null, fuente: v.fuente || null,
      ats: v.ats || null, ats_token: v.ats_token || null, ats_job_id: v.ats_job_id || null,
      fecha_publicada: v.fecha_publicada, puntaje: v.puntaje ?? 0, ingles: !!v.ingles,
    }))).select('id,titulo,empresa,puntaje,ingles,fuente,ats')

    const ghNuevas = nuevas.filter((v) => v.ats === 'greenhouse' && v.ats_token && v.ats_job_id).slice(0, 20)
    await enLotes(ghNuevas.map((v) => async () => {
      const preguntas = await leerPreguntasGreenhouse(v.ats_token!, v.ats_job_id!)
      if (preguntas.length) await sb.from('vacantes').update({ preguntas }).eq('clave', v.clave)
    }), 4)

    // Fit con IA para las nuevas.
    const fits = await calificarVarias(nuevas.slice(0, 15).map((v) => ({ clave: v.clave!, titulo: v.titulo, empresa: v.empresa, ubicacion: v.ubicacion, descripcion: v.descripcion })), 4)
    await Promise.all(fits.map((f) => sb.from('vacantes').update({ fit: f.fit, fit_razon: f.razon }).eq('clave', f.clave)))

    const rows = (ins ?? []) as { id: string; titulo: string; empresa: string | null; puntaje: number; ingles: boolean; ats: string | null }[]
    const top = rows.sort((a, b) => (b.ats ? 1 : 0) - (a.ats ? 1 : 0) || (b.puntaje ?? 0) - (a.puntaje ?? 0)).slice(0, 10)
    if (top.length) {
      const lineas = top.map((v, i) => `${i + 1}. <b>${v.titulo}</b> · ${v.empresa || '—'} · ${v.puntaje}pts${v.ats ? ` · ${v.ats}` : ''}${v.ingles ? ' 🇬🇧' : ''}\n<a href="${SITE}/outbound/vacantes/${v.id}">ver</a>`)
      await sendTelegram(`💼 <b>${nuevas.length} vacante(s) nueva(s)</b> hoy. Top ${top.length}:\n\n${lineas.join('\n')}`)
    }
  }
  // Catch-up: califica un lote de vacantes viejas que aún no tienen fit (poco a poco cada corrida).
  const { data: pend } = await sb.from('vacantes').select('id,titulo,empresa,ubicacion,descripcion').is('fit', null).neq('estado', 'descartada').limit(15)
  if (pend && pend.length) {
    const fits2 = await calificarVarias(pend.map((v) => ({ id: v.id, titulo: v.titulo, empresa: v.empresa, ubicacion: v.ubicacion, descripcion: v.descripcion })), 4)
    await Promise.all(fits2.map((f) => sb.from('vacantes').update({ fit: f.fit, fit_razon: f.razon }).eq('id', f.id)))
  }

  return NextResponse.json({ ok: true, nuevas: nuevas.length, total: encontradas.length, ejemplo: !HAY_LLAVES() })
}

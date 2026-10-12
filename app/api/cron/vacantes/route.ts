import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { correrRadar, HAY_LLAVES } from '@/lib/vacantes/radar'
import { sendTelegram } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.suuplai.com.mx'

// Cron diario: corre el radar, guarda las nuevas y manda el top 10 por Telegram con link al detalle.
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || ''
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('no autorizado', { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false }, { status: 500 })
  if (!HAY_LLAVES()) return NextResponse.json({ ok: true, nota: 'sin llaves de Jooble/Adzuna' })

  const encontradas = await correrRadar(3)
  const { data: prev } = await sb.from('vacantes').select('clave')
  const existentes = new Set((prev ?? []).map((r: { clave: string }) => r.clave))
  const nuevas = encontradas.filter((v) => v.clave && !existentes.has(v.clave))

  if (nuevas.length) {
    const { data: ins } = await sb.from('vacantes').insert(nuevas.map((v) => ({
      clave: v.clave, titulo: v.titulo, empresa: v.empresa || null, ubicacion: v.ubicacion || null,
      descripcion: v.descripcion || null, sueldo: v.sueldo || null, link: v.link || null,
      fuente: v.fuente || null, fecha_publicada: v.fecha_publicada, puntaje: v.puntaje ?? 0, ingles: !!v.ingles,
    }))).select('id,titulo,empresa,puntaje,ingles')

    const top = (ins ?? []).sort((a, b) => (b.puntaje ?? 0) - (a.puntaje ?? 0)).slice(0, 10)
    if (top.length) {
      const lineas = top.map((v, i) => `${i + 1}. <b>${v.titulo}</b> · ${v.empresa || '—'} · ${v.puntaje}pts${v.ingles ? ' 🇬🇧' : ''}\n<a href="${SITE}/outbound/vacantes/${v.id}">ver</a>`)
      await sendTelegram(`💼 <b>${nuevas.length} vacante(s) nueva(s)</b> hoy. Top ${top.length}:\n\n${lineas.join('\n')}`)
    }
  }
  return NextResponse.json({ ok: true, nuevas: nuevas.length, total: encontradas.length })
}

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendTelegram } from '@/lib/telegram'
import { deviceKey, parseUa } from '@/lib/ua'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface LinkRow {
  id: string
  destination: string
  clicks: number
  archived: boolean
  notify: boolean
  label: string | null
  first_click_at: string | null
}

const BOT_RE =
  /(bot|crawl|spider|preview|whatsapp|telegram|slack|twitter|facebookexternalhit|facebot|discord|linkedin|pinterest|embed|skype|vkshare|lighthouse|headless)/i

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug
  const origin = new URL(req.url).origin
  const home = new URL('/', origin)

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.redirect(home, 302)

  const { data, error } = await supabase
    .from('links')
    .select('id,destination,clicks,archived,notify,label,first_click_at')
    .eq('slug', slug)
    .maybeSingle()

  const link = data as LinkRow | null
  if (error || !link || link.archived) return NextResponse.redirect(home, 302)

  const dest = new URL(link.destination, origin)

  // ── Señales de la request ──────────────────────────────────────────────────
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '').trim()
  const ua = req.headers.get('user-agent') || ''
  let city = 'desconocido'
  try {
    const c = req.headers.get('x-vercel-ip-city')
    if (c) city = decodeURIComponent(c)
  } catch {
    /* noop */
  }
  const country = req.headers.get('x-vercel-ip-country') || 'desconocido'

  const myIps = (process.env.MY_IP || '').split(',').map((s) => s.trim()).filter(Boolean)
  const isMyIp = Boolean(ip) && myIps.includes(ip)
  const isBot = BOT_RE.test(ua)
  const realClick = !isMyIp && !isBot

  if (realClick) {
    try {
      const now = Date.now()
      const nowISO = new Date(now).toISOString()
      const newClicks = (link.clicks ?? 0) + 1
      const curDevice = deviceKey(ua)

      // Clics previos de este link (para revisita / dispositivo o ciudad nuevos)
      const { data: prior } = await supabase
        .from('events')
        .select('user_agent,city,created_at')
        .eq('type', 'link_click')
        .eq('src', slug)
        .order('created_at', { ascending: false })
        .limit(500)
      const priorRows = (prior ?? []) as { user_agent: string | null; city: string | null; created_at: string }[]
      const priorDevices = new Set(priorRows.map((r) => deviceKey(r.user_agent)))
      const priorCities = new Set(priorRows.map((r) => r.city || 'desconocido'))

      // Revisita: mismo dispositivo visto hace 24h+
      let revisitDays = 0
      for (const r of priorRows) {
        if (deviceKey(r.user_agent) === curDevice) {
          const diff = now - new Date(r.created_at).getTime()
          if (diff >= 24 * 60 * 60 * 1000) revisitDays = Math.floor(diff / (24 * 60 * 60 * 1000))
          break // el más reciente de ese dispositivo
        }
      }
      const isRevisit = revisitDays > 0
      const isNewDevice = priorRows.length > 0 && !priorDevices.has(curDevice)
      const isNewCity = priorRows.length > 0 && city !== 'desconocido' && !priorCities.has(city)

      // Actualiza link: clics, última visita, y primera apertura si es la primera vez
      await supabase
        .from('links')
        .update({ clicks: newClicks, last_click_at: nowISO, first_click_at: link.first_click_at ?? nowISO })
        .eq('id', link.id)

      await supabase.from('events').insert({
        type: 'link_click',
        src: slug,
        payload: { slug, device: curDevice },
        referrer: req.headers.get('referer'),
        user_agent: ua,
        path: `/r/${slug}`,
        city,
        country,
      })

      // ── Alerta con cooldown de 30 min por slug (claim atómico) ──────────────
      if (link.notify) {
        const cutoff = new Date(now - 30 * 60 * 1000).toISOString()
        const { data: claimed } = await supabase
          .from('links')
          .update({ last_notified_at: nowISO })
          .eq('id', link.id)
          .eq('notify', true)
          .or(`last_notified_at.is.null,last_notified_at.lt.${cutoff}`)
          .select('id')

        if (claimed && claimed.length > 0) {
          const name = escapeHtml(link.label || slug)
          const device = parseUa(ua).type
          const hora = new Date(now).toLocaleTimeString('es-MX', {
            timeZone: 'America/Mexico_City',
            hour: '2-digit',
            minute: '2-digit',
          })
          let msg: string
          if (isRevisit) {
            msg =
              `🔥 <b>${name}</b> VOLVIÓ a tu link\n` +
              `Visita #${newClicks} · última vez hace ${revisitDays} día${revisitDays === 1 ? '' : 's'}\n` +
              `${device} · ${escapeHtml(city)}, ${escapeHtml(country)} · ${hora}`
          } else {
            msg =
              `🔔 <b>${name}</b> abrió tu link\n` +
              `Visita #${newClicks} · ${escapeHtml(city)}, ${escapeHtml(country)}\n` +
              `${device} · ${hora}`
            if (isNewDevice || isNewCity) {
              msg += `\n🔥 Dispositivo${isNewCity ? '/ciudad' : ''} nuevo — puede que lo hayan compartido`
            }
          }
          await sendTelegram(msg)
        }
      }
    } catch (e) {
      console.error('[/r] tracking error:', e)
    }
  }

  return NextResponse.redirect(dest, 302)
}

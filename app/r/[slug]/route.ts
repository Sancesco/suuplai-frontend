import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface LinkRow {
  id: string
  destination: string
  clicks: number
  archived: boolean
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const origin = new URL(req.url).origin
  const home = new URL('/', origin)

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.redirect(home, 302)

  const { data, error } = await supabase
    .from('links')
    .select('id,destination,clicks,archived')
    .eq('slug', params.slug)
    .maybeSingle()

  const link = data as LinkRow | null
  if (error || !link || link.archived) {
    return NextResponse.redirect(home, 302)
  }

  // Incrementar clics + registrar el evento (best-effort, no bloquea el redirect si algo falla).
  try {
    await supabase.from('links').update({ clicks: (link.clicks ?? 0) + 1 }).eq('id', link.id)
    await supabase.from('events').insert({
      type: 'link_click',
      src: params.slug,
      payload: { slug: params.slug },
      user_agent: req.headers.get('user-agent'),
      referrer: req.headers.get('referer'),
      path: `/r/${params.slug}`,
    })
  } catch {
    /* noop */
  }

  const dest = new URL(link.destination, origin)
  return NextResponse.redirect(dest, 302)
}

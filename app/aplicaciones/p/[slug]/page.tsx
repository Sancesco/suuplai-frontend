import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSupabaseAdmin, type Application } from '@/lib/aplicaciones'
import { Tracker } from './Tracker'
import { CvButton } from './CvButton'
import { Toolbar } from './Toolbar'
import { ReadingBar } from './ReadingBar'

export const dynamic = 'force-dynamic'
const NOMBRE = 'Santiago Céspedes'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Space+Mono:wght@400;700&display=swap');
.apx{--ink:#17140F;--muted:#6b6459;--faint:#9c948a;--line:#E4DECF;--paper:#FCFBF6;--accent:#B4451A;--bg:#232420;
  --syne:'Syne',system-ui,sans-serif;--body:'DM Sans',system-ui,sans-serif;--mono:'Space Mono',ui-monospace,monospace}
.apx{background:var(--bg);min-height:100dvh;font-family:var(--body);color:var(--ink);padding:20px 12px 48px}
.apx *{box-sizing:border-box}
.doc{max-width:680px;margin:0 auto;background:var(--paper);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);
  padding:clamp(26px,5vw,52px)}
.kick{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint)}
.nm{font-family:var(--syne);font-weight:800;font-size:clamp(30px,7vw,44px);line-height:1.02;letter-spacing:-.02em;margin:6px 0 4px}
.sub{font-size:16px;color:var(--muted)}
.sub b{color:var(--ink)}
.pos{font-size:15.5px;line-height:1.55;color:var(--ink);margin-top:14px;border-left:3px solid var(--accent);padding-left:12px}
.rule{height:1px;background:var(--line);margin:26px 0}
.carta{font-size:16.5px;line-height:1.75;color:#2a251d}
.carta p{margin:0 0 15px}
.carta strong{font-weight:600;color:var(--ink)}
.firma{font-family:var(--syne);font-weight:700;font-size:17px;margin-top:22px}
.cvcard{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-top:30px;
  border:1px solid var(--line);border-radius:12px;padding:16px 18px;background:#fff}
.cvcard .t{font-family:var(--syne);font-weight:700;font-size:15px}
.cvcard .s{font-size:12px;color:var(--muted)}
.cvframe{margin-top:18px;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}
.cvframe iframe{width:100%;height:min(78vh,900px);border:0;display:block}
.cvhero{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;margin-top:8px}
.cvhero .lead{font-size:15px;color:var(--muted);max-width:44ch}
@media(max-width:640px){.cvframe iframe{height:62vh}}
.foot{margin-top:34px;border-top:1px solid var(--line);padding-top:14px;font-size:11px;line-height:1.5;color:var(--faint)}
.vid{margin:22px 0;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:#000}
.vid video{width:100%;display:block}
.doc{animation:apxUp .5s ease both}
@keyframes apxUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.mobcv{display:none}
@media(max-width:640px){
  .apx{padding:14px 10px 88px}
  .mobcv{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));
    background:rgba(35,36,32,.94);backdrop-filter:blur(8px);border-top:1px solid rgba(255,255,255,.08)}
}
@media print{
  .no-print{display:none!important}
  .apx{background:#fff;padding:0}
  .doc{box-shadow:none;border-radius:0;max-width:none;padding:0;animation:none}
  .mobcv{display:none!important}
}
@media(prefers-reduced-motion:reduce){.doc{animation:none}}
`

async function getApp(slug: string): Promise<Application | null> {
  // Lectura directa a PostgREST con cache:'no-store' para evitar el Data Cache de Next
  // (que podía servir una respuesta vieja de la base, sin columnas nuevas como idioma).
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) return null
  const url = `${base}/rest/v1/app_applications?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`
  const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' })
  if (!r.ok) return null
  const rows = (await r.json()) as Application[]
  return rows[0] || null
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const app = await getApp(params.slug)
  if (!app) return { title: 'Aplicación', robots: { index: false, follow: false } }
  return { title: `${NOMBRE} — ${app.puesto} · ${app.empresa}`, description: app.posicionamiento || undefined, robots: { index: false, follow: false } }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const app = await getApp(params.slug)
  if (!app || !app.slug) notFound()
  const en = app.idioma === 'en'

  return (
    <div className="apx">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <ReadingBar />
      <Tracker slug={app.slug} />
      <Toolbar />

      <article className="doc">
        <div data-section="encabezado">
          <p className="kick">{app.solo_cv ? (en ? 'Resume' : 'Currículum') : (en ? 'Application' : 'Aplicación')} · {app.empresa}</p>
          <h1 className="nm">{NOMBRE}</h1>
          <p className="sub">{app.solo_cv ? (en ? 'Resume for' : 'Currículum para') : (en ? 'Applying for' : 'Aplicando a')} <b>{app.persona || app.puesto}</b></p>
          {app.posicionamiento && <p className="pos">{app.posicionamiento}</p>}
        </div>

        <div className="rule" />

        {app.video_url && (
          <div className="vid" data-section="video"><video src={app.video_url} controls playsInline /></div>
        )}

        {app.solo_cv ? (
          app.cv_url && (
            <div data-section="cv">
              <div className="cvhero">
                {!app.posicionamiento && <p className="lead">{en ? "Here's my resume. You can view it below or download it." : 'Aquí está mi currículum. Puedes verlo abajo o descargarlo.'}</p>}
                <CvButton slug={app.slug} cvUrl={app.cv_url} cvNombre={app.cv_nombre} en={en} />
              </div>
              <div className="cvframe"><iframe src={`${app.cv_url}#toolbar=0&view=FitH`} title={en ? 'Resume' : 'Currículum'} /></div>
            </div>
          )
        ) : (
          <>
            {app.carta ? (
              <div data-section="carta">
                <div className="carta" dangerouslySetInnerHTML={{ __html: app.carta }} />
                <p className="firma">— {NOMBRE}</p>
              </div>
            ) : <p className="carta" style={{ color: 'var(--faint)' }}>…</p>}

            {app.cv_url && (
              <div className="cvcard" data-section="cv">
                <div>
                  <div className="t">{en ? 'Resume' : 'Currículum'}</div>
                  <div className="s">{app.cv_nombre || (en ? 'PDF resume' : 'CV en PDF')}</div>
                </div>
                <CvButton slug={app.slug} cvUrl={app.cv_url} cvNombre={app.cv_nombre} en={en} />
              </div>
            )}
          </>
        )}

        <div className="foot">
          {NOMBRE} · {app.empresa}
        </div>
      </article>
    </div>
  )
}

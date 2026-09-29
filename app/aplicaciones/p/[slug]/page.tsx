import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSupabaseAdmin, type Application } from '@/lib/aplicaciones'
import { Tracker } from './Tracker'
import { CvButton } from './CvButton'

export const dynamic = 'force-dynamic'
const NOMBRE = 'Santiago Céspedes'

async function getApp(slug: string): Promise<Application | null> {
  const sb = getSupabaseAdmin(); if (!sb) return null
  const { data } = await sb.from('app_applications').select('*').eq('slug', slug).maybeSingle()
  return (data as Application) || null
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const app = await getApp(params.slug)
  if (!app) return { title: 'Aplicación', robots: { index: false, follow: false } }
  return { title: `${NOMBRE} — ${app.puesto} en ${app.empresa}`, description: app.posicionamiento || undefined, robots: { index: false, follow: false } }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const app = await getApp(params.slug)
  if (!app || !app.slug) notFound()

  return (
    <main className="min-h-screen bg-[#F4F2EC] text-neutral-900" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <Tracker slug={app.slug} />
      <div className="mx-auto w-full max-w-[640px] px-5 py-10 md:py-14">
        {/* encabezado */}
        <header className="border-b border-neutral-300 pb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500">Aplicación · {app.empresa}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl" style={{ fontFamily: "'Syne',system-ui,sans-serif" }}>
            {NOMBRE}
          </h1>
          <p className="mt-1 text-lg text-neutral-700">Aplicando a <strong>{app.puesto}</strong></p>
          {app.posicionamiento && <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">{app.posicionamiento}</p>}
        </header>

        {/* video (opcional, se llena en pasos siguientes) */}
        {app.video_url && (
          <div className="mt-8 overflow-hidden rounded-xl border border-neutral-300 bg-black">
            <video src={app.video_url} controls playsInline className="w-full" />
          </div>
        )}

        {/* carta */}
        {app.carta ? (
          <article
            className="mt-8 text-[16px] leading-[1.7] text-neutral-800 [&_p]:mb-4 [&_strong]:font-semibold"
            style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}
            dangerouslySetInnerHTML={{ __html: app.carta }}
          />
        ) : (
          <p className="mt-8 text-neutral-500">…</p>
        )}

        {/* CV */}
        {app.cv_url && (
          <div className="mt-8">
            <CvButton slug={app.slug} cvUrl={app.cv_url} cvNombre={app.cv_nombre} />
          </div>
        )}

        {/* pie */}
        <footer className="mt-14 border-t border-neutral-300 pt-5">
          <p className="text-[11px] leading-relaxed text-neutral-400">
            Este documento registra interacciones (aperturas, tiempo de lectura, descargas) para dar seguimiento a la aplicación. No se guarda tu dirección IP.
          </p>
        </footer>
      </div>
    </main>
  )
}

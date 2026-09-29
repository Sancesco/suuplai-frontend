'use client'

import { track } from './track'

export function CvButton({ slug, cvUrl, cvNombre }: { slug: string; cvUrl: string; cvNombre: string | null }) {
  return (
    <a
      href={cvUrl}
      target="_blank"
      rel="noreferrer"
      onClick={() => track(slug, 'cv_download', { nombre: cvNombre || '' })}
      className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
    >
      ↓ Descargar CV{cvNombre ? ` · ${cvNombre}` : ''}
    </a>
  )
}

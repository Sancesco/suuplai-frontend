'use client'

import { track } from './track'

export function CvButton({ slug, cvUrl, cvNombre, full }: { slug: string; cvUrl: string; cvNombre: string | null; full?: boolean }) {
  return (
    <a
      href={cvUrl}
      target="_blank"
      rel="noreferrer"
      onClick={() => track(slug, 'cv_download', { nombre: cvNombre || '' })}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 ${full ? 'w-full' : ''}`}
    >
      ↓ Descargar CV{cvNombre ? ` · ${cvNombre}` : ''}
    </a>
  )
}

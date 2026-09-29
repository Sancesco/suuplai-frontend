'use client'

import { useState } from 'react'
import { track } from './track'

// Barra de acciones sobre el documento (se oculta al imprimir).
export function Toolbar({ slug, cvUrl, cvNombre }: { slug: string; cvUrl: string | null; cvNombre: string | null }) {
  const [copiado, setCopiado] = useState(false)
  const btn = 'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[13px] font-medium text-neutral-200 transition hover:bg-white/10'
  return (
    <div className="no-print mx-auto mb-4 flex w-full max-w-[680px] flex-wrap items-center justify-center gap-2 px-2">
      {cvUrl && (
        <a href={cvUrl} target="_blank" rel="noreferrer" onClick={() => track(slug, 'cv_download', { nombre: cvNombre || '' })}
          className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-2 text-[13px] font-bold text-neutral-900 transition hover:bg-lime-200">
          ↓ Descargar CV
        </a>
      )}
      <button onClick={() => window.print()} className={btn}>🖨 Imprimir / PDF</button>
      <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }} className={btn}>{copiado ? '✓ Copiado' : '🔗 Copiar link'}</button>
    </div>
  )
}

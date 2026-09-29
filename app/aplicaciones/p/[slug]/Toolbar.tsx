'use client'

import { useState } from 'react'

// Barra de acciones sobre el documento (se oculta al imprimir). El CV va abajo, con la carta.
export function Toolbar() {
  const [copiado, setCopiado] = useState(false)
  const btn = 'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[13px] font-medium text-neutral-200 transition hover:bg-white/10'
  return (
    <div className="no-print mx-auto mb-4 flex w-full max-w-[680px] flex-wrap items-center justify-center gap-2 px-2">
      <button onClick={() => window.print()} className={btn}>🖨 Imprimir / PDF</button>
      <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }} className={btn}>{copiado ? '✓ Copiado' : '🔗 Copiar link'}</button>
    </div>
  )
}

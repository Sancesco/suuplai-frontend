'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MARCAS, type Marca } from '@/lib/marcas'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

// Item especial "y +más" que va al final del carrusel.
type Item = Marca | { mas: true }
const isMas = (it: Item): it is { mas: true } => 'mas' in it

function LogoCard({
  item,
  index,
  onHoverChange,
  isHovered,
}: {
  item: Item
  index: number
  onHoverChange: (i: number | null) => void
  isHovered: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)

  // Tarjeta "y +más"
  if (isMas(item)) {
    return (
      <div
        className="logo-card relative flex items-center justify-center shrink-0"
        style={{ background: '#FBFAF6', borderRadius: '12px', border: '1.5px dashed rgba(255,107,53,0.5)' }}
      >
        <span className="font-syne font-extrabold text-center" style={{ fontSize: '26px', color: '#FF6B35', letterSpacing: '-1px' }}>
          y +más
        </span>
      </div>
    )
  }

  const showImage = item.logo && !imgFailed

  return (
    <div
      className="logo-card relative flex items-center justify-center shrink-0 hover-card"
      style={{ background: '#FBFAF6', borderRadius: '12px' }}
      onMouseEnter={() => onHoverChange(index)}
      onMouseLeave={() => onHoverChange(null)}
    >
      {showImage ? (
        <Image
          src={item.logo as string}
          alt={item.nombre}
          width={220}
          height={80}
          unoptimized
          onError={() => setImgFailed(true)}
          className="logo-card-img pointer-events-none"
          style={{ width: 'auto', objectFit: 'contain' }}
        />
      ) : (
        <span className="logo-card-text font-syne font-extrabold text-center px-2" style={{ color: '#111111', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
          {item.nombre}
        </span>
      )}

      {/* Tooltip al hover — desktop */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="logo-card-tooltip absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col gap-1"
            style={{
              bottom: 'calc(100% + 12px)',
              padding: '12px 14px',
              background: '#13131A',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              minWidth: '180px',
              maxWidth: '240px',
              zIndex: 30,
              boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
            }}
            role="tooltip"
          >
            <span className="font-dm text-white" style={{ fontSize: '13px', fontWeight: 500 }}>
              {item.nombre}
            </span>
            <span className="font-dm" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
              {item.categoria}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function MarcasSocias() {
  const [hovered, setHovered] = useState<number | null>(null)
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: hover)')
    setCanHover(mq.matches)
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleHover = (i: number | null) => {
    if (!canHover) return
    setHovered(i)
  }

  const items: Item[] = [...MARCAS, { mas: true }]
  // Duplicado para loop continuo
  const loop = [...items, ...items]

  return (
    <section className="py-20 px-6" style={{ background: '#0A0A0F' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="mb-10 text-center"
        >
          <span
            className="font-dm font-medium block mb-3"
            style={{ color: '#FF6B35', fontSize: '12px', letterSpacing: '2px' }}
          >
            MARCAS QUE YA LO USAN
          </span>
          <h2
            className="font-syne font-extrabold text-suu-text mb-3"
            style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-1.5px', lineHeight: 1.1 }}
          >
            Marcas mexicanas, ya en anaquel.
          </h2>
          <p
            className="font-dm text-suu-muted max-w-2xl mx-auto"
            style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.6 }}
          >
            Productores independientes que entraron a tiendas físicas con Suuplai — sin slotting
            fees, sin esperar meses.
          </p>
        </motion.div>
      </div>

      {/* Marquee — pausa al hover, tooltips pueden desbordar hacia arriba */}
      <div
        className={`logo-carousel-mask overflow-x-clip${hovered !== null ? ' is-paused' : ''}`}
        style={{ overflowY: 'visible' }}
      >
        <div className="logo-marquee-track flex" style={{ width: 'max-content' }}>
          {loop.map((item, i) => (
            <LogoCard
              key={`${isMas(item) ? 'mas' : item.slug}-${i}`}
              item={item}
              index={i}
              isHovered={canHover && hovered === i}
              onHoverChange={handleHover}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

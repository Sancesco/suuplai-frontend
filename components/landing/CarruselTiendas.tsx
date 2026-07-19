'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { TIENDAS, type Tienda } from '@/lib/tiendas'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

function LogoCard({
  tienda,
  index,
  onHoverChange,
  isHovered,
}: {
  tienda: Tienda
  index: number
  onHoverChange: (i: number | null) => void
  isHovered: boolean
}) {
  return (
    <div
      className="logo-card relative flex items-center justify-center shrink-0 hover-card"
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
      }}
      onMouseEnter={() => onHoverChange(index)}
      onMouseLeave={() => onHoverChange(null)}
    >
      {tienda.logo ? (
        <Image
          src={tienda.logo}
          alt={tienda.nombre}
          width={220}
          height={80}
          className="logo-card-img pointer-events-none"
          style={{
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      ) : (
        <span
          className="logo-card-img pointer-events-none font-syne font-extrabold text-center px-2"
          style={{ fontSize: '18px', color: '#111111', letterSpacing: '-0.3px', lineHeight: 1.1 }}
        >
          {tienda.nombre}
        </span>
      )}

      {/* Hover tooltip, desktop only via CSS @media (hover: hover) */}
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
              minWidth: '200px',
              maxWidth: '260px',
              zIndex: 30,
              boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
            }}
            role="tooltip"
          >
            <span
              className="font-dm text-white"
              style={{ fontSize: '13px', fontWeight: 500 }}
            >
              {tienda.nombre}
            </span>
            <span
              className="font-dm"
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.4,
              }}
            >
              {tienda.sucursales} {tienda.sucursales === 1 ? 'sucursal' : 'sucursales'} ·{' '}
              {tienda.zonas}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function CarruselTiendas() {
  const [hovered, setHovered] = useState<number | null>(null)
  const [canHover, setCanHover] = useState(false)

  // Gate hover behavior to devices with a hover-capable pointer (no sticky-hover on touch)
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

  // Duplicate for seamless loop
  const loop = [...TIENDAS, ...TIENDAS]

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
            style={{ color: '#7A7A8A', fontSize: '12px', letterSpacing: '2px' }}
          >
            TIENDAS SOCIAS
          </span>
          <h2
            className="font-syne font-extrabold text-suu-text mb-3"
            style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-1.5px', lineHeight: 1.1 }}
          >
            +40 puntos de venta en CDMX y creciendo.
          </h2>
          <p
            className="font-dm text-suu-muted max-w-2xl mx-auto"
            style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.6 }}
          >
            Tiendas gourmet curadas, juice bars premium y mercados de barrio en Roma, Condesa,
            Polanco, Del Valle, Coyoacán y más.
          </p>
        </motion.div>
      </div>

      {/* Marquee, pauses while any logo is hovered (via .is-paused class).
          overflow-x-clip lets tooltips escape upward without forcing a vertical scrollbar. */}
      <div
        className={`logo-carousel-mask overflow-x-clip${hovered !== null ? ' is-paused' : ''}`}
        style={{ overflowY: 'visible' }}
      >
        <div
          className="logo-marquee-track flex"
          style={{ width: 'max-content' }}
        >
          {loop.map((tienda, i) => (
            <LogoCard
              key={`${tienda.slug}-${i}`}
              tienda={tienda}
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

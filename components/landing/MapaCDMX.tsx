'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

// Skeleton placeholder — same height as the real map to prevent CLS
function MapaPlaceholder() {
  return (
    <div
      className="animate-pulse"
      style={{
        width: '100%',
        height: 'clamp(280px, 50vw, 420px)',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #13131A 0%, #1a1a23 50%, #13131A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-busy="true"
      aria-label="Cargando mapa"
    >
      <span className="font-dm" style={{ color: 'rgba(240,239,232,0.4)', fontSize: '13px', letterSpacing: '1px' }}>
        Cargando mapa…
      </span>
    </div>
  )
}

// Leaflet chunk fetched only when shouldLoad is true (component first mounted).
const MapaLeaflet = dynamic(
  () => import('./MapaLeaflet').then((m) => ({ default: m.MapaLeaflet })),
  {
    ssr: false,
    loading: () => <MapaPlaceholder />,
  }
)

// Viewport gate — uses native IntersectionObserver with 200px rootMargin to start
// loading just before the map enters the screen. Skeleton stays in place until ready.
function MapaLeafletGate({ activeZone }: { activeZone: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (shouldLoad) return
    const el = containerRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shouldLoad])

  return (
    <div ref={containerRef}>
      {!shouldLoad ? (
        <MapaPlaceholder />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <MapaLeaflet activeZone={activeZone} />
        </motion.div>
      )}
    </div>
  )
}

const categoryFilters = ['Alimentos', 'Cosméticos', 'Wellness', 'Moda']
const zoneFilters = ['Roma/Condesa', 'Polanco', 'Coyoacán', 'Santa Fe', 'Norte', 'Sur']

export function MapaCDMX() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeZone, setActiveZone] = useState<string | null>(null)

  return (
    <section className="py-24 px-6" style={{ background: '#0A0A0F' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10"
        >
          <div>
            <span
              className="font-dm font-medium block mb-3"
              style={{ color: '#7A7A8A', fontSize: '12px', letterSpacing: '2px' }}
            >
              DÓNDE ESTAMOS
            </span>
            <h2
              className="font-syne font-extrabold text-suu-text"
              style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-1.5px' }}
            >
              Encuentra tiendas en tu zona
            </h2>
            <p className="font-dm text-suu-muted mt-2" style={{ fontSize: '16px', fontWeight: 300 }}>
              Zonas principales con espacios activos hoy: Condesa, Roma, Polanco, Coyoacán, Santa Fe, Narvarte, Doctores.
            </p>
          </div>
          <span
            className="inline-flex items-center shrink-0 gap-2 px-4 py-2 rounded-pill font-dm font-medium"
            style={{
              background: 'rgba(232,255,71,0.1)',
              border: '1px solid #E8FF47',
              color: '#E8FF47',
              fontSize: '13px',
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: '#E8FF47' }} />
            Espacios activos en CDMX
          </span>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="flex flex-col gap-3 mb-6"
        >
          <div className="flex gap-2 flex-wrap items-center">
            <span className="font-dm text-suu-muted" style={{ fontSize: '12px' }}>Categoría:</span>
            {categoryFilters.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className="px-3 py-1.5 rounded-pill font-dm text-sm transition-all duration-200"
                style={{
                  background: activeCategory === cat ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
                  border: activeCategory === cat ? '1px solid #FF6B35' : '1px solid rgba(255,255,255,0.07)',
                  color: activeCategory === cat ? '#FF6B35' : '#7A7A8A',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap items-center overflow-x-auto pb-1">
            <span className="font-dm text-suu-muted shrink-0" style={{ fontSize: '12px' }}>Zona:</span>
            {zoneFilters.map((zone) => (
              <button
                key={zone}
                onClick={() => setActiveZone(activeZone === zone ? null : zone)}
                className="px-3 py-1.5 rounded-pill font-dm text-sm transition-all duration-200 shrink-0"
                style={{
                  background: activeZone === zone ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
                  border: activeZone === zone ? '1px solid #FF6B35' : '1px solid rgba(255,255,255,0.07)',
                  color: activeZone === zone ? '#FF6B35' : '#7A7A8A',
                }}
              >
                {zone}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Leaflet Map */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={fadeUp}
          style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}
        >
          <MapaLeafletGate activeZone={activeZone} />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="mt-8 flex justify-center"
        >
          <a
            href="/registro-productor"
            className="inline-flex items-center px-8 py-4 rounded-pill font-syne font-bold text-base transition-all duration-200"
            style={{ border: '1px solid #FF6B35', color: '#FF6B35', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,107,53,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            Quiero un espacio en estas zonas →
          </a>
        </motion.div>
      </div>
    </section>
  )
}

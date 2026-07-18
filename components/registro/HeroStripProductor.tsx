'use client'

import { motion } from 'framer-motion'

const ACCENT = '#FF6B35'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const stats = [
  { number: '$3K', label: 'MXN/mes por slot vs $50K en cadena grande' },
  { number: '4', label: 'marcas por espacio — tu producto no se pierde entre cientos' },
  { number: '48h', label: 'Para responder a tu solicitud' },
  { number: 'Días', label: 'Para activar tu primer slot activo' },
]

export function HeroStripProductor() {
  return (
    <section
      className="py-20 px-6"
      style={{
        background: '#0A0A0F',
        backgroundImage: `radial-gradient(ellipse 55% 60% at 75% 50%, rgba(255,107,53,0.07) 0%, transparent 70%)`,
        borderBottom: '1px solid rgba(240,239,232,0.06)',
      }}
    >
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left column */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col gap-5"
        >
          <motion.span
            variants={fadeUp}
            className="font-dm font-medium"
            style={{ fontSize: '11px', letterSpacing: '0.18em', color: ACCENT }}
          >
            REGISTRO DE MARCAS — CDMX 2026
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="font-syne font-extrabold"
            style={{
              fontSize: 'clamp(34px, 5vw, 56px)',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
              color: '#F0EFE8',
            }}
          >
            Retail físico.{' '}
            <em className="not-italic" style={{ color: ACCENT }}>
              Sin el precio que mata.
            </em>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="font-dm max-w-md"
            style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.65, color: 'rgba(240,239,232,0.7)' }}
          >
            Registra tu marca. Revisamos cada una personalmente — si hay fit,
            activamos tu primer slot en días.
          </motion.p>

          <motion.div variants={fadeUp}>
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-pill font-dm"
              style={{
                background: 'rgba(255,107,53,0.1)',
                border: '1px solid rgba(255,107,53,0.3)',
                color: ACCENT,
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse shrink-0"
                style={{ background: ACCENT }}
              />
              Cupos limitados · máx. 4 marcas por espacio
            </span>
          </motion.div>
        </motion.div>

        {/* Right column: stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-2 gap-3"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="flex flex-col gap-2 p-6 rounded-card"
              style={{
                background: '#13131A',
                border: '1px solid rgba(240,239,232,0.08)',
              }}
            >
              <span
                className="font-syne font-extrabold"
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 42px)',
                  color: ACCENT,
                  lineHeight: 1,
                }}
              >
                {stat.number}
              </span>
              <span
                className="font-dm"
                style={{ fontSize: '13px', lineHeight: 1.45, color: 'rgba(240,239,232,0.5)', fontWeight: 300 }}
              >
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

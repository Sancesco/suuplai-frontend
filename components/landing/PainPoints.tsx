'use client'

import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const pains = [
  {
    icon: '⏳',
    title: '3–6 meses para entrar a una cadena',
    desc: 'Procesos interminables, juntas, aprobaciones. Mientras tanto, tu producto no llega a nadie.',
  },
  {
    icon: '💸',
    title: 'Financias al retailer sin saberlo',
    desc: 'Pones el inventario, esperas 60–90 días para cobrar, y asumes el riesgo de no-rotación. Eso se acaba.',
  },
  {
    icon: '🙈',
    title: 'Estás ciego en punto de venta',
    desc: 'Pagas por estar, pero no sabes si tu producto rota, dónde rota, ni por qué no rota en ciertos puntos.',
  },
  {
    icon: '📦',
    title: 'La logística te rompe el margen',
    desc: 'CEDIS, paletizado, rechazos, penalizaciones. El margen del 55% en Excel se convierte en 38% en la vida real.',
  },
]

export function PainPoints() {
  return (
    <section
      className="py-24 px-6"
      style={{
        background: '#13131A',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
          className="mb-14"
        >
          <motion.span
            variants={fadeUp}
            className="font-dm font-medium block mb-3"
            style={{ color: '#FF6B35', fontSize: '12px', letterSpacing: '2px' }}
          >
            POR QUÉ SUUPLAI
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-syne font-extrabold"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-1.5px', lineHeight: 1.1 }}
          >
            <span className="text-suu-text">El retail grande no es para todos.</span>
            <br />
            <span style={{ color: '#FF6B35' }}>Todavía.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-dm text-suu-muted mt-4 max-w-xl"
            style={{ fontSize: '18px', fontWeight: 300, lineHeight: 1.6 }}
          >
            Los productores pequeños y medianos siguen enfrentando las mismas barreras estructurales. Nosotros las eliminamos.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {pains.map((pain) => (
            <motion.div
              key={pain.title}
              variants={fadeUp}
              className="flex gap-4 p-6 rounded-card"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">{pain.icon}</span>
              <div>
                <h3
                  className="font-syne font-bold text-suu-text mb-2"
                  style={{ fontSize: '16px' }}
                >
                  {pain.title}
                </h3>
                <p
                  className="font-dm text-suu-muted"
                  style={{ fontSize: '14px', lineHeight: 1.7, fontWeight: 300 }}
                >
                  {pain.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

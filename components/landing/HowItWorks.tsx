'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const stepsTienda = [
  {
    num: '01',
    title: 'Registra tu tienda',
    desc: 'Sube fotos de tu espacio, describe el tipo de clientes y el tráfico semanal estimado.',
  },
  {
    num: '02',
    title: 'Publica tu espacio',
    desc: 'Define metros lineales, zona de la tienda y qué categorías te interesan alojar.',
  },
  {
    num: '03',
    title: 'Recibe propuestas',
    desc: 'Los productores te contactan directamente. Aceptas, negocias o rechazas desde la app.',
  },
  {
    num: '04',
    title: 'Cobra automático',
    desc: 'El contrato digital queda en la plataforma. El pago entra a tu cuenta cada mes.',
  },
]

const stepsProductor = [
  {
    num: '01',
    title: 'Crea tu perfil de marca',
    desc: 'Sube tu producto, el margen que manejas, en qué zonas quieres estar y qué tipo de tiendas te interesan.',
  },
  {
    num: '02',
    title: 'Explora el mapa',
    desc: 'Ve tiendas disponibles filtradas por zona, tráfico, tipo de cliente. Fotos y métricas reales.',
  },
  {
    num: '03',
    title: 'Haz tu propuesta',
    desc: 'Ofrece tarifa fija, comisión o prueba sin costo. Negocias directo con el dueño.',
  },
  {
    num: '04',
    title: 'Mide y expande',
    desc: 'Ve en tiempo real qué tiendas rotan mejor. Escala a más puntos con un clic.',
  },
]

export function HowItWorks({ id }: { id?: string }) {
  const [activeTab, setActiveTab] = useState<'tienda' | 'productor'>('tienda')
  const steps = activeTab === 'tienda' ? stepsTienda : stepsProductor
  const accentColor = activeTab === 'tienda' ? '#E8FF47' : '#FF6B35'

  return (
    <section id={id} className="py-24 px-6" style={{ background: '#0A0A0F' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.span
            variants={fadeUp}
            className="font-dm font-medium block mb-3"
            style={{ color: '#7A7A8A', fontSize: '12px', letterSpacing: '2px' }}
          >
            CÓMO FUNCIONA
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-syne font-extrabold text-suu-text mb-8"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-1.5px' }}
          >
            De cero a primer acuerdo en 72 horas.
          </motion.h2>

          {/* Tabs */}
          <motion.div variants={fadeUp} className="flex gap-2">
            <button
              onClick={() => setActiveTab('tienda')}
              className="px-6 py-2.5 rounded-pill font-syne font-bold text-sm transition-all duration-200"
              style={{
                background: activeTab === 'tienda' ? '#E8FF47' : 'rgba(255,255,255,0.05)',
                color: activeTab === 'tienda' ? '#0A0A0F' : '#7A7A8A',
              }}
            >
              Soy tienda
            </button>
            <button
              onClick={() => setActiveTab('productor')}
              className="px-6 py-2.5 rounded-pill font-syne font-bold text-sm transition-all duration-200"
              style={{
                background: activeTab === 'productor' ? '#FF6B35' : 'rgba(255,255,255,0.05)',
                color: activeTab === 'productor' ? '#0A0A0F' : '#7A7A8A',
              }}
            >
              Soy productor
            </button>
          </motion.div>
        </motion.div>

        {/* Steps grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Mobile/tablet: simple stacked grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="flex flex-col gap-4 p-6 rounded-card"
                  style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span
                    className="font-syne font-extrabold"
                    style={{ fontSize: '48px', color: accentColor, opacity: 0.15, lineHeight: 1, fontFamily: 'var(--font-space-mono)' }}
                  >
                    {step.num}
                  </span>
                  <div>
                    <h3 className="font-syne font-bold text-suu-text mb-2" style={{ fontSize: '16px' }}>{step.title}</h3>
                    <p className="font-dm text-suu-muted" style={{ fontSize: '14px', lineHeight: 1.6, fontWeight: 300 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: flex row with dashed connectors between steps */}
            <div className="hidden md:flex items-stretch gap-0">
              {steps.map((step, i) => (
                <div key={step.num} className="flex items-stretch" style={{ flex: 1 }}>
                  {/* Step card */}
                  <div
                    className="flex flex-col gap-4 p-6 rounded-card"
                    style={{
                      background: '#13131A',
                      border: '1px solid rgba(255,255,255,0.07)',
                      flex: 1,
                    }}
                  >
                    <span
                      className="font-syne font-extrabold"
                      style={{ fontSize: '48px', color: accentColor, opacity: 0.15, lineHeight: 1, fontFamily: 'var(--font-space-mono)' }}
                    >
                      {step.num}
                    </span>
                    <div>
                      <h3 className="font-syne font-bold text-suu-text mb-2" style={{ fontSize: '16px' }}>{step.title}</h3>
                      <p className="font-dm text-suu-muted" style={{ fontSize: '14px', lineHeight: 1.6, fontWeight: 300 }}>{step.desc}</p>
                    </div>
                  </div>

                  {/* Connector arrow, between cards, not after last */}
                  {i < steps.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="flex items-center justify-center shrink-0"
                      style={{ width: '28px' }}
                    >
                      <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
                        <line x1="0" y1="6" x2="20" y2="6" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.4" />
                        <path d="M18 2L24 6L18 10" stroke={accentColor} strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

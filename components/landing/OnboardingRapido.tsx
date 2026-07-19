'use client'

import { motion } from 'framer-motion'
import { FileSignature, Sparkles, Truck, PackageCheck } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const milestones = [
  { day: '01', title: 'Firma de acuerdo',         icon: FileSignature },
  { day: '03', title: 'Curaduría y match',        icon: Sparkles      },
  { day: '07', title: 'Logística y entrega',      icon: Truck         },
  { day: '14', title: 'Producto en tienda',       icon: PackageCheck  },
]

const ACCENT = '#E8FF47'

export function OnboardingRapido() {
  return (
    <section className="py-24 px-6" style={{ background: '#0A0A0F' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mb-14 max-w-2xl"
        >
          <motion.span
            variants={fadeUp}
            className="font-dm font-medium block mb-4"
            style={{ color: ACCENT, fontSize: '12px', letterSpacing: '2px' }}
          >
            ONBOARDING RÁPIDO
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-syne font-extrabold text-suu-text mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-1.5px', lineHeight: 1.05 }}
          >
            De contrato a tienda en menos de 14 días.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-dm text-suu-muted"
            style={{ fontSize: '18px', fontWeight: 300, lineHeight: 1.6 }}
          >
            Mientras la distribución tradicional toma 3 a 6 meses, nuestras marcas entran a punto
            de venta en 2 semanas.
          </motion.p>
        </motion.div>

        {/* Timeline */}
        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
          className="relative grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-4"
        >
          {/* Dashed connector, desktop only */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-0 right-0 pointer-events-none"
            style={{
              top: '42px',
              height: '1px',
              background:
                `repeating-linear-gradient(to right, ${ACCENT} 0 8px, transparent 8px 16px)`,
              opacity: 0.4,
              marginLeft: '12.5%',
              marginRight: '12.5%',
            }}
          />

          {milestones.map(({ day, title, icon: Icon }, i) => (
            <motion.li
              key={day}
              variants={fadeUp}
              className="relative rounded-card p-6 flex flex-col gap-4"
              style={{
                background: '#13131A',
                border: `1px solid ${ACCENT}30`,
              }}
            >
              {/* Day marker */}
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center rounded-full"
                  style={{
                    width: '28px',
                    height: '28px',
                    background: ACCENT,
                    color: '#0A0A0F',
                  }}
                >
                  <Icon size={16} strokeWidth={2.4} />
                </span>
                <span
                  className="font-dm"
                  style={{
                    fontSize: '11px',
                    letterSpacing: '2px',
                    color: 'rgba(240,239,232,0.55)',
                  }}
                >
                  HITO {i + 1}
                </span>
              </div>

              {/* Day number */}
              <div className="flex items-baseline gap-2">
                <span
                  style={{
                    fontFamily: 'var(--font-space-mono)',
                    fontSize: 'clamp(40px, 5vw, 56px)',
                    fontWeight: 700,
                    color: ACCENT,
                    lineHeight: 1,
                    letterSpacing: '-2px',
                  }}
                >
                  Día {day}
                </span>
              </div>

              {/* Title */}
              <p
                className="font-syne font-bold text-suu-text"
                style={{ fontSize: '18px', lineHeight: 1.3 }}
              >
                {title}
              </p>
            </motion.li>
          ))}
        </motion.ol>

        {/* Social proof line */}
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUp}
          className="font-syne font-bold text-suu-text mt-14 text-center md:text-left"
          style={{
            fontSize: 'clamp(18px, 2vw, 22px)',
            lineHeight: 1.4,
            letterSpacing: '-0.3px',
          }}
        >
          Primera marca regiomontana ya en piloto en 2 cadenas socias.
        </motion.p>
      </div>
    </section>
  )
}

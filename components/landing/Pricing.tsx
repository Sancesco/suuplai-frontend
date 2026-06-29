'use client'

import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const rows = [
  {
    label: 'Costo de entrada',
    traditional: { value: '$50K–$200K MXN', note: 'Costo de entrada · no reembolsable' },
    suuplai: { value: '$0', note: 'Sin cobro para entrar', good: true },
  },
  {
    label: 'Logística',
    traditional: { value: 'CEDIS obligatorio', note: '8–15% del valor del pedido' },
    suuplai: { value: 'Entrega directa', note: 'Tú llevas · sin intermediario', good: false },
  },
  {
    label: 'Cobro de ventas',
    traditional: { value: '60–90 días', note: 'Factoraje o espera larga' },
    suuplai: { value: 'Mensual', note: 'Fecha acordada · sin factoraje', good: true },
  },
  {
    label: 'Penalizaciones',
    traditional: { value: 'Sí', note: 'Faltante, merma, planograma' },
    suuplai: { value: 'No', note: 'Si no rota, se ajusta sin multa', good: true },
  },
  {
    label: 'Data de rotación',
    traditional: { value: 'No disponible', note: 'Cero visibilidad en tiempo real' },
    suuplai: { value: 'Tiempo real', note: 'Por tienda, zona y perfil de comprador', good: true },
  },
]

export function Pricing() {
  return (
    <section
      className="py-24 px-6"
      style={{ background: '#13131A', borderTop: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.span
            variants={fadeUp}
            className="font-dm font-medium block mb-3"
            style={{ color: '#FF6B35', fontSize: '12px', letterSpacing: '2px' }}
          >
            SIN LETRA CHICA
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-syne font-extrabold text-suu-text"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-1.5px', lineHeight: 1.1 }}
          >
            Lo que te cobran vs
            <br />
            <span style={{ color: '#FF6B35' }}>lo que nosotros cobramos.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-dm text-suu-muted mt-4 max-w-xl"
            style={{ fontSize: '18px', fontWeight: 300, lineHeight: 1.6 }}
          >
            El retail grande tiene costos ocultos que destruyen tu margen antes de que
            vendas el primer producto. Aquí no.
          </motion.p>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
          className="rounded-card overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Table header — desktop only */}
          <div
            className="hidden md:grid grid-cols-3 px-5 py-3 gap-4"
            style={{ background: '#0A0A0F', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span
              className="font-dm font-medium text-suu-muted"
              style={{ fontSize: '11px', letterSpacing: '2px' }}
            >
              ASPECTO
            </span>
            <span
              className="font-dm font-medium"
              style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)' }}
            >
              CADENA GRANDE
            </span>
            <span
              className="font-dm font-medium"
              style={{ fontSize: '11px', letterSpacing: '2px', color: '#FF6B35' }}
            >
              SUUPLAI
            </span>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <motion.div
              key={row.label}
              variants={fadeUp}
              className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-4 md:items-start px-5 py-5"
              style={{
                borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
              }}
            >
              {/* Label */}
              <span
                className="font-dm font-medium text-suu-text"
                style={{ fontSize: '15px', paddingTop: '2px' }}
              >
                {row.label}
              </span>

              {/* Traditional — struck through */}
              <div className="flex flex-col gap-0.5">
                <span
                  className="md:hidden font-dm font-medium"
                  style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}
                >
                  CADENA GRANDE
                </span>
                <span
                  className="font-syne font-bold"
                  style={{
                    fontSize: '15px',
                    color: 'rgba(255,255,255,0.35)',
                    textDecoration: 'line-through',
                    textDecorationColor: 'rgba(255,100,100,0.4)',
                  }}
                >
                  {row.traditional.value}
                </span>
                <span
                  className="font-dm text-suu-muted"
                  style={{ fontSize: '12px', lineHeight: 1.4 }}
                >
                  {row.traditional.note}
                </span>
              </div>

              {/* Suuplai */}
              <div className="flex flex-col gap-0.5">
                <span
                  className="md:hidden font-dm font-medium"
                  style={{ fontSize: '10px', letterSpacing: '2px', color: '#FF6B35', marginBottom: '2px' }}
                >
                  SUUPLAI
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-syne font-bold"
                    style={{ fontSize: '15px', color: '#FF6B35' }}
                  >
                    {row.suuplai.value}
                  </span>
                  {row.suuplai.good && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="7" cy="7" r="6.5" stroke="#4CAF50" strokeWidth="1" />
                      <path
                        d="M4 7L6 9L10 5"
                        stroke="#4CAF50"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className="font-dm text-suu-muted"
                  style={{ fontSize: '12px', lineHeight: 1.4 }}
                >
                  {row.suuplai.note}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="font-dm text-suu-muted mt-6 text-center"
          style={{ fontSize: '13px', lineHeight: 1.6 }}
        >
          Suuplai cobra una comisión de plataforma sobre el valor generado. Sin costos ocultos.
          Los precios de cada espacio se acuerdan directamente entre marca y tienda.
        </motion.p>
      </div>
    </section>
  )
}

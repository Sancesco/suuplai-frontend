'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const EMBER = '#FF6B35'
const LIME = '#E8FF47'
const ASH = '#8A8A94'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

function Check({ color }: { color: string }) {
  return <span style={{ color, fontWeight: 700, flexShrink: 0 }}>✓</span>
}

export function DosServicios() {
  return (
    <section id="servicios" className="py-24 px-6" style={{ background: '#0A0A0F', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center mb-14"
        >
          <span className="font-dm font-medium block mb-3" style={{ color: EMBER, fontSize: '12px', letterSpacing: '2px' }}>
            PARA MARCAS · TRES CAMINOS
          </span>
          <h2 className="font-syne font-extrabold text-suu-text" style={{ fontSize: 'clamp(28px, 3.6vw, 46px)', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            Tres formas de llegar al anaquel.
          </h2>
          <p className="font-dm text-suu-muted max-w-2xl mx-auto mt-4" style={{ fontSize: '18px', fontWeight: 300, lineHeight: 1.6 }}>
            Renta el espacio, deja que toquemos puertas por ti, o hazlo tú con nuestra herramienta.{' '}
            <span style={{ color: '#F0EFE8' }}>Usa una, la otra, o las tres.</span>
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-5 items-stretch"
        >
          {/* Renta de anaquel */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col rounded-card p-8 md:p-9"
            style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="font-dm font-medium" style={{ fontSize: '11px', letterSpacing: '2px', color: ASH }}>
              COMPRAS ESPACIO
            </span>
            <h3 className="font-syne font-extrabold text-suu-text mt-3" style={{ fontSize: '25px', letterSpacing: '-0.5px' }}>
              Renta de anaquel
            </h3>
            <p className="font-dm text-suu-muted mt-3" style={{ fontSize: '14.5px', fontWeight: 300, lineHeight: 1.6 }}>
              Para marcas que ya saben a qué tienda quieren entrar y quieren presencia física rápida.
            </p>

            <div className="mt-5 mb-5">
              <span className="font-syne font-extrabold text-suu-text" style={{ fontSize: '32px', letterSpacing: '-1px' }}>
                $500–900
              </span>
              <span className="font-dm text-suu-muted" style={{ fontSize: '13.5px' }}> MXN / espacio al mes</span>
            </div>

            <ul className="flex flex-col gap-3 mb-7">
              {['Espacio físico en tiendas de la red', 'Renta fija, sin comisión sobre tus ventas', 'Entras a anaquel rápido'].map((t) => (
                <li key={t} className="flex gap-2.5 font-dm" style={{ fontSize: '14px', color: 'rgba(240,239,232,0.7)', lineHeight: 1.5 }}>
                  <Check color={EMBER} />
                  {t}
                </li>
              ))}
            </ul>

            <Link
              href="/registro-productor"
              className="mt-auto inline-flex items-center justify-center py-3.5 rounded-pill font-syne font-bold text-sm transition-all duration-200"
              style={{ border: `1.5px solid ${EMBER}`, color: EMBER, background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = EMBER; e.currentTarget.style.color = '#0A0A0F' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = EMBER }}
            >
              Rentar anaquel →
            </Link>
          </motion.div>

          {/* Agente comercial, destacado */}
          <motion.div
            variants={fadeUp}
            className="relative flex flex-col rounded-card p-8 md:p-9"
            style={{
              background: 'linear-gradient(160deg, rgba(255,107,53,0.10), rgba(19,19,26,0.4))',
              border: `1px solid rgba(255,107,53,0.4)`,
            }}
          >
            <span
              className="absolute font-dm font-bold"
              style={{
                top: '18px', right: '18px', fontSize: '10px', letterSpacing: '1.5px',
                color: '#0A0A0F', background: EMBER, padding: '5px 10px', borderRadius: '999px',
              }}
            >
              LO QUE MÁS CRECE
            </span>

            <span className="font-dm font-medium" style={{ fontSize: '11px', letterSpacing: '2px', color: EMBER }}>
              CONTRATAS VENTAS
            </span>
            <h3 className="font-syne font-extrabold text-suu-text mt-3" style={{ fontSize: '25px', letterSpacing: '-0.5px' }}>
              Agente comercial
            </h3>
            <p className="font-dm text-suu-muted mt-3" style={{ fontSize: '14.5px', fontWeight: 300, lineHeight: 1.6 }}>
              Para marcas que no tienen quién toque puertas. Prospectamos, muestreamos y abrimos cuentas nuevas cada mes.
            </p>

            <div className="mt-5 mb-4">
              <span className="font-dm text-suu-muted" style={{ fontSize: '13.5px' }}>desde </span>
              <span className="font-syne font-extrabold text-suu-text" style={{ fontSize: '32px', letterSpacing: '-1px' }}>
                $4,000
              </span>
              <span className="font-dm text-suu-muted" style={{ fontSize: '13.5px' }}> + IVA / al mes</span>
            </div>

            <div
              className="mb-5 px-4 py-3 rounded-card font-dm"
              style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', fontSize: '13px', color: '#F0EFE8', lineHeight: 1.5 }}
            >
              Con que <strong style={{ color: EMBER }}>una tienda</strong> te recompre cada mes, el servicio se paga solo.
            </div>

            <ul className="flex flex-col gap-3 mb-7">
              {['Prospección y muestreo por zona', 'Seguimiento hasta cerrar el pedido', 'Reporte real de avance por punto'].map((t) => (
                <li key={t} className="flex gap-2.5 font-dm" style={{ fontSize: '14px', color: 'rgba(240,239,232,0.75)', lineHeight: 1.5 }}>
                  <Check color={EMBER} />
                  {t}
                </li>
              ))}
            </ul>

            <Link
              href="/agente-comercial"
              className="mt-auto inline-flex items-center justify-center py-3.5 rounded-pill font-syne font-bold text-sm transition-all duration-200"
              style={{ background: EMBER, color: '#0A0A0F' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              Ver agente comercial →
            </Link>
          </motion.div>

          {/* CRM, nuevo */}
          <motion.div
            variants={fadeUp}
            className="relative flex flex-col rounded-card p-8 md:p-9"
            style={{
              background: 'linear-gradient(160deg, rgba(232,255,71,0.07), rgba(19,19,26,0.4))',
              border: `1px solid rgba(232,255,71,0.32)`,
            }}
          >
            <span
              className="absolute font-dm font-bold"
              style={{
                top: '18px', right: '18px', fontSize: '10px', letterSpacing: '1.5px',
                color: '#0A0A0F', background: LIME, padding: '5px 10px', borderRadius: '999px',
              }}
            >
              NUEVO
            </span>

            <span className="font-dm font-medium" style={{ fontSize: '11px', letterSpacing: '2px', color: LIME }}>
              LO HACES TÚ
            </span>
            <h3 className="font-syne font-extrabold text-suu-text mt-3" style={{ fontSize: '25px', letterSpacing: '-0.5px' }}>
              CRM de Suuplai
            </h3>
            <p className="font-dm text-suu-muted mt-3" style={{ fontSize: '14.5px', fontWeight: 300, lineHeight: 1.6 }}>
              La misma herramienta con la que operamos, en tus manos. Con una base de miles de puntos de venta para prospectar.
            </p>

            <div className="mt-5 mb-4">
              <span className="font-syne font-extrabold text-suu-text" style={{ fontSize: '32px', letterSpacing: '-1px' }}>
                $1,000
              </span>
              <span className="font-dm text-suu-muted" style={{ fontSize: '13.5px' }}> / mes · o $6,000 al año</span>
            </div>

            <div
              className="mb-5 px-4 py-3 rounded-card font-dm"
              style={{ background: 'rgba(232,255,71,0.07)', border: '1px solid rgba(232,255,71,0.22)', fontSize: '13px', color: '#F0EFE8', lineHeight: 1.5 }}
            >
              Arrancas con <strong style={{ color: LIME }}>12,600+ contactos</strong> filtrables. No prospectas a ciegas.
            </div>

            <ul className="flex flex-col gap-3 mb-7">
              {['Base de contactos por zona y categoría', 'Pipeline, rutas y entregas firmadas', 'Inventario y catálogos con precios'].map((t) => (
                <li key={t} className="flex gap-2.5 font-dm" style={{ fontSize: '14px', color: 'rgba(240,239,232,0.75)', lineHeight: 1.5 }}>
                  <Check color={LIME} />
                  {t}
                </li>
              ))}
            </ul>

            <Link
              href="/crm"
              className="mt-auto inline-flex items-center justify-center py-3.5 rounded-pill font-syne font-bold text-sm transition-all duration-200"
              style={{ border: `1.5px solid ${LIME}`, color: LIME, background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = LIME; e.currentTarget.style.color = '#0A0A0F' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = LIME }}
            >
              Conocer el CRM →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

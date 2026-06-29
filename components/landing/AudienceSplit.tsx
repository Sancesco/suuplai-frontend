'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const beforeAfterTienda = [
  { before: 'metros vacíos', after: 'espacios disponibles que marcas pagan por ocupar' },
  { before: 'ingresos solo por ventas', after: 'ingreso fijo mensual por espacio' },
  { before: 'productos genéricos', after: 'marcas exclusivas que hacen tu tienda un destino' },
  { before: 'sin datos', after: 'dashboard de métricas por producto y zona' },
]

const beforeAfterProductor = [
  { before: '6 meses + costo de entrada alto + factoraje', after: 'en días, sin inventario masivo' },
  { before: 'lanzar SKU = apostar ciego', after: 'prueba en 3 fines de semana' },
  { before: 'cero datos de rotación', after: 'reportes por zona y perfil de comprador' },
  { before: 'uno más entre cientos de productos', after: 'curaduría de pocas marcas — protagonismo real' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

function BeforeAfterList({
  items,
  arrowColor,
}: {
  items: typeof beforeAfterTienda
  arrowColor: string
}) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="flex flex-col gap-4"
    >
      {items.map((item, i) => (
        <motion.li key={i} variants={fadeUp} className="flex items-start gap-3">
          <span
            className="font-dm text-sm mt-0.5"
            style={{ color: '#F0EFE8', opacity: 0.4, textDecoration: 'line-through', minWidth: '30%' }}
          >
            {item.before}
          </span>
          <span className="font-dm font-medium text-sm" style={{ color: arrowColor }}>
            →
          </span>
          <span className="font-dm font-medium text-sm text-suu-text">
            {item.after}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  )
}

export function AudienceSplit() {
  const [activeTab, setActiveTab] = useState<'tiendas' | 'productores'>('tiendas')

  return (
    <section id="tiendas" className="relative">
      {/* Mobile tabs */}
      <div className="md:hidden flex" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'tiendas'}
          onClick={() => setActiveTab('tiendas')}
          className="flex-1 py-3 font-syne font-bold text-sm transition-all duration-200"
          style={{
            background: activeTab === 'tiendas' ? '#E8FF47' : '#13131A',
            color: activeTab === 'tiendas' ? '#0A0A0F' : '#7A7A8A',
          }}
        >
          Tiendas
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'productores'}
          onClick={() => setActiveTab('productores')}
          className="flex-1 py-3 font-syne font-bold text-sm transition-all duration-200"
          style={{
            background: activeTab === 'productores' ? '#FF6B35' : '#13131A',
            color: activeTab === 'productores' ? '#0A0A0F' : '#7A7A8A',
          }}
        >
          Productores
        </button>
      </div>

      {/* Desktop: two side-by-side panels */}
      <div className="hidden md:grid grid-cols-2 min-h-screen">
        <TiendasPanel />
        <ProductoresPanel />
      </div>

      {/* Mobile: animated single panel */}
      <AnimatePresence mode="wait">
        {activeTab === 'tiendas' ? (
          <motion.div
            key="tiendas"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="md:hidden"
          >
            <TiendasPanel />
          </motion.div>
        ) : (
          <motion.div
            key="productores"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="md:hidden"
          >
            <ProductoresPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function TiendasPanel() {
  return (
    <div
      className="flex flex-col justify-center px-8 md:px-16 py-20"
      style={{ background: '#0A0A0F', borderRight: '1px solid rgba(255,255,255,0.07)' }}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="max-w-md"
      >
        <motion.span
          variants={fadeUp}
          className="font-dm font-medium mb-4 block"
          style={{ color: '#E8FF47', fontSize: '12px', letterSpacing: '2px' }}
        >
          PARA TIENDAS
        </motion.span>
        <motion.h2
          variants={fadeUp}
          className="font-syne font-extrabold text-suu-text mb-4"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-1.5px' }}
        >
          Tu espacio genera dinero.
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="font-dm text-suu-muted mb-10"
          style={{ fontSize: '18px', fontWeight: 300, lineHeight: 1.6 }}
        >
          Metros de espacio en tienda que hoy no generan nada. Con Suuplai, esos mismos metros se convierten en ingreso fijo cada mes.
        </motion.p>

        <BeforeAfterList items={beforeAfterTienda} arrowColor="#E8FF47" />

        <motion.div variants={fadeUp} className="mt-10">
          <a
            href="#calculadora"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-pill font-syne font-bold text-sm transition-all duration-200"
            style={{
              border: '1px solid #E8FF47',
              color: '#E8FF47',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(232,255,71,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Calcular mi ingreso →
          </a>
        </motion.div>
      </motion.div>
    </div>
  )
}

function ProductoresPanel() {
  return (
    <div
      id="productores"
      className="flex flex-col justify-center px-8 md:px-16 py-20"
      style={{ background: '#13131A' }}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="max-w-md"
      >
        <motion.span
          variants={fadeUp}
          className="font-dm font-medium mb-4 block"
          style={{ color: '#FF6B35', fontSize: '12px', letterSpacing: '2px' }}
        >
          PARA PRODUCTORES
        </motion.span>
        <motion.h2
          variants={fadeUp}
          className="font-syne font-extrabold text-suu-text mb-4"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-1.5px' }}
        >
          Retail físico sin sacrificar margen.
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="font-dm text-suu-muted mb-10"
          style={{ fontSize: '18px', fontWeight: 300, lineHeight: 1.6 }}
        >
          Entra a tiendas físicas en días. Sin costo de entrada alto, sin factoraje, sin apostar ciego.
        </motion.p>

        <BeforeAfterList items={beforeAfterProductor} arrowColor="#FF6B35" />

        <motion.div variants={fadeUp} className="mt-10">
          <Link
            href="/registro-productor"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-pill font-syne font-bold text-sm transition-all duration-200"
            style={{
              border: '1px solid #FF6B35',
              color: '#FF6B35',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,107,53,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Aplicar como productor →
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

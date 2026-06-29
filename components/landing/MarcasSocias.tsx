'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MARCAS, type Marca } from '@/lib/marcas'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

function MarcaCard({ marca }: { marca: Marca }) {
  // Si la imagen falla (o no hay logo), el nombre que va siempre debajo cubre el espacio.
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = marca.logo && !imgFailed

  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col items-center justify-center gap-4 rounded-card px-6 py-8"
      style={{ background: '#FBFAF6', border: '1px solid rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center justify-center" style={{ height: '72px' }}>
        {showImage && (
          <Image
            src={marca.logo as string}
            alt={marca.nombre}
            width={220}
            height={72}
            unoptimized
            onError={() => setImgFailed(true)}
            style={{ width: 'auto', maxWidth: '170px', height: '100%', objectFit: 'contain' }}
          />
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        <span
          className="font-syne font-bold text-center"
          style={{ fontSize: '17px', color: '#111111', letterSpacing: '-0.3px', lineHeight: 1.1 }}
        >
          {marca.nombre}
        </span>
        <span
          className="font-dm text-center"
          style={{ fontSize: '12px', color: '#7A7A8A', fontWeight: 500 }}
        >
          {marca.categoria}
        </span>
      </div>
    </motion.div>
  )
}

function MasMarcasCard() {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col items-center justify-center gap-4 rounded-card px-6 py-8"
      style={{ background: '#FBFAF6', border: '1.5px dashed rgba(255,107,53,0.5)' }}
    >
      <div className="flex items-center justify-center" style={{ height: '72px' }}>
        <span
          className="font-syne font-extrabold text-center"
          style={{ fontSize: '38px', color: '#FF6B35', letterSpacing: '-1px' }}
        >
          y +más
        </span>
      </div>
      <span
        className="font-dm text-center"
        style={{ fontSize: '12px', color: '#7A7A8A', fontWeight: 500 }}
      >
        marcas sumándose cada semana
      </span>
    </motion.div>
  )
}

export function MarcasSocias() {
  return (
    <section className="py-20 px-6" style={{ background: '#0A0A0F' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="mb-12 text-center"
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

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        >
          {MARCAS.map((marca) => (
            <MarcaCard key={marca.slug} marca={marca} />
          ))}
          <MasMarcasCard />
        </motion.div>
      </div>
    </section>
  )
}

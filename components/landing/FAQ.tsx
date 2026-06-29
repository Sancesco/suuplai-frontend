'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const faqs = [
  {
    q: '¿Qué pasa si el producto no rota?',
    a: 'La tienda puede reportar baja rotación después del primer mes de prueba y renegociar condiciones o dar de baja al producto. No hay contratos que obliguen a mantener SKUs que no funcionen. Es parte del modelo: probamos rápido, ajustamos rápido.',
  },
  {
    q: '¿Quién responde si algo se daña?',
    a: 'El productor es responsable del producto hasta que está en la tienda. La tienda es responsable de la conservación mientras está en exhibición. Los términos exactos quedan en el contrato digital que ambas partes firman en la plataforma.',
  },
  {
    q: '¿Cómo se cobran las comisiones?',
    a: 'Suuplai cobra una comisión sobre el ingreso generado por cada espacio activo. Para tiendas, la plataforma procesa el pago del productor y lo deposita mensualmente. Para productores, el costo del espacio se cobra al inicio de cada período activo.',
  },
  {
    q: '¿Puedo sacar una marca si no funciona?',
    a: 'Sí. El contrato digital incluye cláusulas de salida con aviso previo de 15 días. No hay penalizaciones por baja rotación. El objetivo es que ambas partes estén satisfechas — si no hay fit, es mejor cambiarlo.',
  },
  {
    q: '¿Necesito factura para registrarme?',
    a: 'No para el registro inicial. Puedes explorar la plataforma y recibir tu primer match sin tener que facturar nada. Para activar pagos formales sí necesitarás datos fiscales, pero eso viene después de tu primer acuerdo.',
  },
  {
    q: '¿Cuánto tarda en activarse mi primer espacio?',
    a: 'Una vez que tienes un acuerdo con una tienda, el espacio se activa en 48–72 horas. El proceso incluye: confirmar términos en la plataforma, coordinar entrega del producto a la tienda y encender el tracking de ventas.',
  },
  {
    q: '¿Hay contrato mínimo?',
    a: 'No. Los acuerdos pueden ser mes a mes o con períodos acordados entre la tienda y el productor. Suuplai no impone plazos mínimos. Si quieres probar con un mes, perfecto. Si prefieres comprometerte a 3 meses con precio negociado, también.',
  },
]

interface FAQItemProps {
  q: string
  a: string
  isOpen: boolean
  onToggle: () => void
}

function FAQItem({ q, a, isOpen, onToggle }: FAQItemProps) {
  return (
    <div
      className="rounded-card overflow-hidden"
      style={{
        background: '#13131A',
        border: `1px solid ${isOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <span className="font-syne font-bold text-suu-text pr-4" style={{ fontSize: '16px' }}>
          {q}
        </span>
        <span
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
          style={{
            background: isOpen ? 'rgba(232,255,71,0.1)' : 'rgba(255,255,255,0.05)',
            color: isOpen ? '#E8FF47' : '#7A7A8A',
          }}
        >
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-6 pb-6 font-dm text-suu-muted"
              style={{ fontSize: '15px', lineHeight: 1.7, fontWeight: 300 }}
            >
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-24 px-6" style={{ background: '#0A0A0F' }}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={fadeUp}
          className="mb-12"
        >
          <span
            className="font-dm font-medium block mb-3"
            style={{ color: '#7A7A8A', fontSize: '12px', letterSpacing: '2px' }}
          >
            PREGUNTAS FRECUENTES
          </span>
          <h2
            className="font-syne font-extrabold text-suu-text"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-1.5px' }}
          >
            Lo que más nos preguntan
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={fadeUp}
          className="flex flex-col gap-3"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

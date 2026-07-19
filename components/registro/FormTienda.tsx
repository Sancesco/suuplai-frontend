'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { saveRegistro } from '@/lib/saveRegistro'

const ACCENT = '#E8FF47'
const ACCENT_TEXT = '#0A0A0F'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FormData {
  nombre: string
  apellido: string
  email: string
  whatsapp: string
  nombreTienda: string
  tipoTienda: string
  colonia: string
  alcaldia: string
  metrosLineales: string
  trafico: string
  tipoEspacio: string
  categorias: string
  notas: string
  aceptaTerminos: boolean
}

const INITIAL: FormData = {
  nombre: '', apellido: '', email: '', whatsapp: '',
  nombreTienda: '', tipoTienda: '', colonia: '', alcaldia: '',
  metrosLineales: '', trafico: '', tipoEspacio: '', categorias: '', notas: '',
  aceptaTerminos: false,
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-dm font-medium" style={{ fontSize: '13px', color: '#F0EFE8' }}>
        {label}{required && <span style={{ color: ACCENT }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <span
        className="font-dm font-medium shrink-0"
        style={{ fontSize: '10px', letterSpacing: '0.2em', color: ACCENT }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(232,255,71,0.2)' }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared input styles, campos claros (fondo blanco), invitan a llenarse.
// ─────────────────────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: '8px',
  padding: '12px 16px',
  fontFamily: 'var(--font-dm-sans)',
  fontWeight: 400,
  fontSize: '14px',
  color: '#1a1a1a',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
}

function onFocusYellow(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = ACCENT
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,255,71,0.30)'
}
function onBlurReset(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
  e.currentTarget.style.boxShadow = 'none'
}

// Selector de botones (chips), más rápido y visual que un menú desplegable.
function ChoiceGroup({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="font-dm transition-all duration-150"
            style={{
              fontSize: '13px',
              fontWeight: selected ? 600 : 400,
              padding: '9px 15px',
              borderRadius: '999px',
              cursor: 'pointer',
              background: selected ? ACCENT : '#FFFFFF',
              color: selected ? ACCENT_TEXT : '#3a3a3a',
              border: selected ? `1.5px solid ${ACCENT}` : '1.5px solid rgba(0,0,0,0.14)',
            }}
            onMouseEnter={(e) => {
              if (!selected) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)'
            }}
            onMouseLeave={(e) => {
              if (!selected) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)'
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component, registro de UN solo paso, sin OTP ni precontrato.
// ─────────────────────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

export function FormTienda({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const loading = submitState === 'loading'

  const update =
    (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const setField =
    (key: keyof FormData) =>
    (value: string) =>
      setForm((f) => ({ ...f, [key]: value }))

  const formValid =
    form.nombre && form.apellido && form.email && form.whatsapp &&
    form.nombreTienda && form.tipoTienda && form.colonia && form.alcaldia &&
    form.aceptaTerminos

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitState('loading')
    setErrorMsg(null)
    void (async () => {
      const minLoadingDelay = new Promise<void>((r) => setTimeout(r, 800))
      try {
        const existing = JSON.parse(localStorage.getItem('suuplai_registros') || '[]') as unknown[]
        localStorage.setItem(
          'suuplai_registros',
          JSON.stringify([...existing, { tipo: 'tienda', timestamp: Date.now(), ...form }])
        )
        await Promise.all([saveRegistro({ tipo: 'tienda', ...form }), minLoadingDelay])
        setSubmitState('success')
        setSubmitted(true)
        onSuccess()
      } catch (err) {
        await minLoadingDelay
        setSubmitState('error')
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'No pudimos enviar tu registro. Intenta de nuevo en unos segundos.'
        )
      }
    })()
  }

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-6 py-20 text-center px-8 rounded-card"
          style={{ background: '#13131A', border: '1px solid rgba(240,239,232,0.08)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(232,255,71,0.12)', border: `1px solid rgba(232,255,71,0.3)` }}
          >
            <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
              <path d="M2 11L10 19L26 3" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2
            className="font-syne font-extrabold"
            style={{ fontSize: '28px', color: ACCENT, letterSpacing: '-0.5px' }}
          >
            ¡Listo, te registramos!
          </h2>
          <p
            className="font-dm max-w-sm"
            style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.6, color: 'rgba(240,239,232,0.7)' }}
          >
            Recibimos los datos de tu tienda. Ahora agenda tu llamada de 20 minutos aquí abajo y
            activamos tu espacio.
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-8 md:p-12 rounded-card"
          style={{ background: '#13131A', border: '1px solid rgba(240,239,232,0.08)' }}
        >
          <h2
            className="font-syne font-extrabold mb-2"
            style={{ fontSize: '26px', letterSpacing: '-0.5px', color: '#F0EFE8' }}
          >
            Registra tu tienda
          </h2>
          <p
            className="font-dm mb-8"
            style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(240,239,232,0.5)' }}
          >
            Cuéntanos sobre tu espacio. Toma menos de 2 minutos, sin contratos ni complicaciones.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Divider label="DATOS DE CONTACTO" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre" required>
                <input type="text" value={form.nombre} onChange={update('nombre')} required
                  placeholder="Tu nombre" style={inputBase}
                  onFocus={onFocusYellow} onBlur={onBlurReset} />
              </Field>
              <Field label="Apellido" required>
                <input type="text" value={form.apellido} onChange={update('apellido')} required
                  placeholder="Tu apellido" style={inputBase}
                  onFocus={onFocusYellow} onBlur={onBlurReset} />
              </Field>
            </div>

            <Field label="Email" required>
              <input type="email" value={form.email} onChange={update('email')} required
                placeholder="tu@email.com" style={inputBase}
                onFocus={onFocusYellow} onBlur={onBlurReset} />
            </Field>

            <Field label="WhatsApp" required>
              <input type="tel" value={form.whatsapp} onChange={update('whatsapp')} required
                placeholder="+52 55 1234 5678" style={inputBase}
                onFocus={onFocusYellow} onBlur={onBlurReset} />
            </Field>

            <Divider label="TU TIENDA" />

            <Field label="Nombre de tu tienda" required>
              <input type="text" value={form.nombreTienda} onChange={update('nombreTienda')} required
                placeholder="El nombre que ven tus clientes" style={inputBase}
                onFocus={onFocusYellow} onBlur={onBlurReset} />
            </Field>

            <Field label="Tipo de tienda" required>
              <ChoiceGroup
                value={form.tipoTienda}
                onChange={setField('tipoTienda')}
                options={[
                  'Gimnasio/estudio fitness',
                  'Café/cafetería',
                  'Tienda naturista/orgánica',
                  'Boutique de ropa',
                  'Librería/papelería',
                  'Farmacia independiente',
                  'Minisuper/abarrotes',
                  'Salón de belleza/spa',
                  'Coworking/oficina',
                  'Otro',
                ]}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Colonia" required>
                <input type="text" value={form.colonia} onChange={update('colonia')} required
                  placeholder="p. ej. Condesa" style={inputBase}
                  onFocus={onFocusYellow} onBlur={onBlurReset} />
              </Field>
              <Field label="Alcaldía / Ciudad" required>
                <input type="text" value={form.alcaldia} onChange={update('alcaldia')} required
                  placeholder="p. ej. Cuauhtémoc" style={inputBase}
                  onFocus={onFocusYellow} onBlur={onBlurReset} />
              </Field>
            </div>

            <Divider label="TU ESPACIO" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Metros lineales aprox.">
                <ChoiceGroup
                  value={form.metrosLineales}
                  onChange={setField('metrosLineales')}
                  options={['Menos de 1m', '1–2m', '2–5m', '5–10m', 'Más de 10m']}
                />
              </Field>
              <Field label="Tráfico diario aprox.">
                <ChoiceGroup
                  value={form.trafico}
                  onChange={setField('trafico')}
                  options={['Menos de 50', '50–150', '150–500', 'Más de 500']}
                />
              </Field>
            </div>

            <Field label="Tipo de espacio">
              <ChoiceGroup
                value={form.tipoEspacio}
                onChange={setField('tipoEspacio')}
                options={[
                  'Anaquel/estante',
                  'Refrigerador/refri',
                  'Mesa de exhibición',
                  'Espacio en mostrador',
                  'Varios tipos',
                ]}
              />
            </Field>

            <Field label="Categorías de interés">
              <ChoiceGroup
                value={form.categorias}
                onChange={setField('categorias')}
                options={[
                  'Alimentos y bebidas',
                  'Cosméticos y skincare',
                  'Wellness y suplementos',
                  'Moda y accesorios',
                  'Cualquier categoría',
                ]}
              />
            </Field>

            <Field label="¿Algo que quieras contarnos?">
              <textarea value={form.notas} onChange={update('notas')} rows={3}
                placeholder="Tu cliente típico, qué esperas de Suuplai..."
                style={{ ...inputBase, resize: 'vertical' }}
                onFocus={onFocusYellow} onBlur={onBlurReset} />
            </Field>

            <label className="flex items-start gap-3 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={form.aceptaTerminos}
                onChange={(e) => setForm((f) => ({ ...f, aceptaTerminos: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded shrink-0 cursor-pointer"
                style={{ accentColor: ACCENT }}
              />
              <span className="font-dm" style={{ fontSize: '13px', lineHeight: 1.5, color: 'rgba(240,239,232,0.65)', fontWeight: 300 }}>
                Acepto los{' '}
                <a href="/terminos" target="_blank" style={{ color: ACCENT, textDecoration: 'underline' }}>términos de uso</a>{' '}
                y el{' '}
                <a href="/privacidad" target="_blank" style={{ color: ACCENT, textDecoration: 'underline' }}>aviso de privacidad</a>.
              </span>
            </label>

            {/* Error banner */}
            {submitState === 'error' && errorMsg && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-3 px-4 py-3 rounded-card"
                style={{ background: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.4)', color: '#F0EFE8' }}
              >
                <AlertCircle size={18} style={{ color: '#FF6B35', flexShrink: 0, marginTop: '2px' }} />
                <div className="flex-1">
                  <p className="font-dm font-medium" style={{ fontSize: '13px' }}>{errorMsg}</p>
                  <button
                    type="button"
                    onClick={() => { setSubmitState('idle'); setErrorMsg(null) }}
                    className="font-dm underline cursor-pointer mt-1"
                    style={{ fontSize: '12px', color: ACCENT, background: 'none', border: 'none', padding: 0 }}
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formValid}
              aria-busy={loading}
              className="w-full py-4 rounded-pill font-syne font-bold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 mt-2"
              style={{ background: submitState === 'success' ? '#4CAF50' : ACCENT, color: submitState === 'success' ? '#fff' : ACCENT_TEXT, border: 'none' }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled && submitState === 'idle') e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              {submitState === 'loading' && (<><Loader2 size={18} className="animate-spin" />Enviando...</>)}
              {submitState === 'success' && (<><Check size={18} strokeWidth={3} />¡Listo!</>)}
              {(submitState === 'idle' || submitState === 'error') && (<>Registrar mi tienda →</>)}
            </button>
            <p className="font-dm text-center" style={{ fontSize: '11px', color: 'rgba(240,239,232,0.35)' }}>
              Sin costo. Te contactamos por WhatsApp para activar tu espacio.
            </p>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

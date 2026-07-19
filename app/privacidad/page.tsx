import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

export const metadata = {
  title: 'Aviso de Privacidad, Suuplai',
  description: 'Aviso de privacidad de AL GRANO DELI, S.A. DE C.V. (Suuplai)',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2
        className="font-syne font-bold text-gray-900"
        style={{ fontSize: '20px', letterSpacing: '-0.3px' }}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-3 font-dm text-gray-600" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  )
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F7F5F0' }}>
      {/* Nav */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: '#0A0A0F', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Logo variant="dark" className="h-7" />
        <Link
          href="/"
          className="font-dm text-suu-muted hover:text-suu-text transition-colors duration-200"
          style={{ fontSize: '14px' }}
        >
          ← Volver al inicio
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <span
            className="font-dm font-medium block mb-3"
            style={{ fontSize: '12px', letterSpacing: '2px', color: '#7A7A8A' }}
          >
            LEGAL
          </span>
          <h1
            className="font-syne font-extrabold text-gray-900 mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-1px' }}
          >
            Aviso de Privacidad
          </h1>
          <p className="font-dm text-gray-500" style={{ fontSize: '14px', fontWeight: 300 }}>
            Última actualización: febrero de 2026 · AL GRANO DELI, S.A. DE C.V.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px mb-12" style={{ background: '#e8e4dc' }} />

        <div className="flex flex-col gap-10">
          <Section title="I. Responsable del tratamiento de datos">
            <p>
              <strong>AL GRANO DELI, S.A. DE C.V.</strong> (en adelante, "Suuplai") es responsable del uso
              y protección de sus datos personales. Nuestro domicilio fiscal se encuentra en Ciudad de
              México, México.
            </p>
            <p>
              Para cualquier asunto relacionado con este aviso, puede contactarnos en:{' '}
              <a href="mailto:hola@suuplai.com" className="underline text-gray-900">hola@suuplai.com</a>
            </p>
          </Section>

          <Section title="II. Datos personales que recabamos">
            <p>Suuplai recaba los siguientes datos personales a través de nuestros formularios de registro:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 ml-2">
              <li>Nombre completo y apellidos</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono / WhatsApp</li>
              <li>Nombre y tipo de establecimiento o marca</li>
              <li>Datos de ubicación (colonia, alcaldía o ciudad)</li>
              <li>Datos fiscales (RFC, razón social, tipo de persona), únicamente cuando se solicita carta de intención</li>
            </ul>
            <p>
              No recabamos datos sensibles en el sentido del artículo 3, fracción VI de la Ley Federal
              de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
            </p>
          </Section>

          <Section title="III. Finalidades del tratamiento">
            <p>Sus datos personales son utilizados para las siguientes finalidades primarias:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 ml-2">
              <li>Gestionar su registro en la plataforma Suuplai (registro de tiendas o marcas)</li>
              <li>Contactarle para confirmar su lugar y agendar llamada de activación</li>
              <li>Generar documentos de intención (PDF) cuando corresponda</li>
              <li>Brindar soporte y seguimiento a su proceso de incorporación</li>
            </ul>
            <p>Finalidades secundarias (puede oponerse en cualquier momento):</p>
            <ul className="list-disc list-inside flex flex-col gap-1 ml-2">
              <li>Envío de comunicaciones sobre nuevas tiendas, marcas y funciones de la plataforma</li>
              <li>Análisis estadísticos internos sobre el mercado de retail independiente</li>
            </ul>
          </Section>

          <Section title="IV. Transferencia de datos">
            <p>
              Suuplai no vende, alquila ni cede sus datos personales a terceros con fines comerciales.
              Sus datos pueden ser compartidos únicamente en los siguientes supuestos:
            </p>
            <ul className="list-disc list-inside flex flex-col gap-1 ml-2">
              <li>Con tiendas o marcas que sean contraparte en un acuerdo en el que usted participe, solo los datos estrictamente necesarios para operar el slot</li>
              <li>Con proveedores de servicios técnicos bajo acuerdo de confidencialidad (almacenamiento, envío de correo)</li>
              <li>Cuando sea requerido por autoridad competente conforme a la ley aplicable</li>
            </ul>
          </Section>

          <Section title="V. Derechos ARCO">
            <p>
              Usted tiene derecho a <strong>Acceder, Rectificar, Cancelar u Oponerse</strong> (derechos ARCO)
              al tratamiento de sus datos personales. Para ejercer estos derechos, envíe una solicitud a{' '}
              <a href="mailto:hola@suuplai.com" className="underline text-gray-900">hola@suuplai.com</a>{' '}
              indicando su nombre completo, los datos que desea ejercer y, en su caso, documentación que
              acredite su identidad. Responderemos en un plazo máximo de 20 días hábiles.
            </p>
          </Section>

          <Section title="VI. Cookies y tecnologías de rastreo">
            <p>
              Nuestro sitio web puede utilizar cookies técnicas estrictamente necesarias para su
              funcionamiento (por ejemplo, para recordar preferencias de sesión). No utilizamos cookies
              publicitarias ni de rastreo de terceros sin su consentimiento expreso.
            </p>
          </Section>

          <Section title="VII. Modificaciones a este aviso">
            <p>
              Suuplai se reserva el derecho de modificar este aviso de privacidad en cualquier momento.
              Cualquier cambio será notificado a través de nuestro sitio web o por correo electrónico
              con al menos 10 días de anticipación.
            </p>
          </Section>

          <Section title="VIII. Ley aplicable">
            <p>
              El presente aviso se rige por la{' '}
              <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</em>{' '}
              y su Reglamento, así como por los lineamientos del INAI (Instituto Nacional de Transparencia,
              Acceso a la Información y Protección de Datos Personales).
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div
          className="mt-16 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderTop: '1px solid #e8e4dc' }}
        >
          <p className="font-dm text-gray-400" style={{ fontSize: '13px' }}>
            © 2026 AL GRANO DELI, S.A. DE C.V.
          </p>
          <Link
            href="/terminos"
            className="font-dm text-gray-500 hover:text-gray-800 transition-colors duration-200 underline"
            style={{ fontSize: '13px' }}
          >
            Términos de uso →
          </Link>
        </div>
      </main>
    </div>
  )
}

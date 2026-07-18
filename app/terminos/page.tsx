import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

export const metadata = {
  title: 'Términos de Uso — Suuplai',
  description: 'Términos y condiciones de uso de la plataforma Suuplai — AL GRANO DELI, S.A. DE C.V.',
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

export default function TerminosPage() {
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
            Términos de Uso
          </h1>
          <p className="font-dm text-gray-500" style={{ fontSize: '14px', fontWeight: 300 }}>
            Última actualización: febrero de 2026 · AL GRANO DELI, S.A. DE C.V.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px mb-12" style={{ background: '#e8e4dc' }} />

        <div className="flex flex-col gap-10">
          <Section title="I. Aceptación de los términos">
            <p>
              Al acceder o utilizar el sitio web y la plataforma Suuplai (operada por{' '}
              <strong>AL GRANO DELI, S.A. DE C.V.</strong>), usted acepta quedar obligado por los
              presentes términos de uso. Si no está de acuerdo con alguno de ellos, le pedimos no
              utilizar la plataforma.
            </p>
            <p>
              Suuplai es una plataforma que conecta tiendas independientes con marcas/productores
              independientes para la comercialización de espacios en anaquel. No somos franquicia,
              cadena de distribución ni empleadores de ninguna de las partes.
            </p>
          </Section>

          <Section title="II. Uso de la plataforma">
            <p>Al registrarse en Suuplai, usted declara que:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 ml-2">
              <li>Tiene mayoría de edad (18 años o más) y capacidad legal para contratar</li>
              <li>La información proporcionada es verdadera, completa y actualizada</li>
              <li>No utilizará la plataforma para actividades ilícitas, fraudulentas ni contrarias a la moral</li>
              <li>No intentará acceder a cuentas, datos o sistemas de otros usuarios sin autorización</li>
            </ul>
          </Section>

          <Section title="III. Registro en la plataforma">
            <p>
              El registro en la plataforma de Suuplai no garantiza automáticamente la asignación de un slot.
              La incorporación está sujeta a:
            </p>
            <ul className="list-disc list-inside flex flex-col gap-1 ml-2">
              <li>Disponibilidad de espacios en las zonas de interés</li>
              <li>Proceso de curaduría y aprobación por parte del equipo Suuplai</li>
              <li>Acuerdo mutuo sobre términos comerciales específicos</li>
            </ul>
            <p>
              Suuplai se reserva el derecho de rechazar o cancelar registros que no cumplan con los
              criterios de calidad de la plataforma, sin necesidad de expresar causa.
            </p>
          </Section>

          <Section title="IV. Modelo comercial — Tiendas">
            <p>Las tiendas que participan en Suuplai aceptan que:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 ml-2">
              <li>Recibirán un pago fijo mensual acordado por el espacio cedido en anaquel</li>
              <li>Una comisión del 12% sobre las ventas generadas en su espacio será deducida de las liquidaciones de marcas</li>
              <li>No son responsables del inventario ni de la calidad de los productos exhibidos por las marcas</li>
              <li>Permiten el acceso del equipo Suuplai o de las marcas para reposición de producto, previa coordinación</li>
              <li>Pueden terminar su participación con 15 días naturales de aviso previo por escrito</li>
            </ul>
          </Section>

          <Section title="V. Modelo comercial — Marcas / Productores">
            <p>Las marcas que participan en Suuplai aceptan que:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 ml-2">
              <li>El pago de slot es mensual y se acuerda previamente con Suuplai y la tienda correspondiente</li>
              <li>Son responsables de la calidad, etiquetado, empaque y legalidad de sus productos</li>
              <li>Deben mantener inventario suficiente para abastecer los espacios acordados</li>
              <li>Suuplai puede retirar un producto del anaquel si no cumple estándares de calidad o rotación mínima</li>
              <li>Pueden terminar su participación con 15 días naturales de aviso previo por escrito</li>
            </ul>
          </Section>

          <Section title="VI. Propiedad intelectual">
            <p>
              Todos los contenidos del sitio web de Suuplai — incluyendo textos, imágenes, logotipos,
              diseños y código — son propiedad de AL GRANO DELI, S.A. DE C.V. o de sus licenciantes.
              Queda prohibida su reproducción total o parcial sin autorización escrita.
            </p>
            <p>
              Al compartir contenido en la plataforma (fotografías de tienda, descripciones de producto),
              usted otorga a Suuplai una licencia no exclusiva para usarlo con fines de promoción
              de la plataforma.
            </p>
          </Section>

          <Section title="VII. Limitación de responsabilidad">
            <p>
              Suuplai actúa como intermediario entre tiendas y marcas. No somos responsables de:
            </p>
            <ul className="list-disc list-inside flex flex-col gap-1 ml-2">
              <li>Daños, pérdidas o deterioro de mercancía en el punto de venta</li>
              <li>Incumplimiento de obligaciones entre tienda y marca</li>
              <li>Resultados comerciales (ventas, rotación, márgenes) que pueden variar</li>
              <li>Interrupciones técnicas del servicio fuera de nuestro control</li>
            </ul>
            <p>
              En ningún caso la responsabilidad total de Suuplai excederá el monto pagado por el
              usuario en los 3 meses previos al evento que da origen a la reclamación.
            </p>
          </Section>

          <Section title="VIII. Modificaciones">
            <p>
              Suuplai puede modificar estos términos en cualquier momento. Las modificaciones entrarán
              en vigor 10 días después de su publicación en el sitio web. El uso continuado de la
              plataforma implica aceptación de los términos actualizados.
            </p>
          </Section>

          <Section title="IX. Ley aplicable y jurisdicción">
            <p>
              Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier
              controversia, las partes se someten a la jurisdicción de los tribunales competentes de la
              Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles.
            </p>
          </Section>

          <Section title="X. Contacto">
            <p>
              Para dudas sobre estos términos, escríbenos a{' '}
              <a href="mailto:hola@suuplai.com" className="underline text-gray-900">hola@suuplai.com</a>.
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
            href="/privacidad"
            className="font-dm text-gray-500 hover:text-gray-800 transition-colors duration-200 underline"
            style={{ fontSize: '13px' }}
          >
            Aviso de privacidad →
          </Link>
        </div>
      </main>
    </div>
  )
}

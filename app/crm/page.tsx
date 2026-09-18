import type { Metadata } from 'next'
import { CrmComercial } from '@/components/crm/CrmComercial'

export const metadata: Metadata = {
  title: 'Suuplai · CRM',
  description:
    'La herramienta con la que operamos como agencia, en tus manos. Arranca con una base de miles de puntos de venta y opera tu propia prospección: pipeline, rutas, entregas firmadas e inventario. Desde $1,000 al mes.',
  openGraph: {
    title: 'Suuplai · CRM · Miles de tiendas y la herramienta para cerrarlas',
    description:
      'Base de miles de contactos + pipeline, rutas, entregas firmadas e inventario. Opera tu propia prospección desde $1,000 al mes.',
    type: 'website',
    locale: 'es_MX',
    url: 'https://www.suuplai.com.mx/crm',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suuplai · CRM',
    description: 'Miles de contactos y la herramienta para cerrarlos. Desde $1,000 al mes.',
  },
}

export default function CrmPage() {
  return <CrmComercial />
}

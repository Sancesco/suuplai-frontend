import type { Metadata } from 'next'
import { UneteSuuplai } from '@/components/unete/UneteSuuplai'

export const metadata: Metadata = {
  title: 'Únete a Suuplai',
  description:
    'Una carta, no una vacante. Estamos construyendo Suuplai en CDMX y Guadalajara y buscamos a la persona correcta para armar el rol con ella. Sin CV: contéstame tres cosas.',
  openGraph: {
    title: 'Únete a Suuplai · Una carta, no una vacante',
    description:
      'No hay descripción de puesto. Prefiero encontrar a la persona correcta y armar el rol con ella. Sin CV, contesta tres cosas y platicamos.',
    type: 'website',
    locale: 'es_MX',
    url: 'https://www.suuplai.com.mx/unete',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Únete a Suuplai',
    description: 'Una carta, no una vacante. Quien entra ahora, entra desde el principio.',
  },
}

export default function UnetePage() {
  return <UneteSuuplai />
}

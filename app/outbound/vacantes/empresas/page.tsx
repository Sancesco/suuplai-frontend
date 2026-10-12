import type { Metadata } from 'next'
import { Empresas } from './Empresas'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Empresas · Outbound', robots: { index: false, follow: false } }

export default function Page() {
  return <Empresas />
}

import type { Metadata } from 'next'
import { Detalle } from './Detalle'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Vacante · Outbound', robots: { index: false, follow: false } }

export default function Page({ params }: { params: { id: string } }) {
  return <Detalle id={params.id} />
}

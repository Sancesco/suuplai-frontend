import type { Metadata } from 'next'
import { Panel } from './Panel'

export const metadata: Metadata = { title: 'Panel · Aplicaciones', robots: { index: false, follow: false } }

export default function PanelPage() {
  return <Panel />
}

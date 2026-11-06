import type { ReactNode } from 'react'
import { SiteShell } from '@/components/site-shell'
import { getSettings } from '@/lib/content'

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings()
  return <SiteShell settings={settings}>{children}</SiteShell>
}

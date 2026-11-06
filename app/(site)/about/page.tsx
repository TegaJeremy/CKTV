import type { Metadata } from 'next'
import { AboutView } from '@/components/about-view'
import { PageHero } from '@/components/page-hero'
import { getSettings } from '@/lib/content'

export const metadata: Metadata = { title: 'About CKTV', description: 'Christian Kingdom Trend Vision: our story, mission and vision.' }

export default async function AboutPage() {
  const settings = await getSettings()
  return (
    <>
      <PageHero title="about.title" sub="about.sub" />
      <AboutView settings={settings} />
    </>
  )
}

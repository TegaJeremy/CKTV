import type { Metadata } from 'next'
import { ContactView } from '@/components/contact-view'
import { PageHero } from '@/components/page-hero'
import { getSettings } from '@/lib/content'

export const metadata: Metadata = { title: 'Contact us', description: 'Get in touch with the CKTV team.' }

export default async function ContactPage() {
  const settings = await getSettings()
  return (
    <>
      <PageHero title="contact.title" sub="contact.sub" />
      <ContactView settings={settings} />
    </>
  )
}

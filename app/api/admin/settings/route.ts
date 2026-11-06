import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { cloudConfig } from '@/lib/cloudinary'
import { getSettings, saveSettings } from '@/lib/content'
import { isCloudinaryUrl } from '@/lib/media'
import type { Localized, Settings } from '@/lib/types'

export const dynamic = 'force-dynamic'

const LANGS = ['en', 'ig', 'yo', 'ha', 'fr', 'es'] as const
const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const url = (v: unknown) => {
  const s = str(v, 500)
  return /^https?:\/\//i.test(s) ? s : ''
}

function cleanLocalized(value: unknown, max = 3000): Localized {
  const out: Localized = {}
  if (value && typeof value === 'object') {
    for (const l of LANGS) {
      const v = (value as Record<string, unknown>)[l]
      if (typeof v === 'string' && v.trim()) out[l] = v.trim().slice(0, max)
    }
  }
  return out
}

export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    return Response.json({ configured: !!cloudConfig(), settings: await getSettings({ fresh: true }) })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 })
  }
}

export async function PUT(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const i = (await req.json()) as Partial<Settings>
    const logo = str(i.logoUrl, 600)
    const settings: Settings = {
      logoUrl: logo && (isCloudinaryUrl(logo) || /^https:\/\//.test(logo)) ? logo : '',
      featuredId: str(i.featuredId, 120),
      about: cleanLocalized(i.about),
      mission: cleanLocalized(i.mission),
      vision: cleanLocalized(i.vision),
      verse: cleanLocalized(i.verse, 600),
      verseRef: str(i.verseRef, 80),
      email: str(i.email, 120),
      phone: str(i.phone, 50),
      whatsapp: str(i.whatsapp, 50),
      address: str(i.address, 300),
      socials: {
        instagram: url(i.socials?.instagram),
        youtube: url(i.socials?.youtube),
        facebook: url(i.socials?.facebook),
        tiktok: url(i.socials?.tiktok),
        x: url(i.socials?.x),
      },
    }
    await saveSettings(settings)
    revalidatePath('/', 'layout')
    return Response.json({ settings: await getSettings({ fresh: true }) })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 })
  }
}

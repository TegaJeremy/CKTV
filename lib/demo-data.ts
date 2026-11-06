import { dictionaries, locales, type TranslationKey } from './i18n'
import type { Localized, Post, Settings, Video } from './types'

/** Build a Localized value from the UI dictionaries so demo content is already translated. */
export function fromDictionary(key: TranslationKey): Localized {
  const out: Localized = {}
  for (const l of locales) out[l.code] = dictionaries[l.code][key]
  return out
}

/*
 * Demo content. It is shown ONLY while Cloudinary is not configured (for example in a V0/Vercel preview),
 * so the design can be reviewed. As soon as the Cloudinary keys are added, real content takes over.
 */
export const demoVideos: Video[] = [
  { id: 'demo-1', assetId: '', title: fromDictionary('video.v1'), description: fromDictionary('feature.desc'), category: 'teaching', date: '2026-11-02', published: true, src: '', thumb: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80', duration: 1694 },
  { id: 'demo-2', assetId: '', title: fromDictionary('video.v2'), description: fromDictionary('modal.desc'), category: 'podcast', date: '2026-10-28', published: true, src: '', thumb: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80', duration: 2528 },
  { id: 'demo-3', assetId: '', title: fromDictionary('video.v3'), description: fromDictionary('modal.desc'), category: 'worship', date: '2026-10-21', published: true, src: '', thumb: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80', duration: 2142 },
  { id: 'demo-4', assetId: '', title: fromDictionary('video.v4'), description: fromDictionary('modal.desc'), category: 'interview', date: '2026-10-15', published: true, src: '', thumb: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', duration: 1886 },
]

export const demoPosts: Post[] = [
  { slug: 'demo-1', title: fromDictionary('post.p1'), excerpt: fromDictionary('modal.desc'), body: fromDictionary('hero.copy'), cover: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80', date: '2026-11-04', published: true },
  { slug: 'demo-2', title: fromDictionary('post.p2'), excerpt: fromDictionary('modal.desc'), body: fromDictionary('hero.copy'), cover: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80', date: '2026-10-27', published: true },
  { slug: 'demo-3', title: fromDictionary('post.p3'), excerpt: fromDictionary('modal.desc'), body: fromDictionary('hero.copy'), cover: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80', date: '2026-10-18', published: true },
]

export function defaultSettings(): Settings {
  return {
    logoUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-11-05%20at%2010.56.17%20AM-Jkt2XEVq5IvGs6rucbaAmOy5UQ0wxA.jpeg',
    featuredId: '',
    about: fromDictionary('about.default.story'),
    mission: fromDictionary('about.default.mission'),
    vision: fromDictionary('about.default.vision'),
    // Matthew 6:33, King James Version (public domain). Change it in Admin → Settings, with translations if you like.
    verse: { en: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.' },
    verseRef: 'Matthew 6:33',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    socials: { instagram: '', youtube: '', facebook: '', tiktok: '', x: '' },
  }
}

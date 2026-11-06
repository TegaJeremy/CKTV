import type { Locale } from './i18n'

/** Text that can be written in several languages. "en" is the fallback. */
export type Localized = Partial<Record<Locale, string>>

export const CATEGORIES = ['podcast', 'teaching', 'worship', 'interview', 'other'] as const
export type Category = (typeof CATEGORIES)[number]

export type Video = {
  /** URL slug, e.g. "power-of-faith-ab12". The Cloudinary public id is `cktv/videos/<id>`. */
  id: string
  /** Full Cloudinary public id of the video asset (empty for demo content) */
  assetId: string
  title: Localized
  description: Localized
  category: Category
  /** ISO date, yyyy-mm-dd */
  date: string
  published: boolean
  /** Playable video URL (Cloudinary secure_url) */
  src: string
  /** Optional custom thumbnail URL. If empty, a frame of the video is used. */
  thumb: string
  thumbAssetId?: string
  /** seconds */
  duration?: number
  bytes?: number
  format?: string
}

export type Post = {
  slug: string
  title: Localized
  excerpt: Localized
  /** Simple markdown: ## headings, **bold**, *italic*, [link](url), - lists, ![alt](image-url), > quotes */
  body: Localized
  cover: string
  coverAssetId?: string
  date: string
  published: boolean
}

export type Socials = { instagram: string; youtube: string; facebook: string; tiktok: string; x: string }

export type Settings = {
  logoUrl: string
  /** id (slug) of the video shown first on the home page */
  featuredId: string
  about: Localized
  mission: Localized
  vision: Localized
  verse: Localized
  verseRef: string
  email: string
  phone: string
  whatsapp: string
  address: string
  socials: Socials
}

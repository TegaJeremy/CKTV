import { IDS, cloudConfig, readJson, writeJson } from './cloudinary'
import { defaultSettings, demoPosts, demoVideos } from './demo-data'
import type { Localized, Post, Settings, Video } from './types'

/*
 * Server-side data access used by the pages. If Cloudinary is not configured the demo content is returned,
 * so the site always renders. A Cloudinary outage never crashes a page: it falls back to an empty list.
 */

const byDateDesc = <T extends { date: string }>(a: T, b: T) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)

export async function getVideos(opts: { drafts?: boolean; fresh?: boolean } = {}): Promise<Video[]> {
  if (!cloudConfig()) return demoVideos
  try {
    const raw = await readJson<Video[]>(IDS.videos, [], opts.fresh)
    const list = (Array.isArray(raw) ? raw : []).sort(byDateDesc)
    return opts.drafts ? list : list.filter((v) => v.published)
  } catch (error) {
    if (opts.fresh) throw error
    console.error('[cktv] could not load videos', error)
    return []
  }
}

export async function getVideo(id: string): Promise<Video | undefined> {
  return (await getVideos()).find((v) => v.id === id)
}

export async function getPosts(opts: { drafts?: boolean; fresh?: boolean } = {}): Promise<Post[]> {
  if (!cloudConfig()) return demoPosts
  try {
    const raw = await readJson<Post[]>(IDS.posts, [], opts.fresh)
    const list = (Array.isArray(raw) ? raw : []).sort(byDateDesc)
    return opts.drafts ? list : list.filter((p) => p.published)
  } catch (error) {
    if (opts.fresh) throw error
    console.error('[cktv] could not load posts', error)
    return []
  }
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getPosts()).find((p) => p.slug === slug)
}

/** Use what the admin saved if the English text is filled in, otherwise the built-in translated default. */
function localizedOrDefault(stored: Localized | undefined, fallback: Localized): Localized {
  return stored && stored.en && stored.en.trim() ? stored : fallback
}

export async function getSettings(opts: { fresh?: boolean } = {}): Promise<Settings> {
  const defaults = defaultSettings()
  if (!cloudConfig()) return defaults
  try {
    const stored = await readJson<Partial<Settings>>(IDS.settings, {}, opts.fresh)
    return {
      ...defaults,
      ...stored,
      logoUrl: stored.logoUrl || defaults.logoUrl,
      about: localizedOrDefault(stored.about, defaults.about),
      mission: localizedOrDefault(stored.mission, defaults.mission),
      vision: localizedOrDefault(stored.vision, defaults.vision),
      verse: localizedOrDefault(stored.verse, defaults.verse),
      verseRef: stored.verseRef || defaults.verseRef,
      socials: { ...defaults.socials, ...(stored.socials ?? {}) },
    }
  } catch (error) {
    if (opts.fresh) throw error
    console.error('[cktv] could not load settings', error)
    return defaults
  }
}

export const saveVideos = (list: Video[]) => writeJson(IDS.videos, list)
export const savePosts = (list: Post[]) => writeJson(IDS.posts, list)
export const saveSettings = (settings: Settings) => writeJson(IDS.settings, settings)

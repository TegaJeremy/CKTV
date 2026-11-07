import { createHash, randomBytes } from 'node:crypto'
import { slugify } from './media'

/*
 * Tiny Cloudinary client using only fetch (no SDK, nothing to install).
 * SERVER ONLY: it reads CLOUDINARY_API_SECRET. Never import this file from a "use client" component.
 *
 * Data model (no database):
 *   - Videos, thumbnails and images are normal Cloudinary assets.
 *   - The "catalog" (titles, descriptions, categories, posts, settings) is stored as small JSON files
 *     uploaded to Cloudinary as raw assets inside the <folder>/data folder (default: cktv/data).
 */

type Config = { cloud: string; key: string; secret: string }

export function cloudConfig(): Config | null {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME
  const key = process.env.CLOUDINARY_API_KEY
  const secret = process.env.CLOUDINARY_API_SECRET
  return cloud && key && secret ? { cloud, key, secret } : null
}

function need(): Config {
  const c = cloudConfig()
  if (!c) throw new Error('Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.')
  return c
}

/** Cloudinary signature: sha1 of the sorted "key=value&key=value" string + API secret. */
export function signParams(params: Record<string, string | number | undefined>, secret: string): string {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return createHash('sha1').update(toSign + secret).digest('hex')
}

const basicAuth = (c: Config) => 'Basic ' + Buffer.from(`${c.key}:${c.secret}`).toString('base64')

/*
 * Folder name used inside your Cloudinary Media Library. Change it with CLOUDINARY_FOLDER (default "cktv").
 * Do this BEFORE uploading anything: files already uploaded stay in the old folder.
 *
 * New Cloudinary accounts use "dynamic folders": a folder shown in the Media Library is a separate setting
 * ("asset_folder") from the file name. Older accounts use "fixed folders", where the name itself is the folder.
 * Set CLOUDINARY_FOLDER_MODE=fixed only if your uploads fail with an "asset_folder" error.
 */
export const FOLDER = (process.env.CLOUDINARY_FOLDER ?? 'cktv').replace(/[^a-zA-Z0-9_-]/g, '') || 'cktv'
const DYNAMIC_FOLDERS = (process.env.CLOUDINARY_FOLDER_MODE ?? 'dynamic').toLowerCase() !== 'fixed'

export const IDS = {
  videos: `${FOLDER}/data/videos`,
  posts: `${FOLDER}/data/posts`,
  settings: `${FOLDER}/data/settings`,
} as const

/* ---------------------------- JSON catalogs ---------------------------- */

type RawResource = { public_id: string; secure_url: string; version: number }

/**
 * Read a JSON catalog.
 * - Finds the file by its exact name, or by prefix (in case Cloudinary added an extension to the name).
 * - Returns `fallback` ONLY when the file truly does not exist yet.
 * - Any other problem THROWS, so a failed read can never be mistaken for "empty" and overwrite your data.
 * fresh=true is used by the admin (always live). On your computer nothing is cached;
 * on the live site public pages are cached for 60 seconds.
 */
export async function readJson<T>(publicId: string, fallback: T, fresh = false): Promise<T> {
  const c = need()
  const cache: RequestInit & { next?: { revalidate: number } } =
    fresh || process.env.NODE_ENV !== 'production' ? { cache: 'no-store' } : { next: { revalidate: 60 } }
  const headers = { Authorization: basicAuth(c) }

  // 1) ask for the file by its exact name
  let found: RawResource | undefined
  const detail = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/resources/raw/upload/${publicId}`, { headers, ...cache })
  if (detail.ok) found = (await detail.json()) as RawResource
  else if (detail.status !== 404) throw new Error(`Cloudinary read failed (${detail.status}): ${await detail.text()}`)

  // 2) not found by name? search by prefix (also finds a file saved with an extension added to its name)
  if (!found) {
    const list = await fetch(
      `https://api.cloudinary.com/v1_1/${c.cloud}/resources/raw/upload?prefix=${encodeURIComponent(publicId)}&max_results=10`,
      { headers, ...cache },
    )
    if (!list.ok) throw new Error(`Cloudinary list failed (${list.status}): ${await list.text()}`)
    const { resources = [] } = (await list.json()) as { resources?: RawResource[] }
    found = resources
      .filter((r) => r.public_id === publicId || r.public_id.startsWith(`${publicId}.`))
      .sort((a, b) => b.version - a.version)[0]
  }

  if (!found) {
    console.log(`[cktv] read ${publicId}: no saved file found (using empty list)`)
    return fallback
  }

  const file = await fetch(found.secure_url, cache)
  if (!file.ok) throw new Error(`Could not download ${publicId} from Cloudinary (status ${file.status}).`)
  const text = await file.text()
  try {
    const data = JSON.parse(text) as T
    console.log(`[cktv] read ${publicId}: ok (version ${found.version})`)
    return data
  } catch {
    throw new Error(`${publicId} is not valid JSON: ${text.slice(0, 80)}`)
  }
}

export async function writeJson(publicId: string, data: unknown): Promise<void> {
  const c = need()
  const params: Record<string, string | number> = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp: Math.floor(Date.now() / 1000),
  }
  if (DYNAMIC_FOLDERS) params.asset_folder = `${FOLDER}/data`
  const form = new FormData()
  for (const [k, v] of Object.entries(params)) form.append(k, String(v))
  form.append('api_key', c.key)
  form.append('signature', signParams(params, c.secret))
  form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }), 'data.json')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/raw/upload`, { method: 'POST', body: form, cache: 'no-store' })
  const text = await res.text()
  if (!res.ok) throw new Error(`Cloudinary write failed (${res.status}): ${text}`)
  try {
    const saved = JSON.parse(text) as { public_id: string; version: number }
    console.log(`[cktv] saved ${publicId} -> stored as "${saved.public_id}" (version ${saved.version})`)
  } catch {
    /* response was not JSON, ignore */
  }
}

/* ------------------------------- Assets ------------------------------- */

export async function destroyAsset(publicId: string, resourceType: 'image' | 'video' | 'raw'): Promise<void> {
  if (!publicId) return
  const c = need()
  const params = { invalidate: 'true', public_id: publicId, timestamp: Math.floor(Date.now() / 1000) }
  const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), api_key: c.key, signature: signParams(params, c.secret) })
  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/${resourceType}/destroy`, { method: 'POST', body, cache: 'no-store' })
  if (!res.ok) throw new Error(`Cloudinary delete failed (${res.status}): ${await res.text()}`)
}

/**
 * Prepare a browser-direct upload. The browser sends the file straight to Cloudinary,
 * so it never passes through our server. Only the signature is created here, keeping the secret private.
 */
export function signUpload(kind: 'video' | 'image', filename: string) {
  const c = need()
  const base = filename.replace(/\.[^.]+$/, '')
  const sub = kind === 'video' ? 'videos' : 'images'
  const publicId = `${FOLDER}/${sub}/${slugify(base)}-${randomBytes(2).toString('hex')}`
  const params: Record<string, string | number> = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) }
  if (DYNAMIC_FOLDERS) params.asset_folder = `${FOLDER}/${sub}`
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${c.cloud}/${kind}/upload`,
    fields: Object.fromEntries([
      ...Object.entries(params).map(([k, v]) => [k, String(v)]),
      ['api_key', c.key],
      ['signature', signParams(params, c.secret)],
    ]) as Record<string, string>,
  }
}
import type { Video } from './types'

export function isCloudinaryUrl(url: string) {
  return /^https:\/\/res\.cloudinary\.com\//.test(url)
}

/** Cloudinary "attachment" delivery makes the browser download the file instead of playing it. */
export function downloadUrl(src: string) {
  return src.includes('/upload/') && isCloudinaryUrl(src) ? src.replace('/upload/', '/upload/fl_attachment/') : ''
}

/** A still frame taken from the video itself (used when no custom thumbnail was uploaded). */
export function videoFrame(src: string, width = 900) {
  if (!src.includes('/video/upload/') || !isCloudinaryUrl(src)) return ''
  return src
    .replace('/video/upload/', `/video/upload/so_2,w_${width},c_limit,f_jpg,q_auto/`)
    .replace(/\.[a-z0-9]+(\?.*)?$/i, '.jpg')
}

/** Ask Cloudinary for a smaller, auto-format version of an image. Other hosts are returned untouched. */
export function optimizeImage(url: string, width = 900) {
  if (!url || !url.includes('/image/upload/') || !isCloudinaryUrl(url)) return url
  return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width}/`)
}

export function thumbOf(video: Pick<Video, 'thumb' | 'src'>, width = 900) {
  if (video.thumb) return optimizeImage(video.thumb, width)
  return videoFrame(video.src, width)
}

export function formatDuration(seconds?: number) {
  if (!seconds || seconds < 1) return ''
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

export function formatBytes(bytes?: number) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}

export function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${iso}T12:00:00`))
  } catch {
    return iso
  }
}

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'item'
  )
}

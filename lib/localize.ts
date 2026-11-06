import type { Locale } from './i18n'
import type { Localized } from './types'

/** Pick the text for the visitor's language, falling back to English. */
export function pick(value: Localized | undefined, locale: Locale): string {
  if (!value) return ''
  const own = value[locale]
  if (own && own.trim()) return own
  return value.en ?? ''
}

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

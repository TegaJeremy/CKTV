import en from './en'
import ig from './ig'
import yo from './yo'
import ha from './ha'
import fr from './fr'
import es from './es'

export type { TranslationKey, Dictionary } from './en'

// Add or rename languages here. "name" is shown in the language switcher (always in its own language).
export const locales = [
  { code: 'en', name: 'English' },
  { code: 'ig', name: 'Igbo' },
  { code: 'yo', name: 'Yorùbá' },
  { code: 'ha', name: 'Hausa' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
] as const

export type Locale = (typeof locales)[number]['code']

export const dictionaries = { en, ig, yo, ha, fr, es }

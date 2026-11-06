'use client'

import type { ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { LanguageProvider } from '@/components/language-provider'

export function Providers({ children }: { children: ReactNode }) {
  // reducedMotion="user" automatically tones animations down for visitors who turned on "reduce motion" on their device.
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>{children}</LanguageProvider>
    </MotionConfig>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion, type Variants } from 'framer-motion'

export const ease = [0.22, 1, 0.36, 1] as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
}

/** Spread onto a motion element so it animates in (once) when scrolled into view. */
export const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-70px' } } as const

export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLElement>(null)
  const seen = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!seen) return
    if (reduce || to === 0) {
      setValue(to)
      return
    }
    const controls = animate(0, to, { duration: 1.6, ease: 'easeOut', onUpdate: (v) => setValue(Math.round(v)) })
    return () => controls.stop()
  }, [seen, to, reduce])

  return (
    <b ref={ref}>
      {value}
      {suffix}
    </b>
  )
}

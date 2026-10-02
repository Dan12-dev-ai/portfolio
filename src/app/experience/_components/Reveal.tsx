'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

/**
 * Entrance micro-interaction: fades/translates children into view the first
 * time they intersect the viewport. Pure CSS transitions (no animation
 * library) with graceful fallbacks for reduced motion and no-JS agents —
 * see the `[data-reveal]` rules in `experience.css`.
 */

type RevealProps = {
  children: ReactNode
  /** Extra classes applied to the wrapper (often the card itself). */
  className?: string
  /** Stagger delay in milliseconds. */
  delay?: number
}

export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const style: CSSProperties | undefined =
    delay > 0 ? { transitionDelay: `${delay}ms` } : undefined

  return (
    <div ref={ref} data-reveal className={className} style={style}>
      {children}
    </div>
  )
}
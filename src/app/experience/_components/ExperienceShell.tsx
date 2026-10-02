import type { ReactNode } from 'react'

/**
 * Root wrapper for the Experience page.
 *
 * Renders the `.exp-shell` element that carries the design tokens from
 * `experience.css`. The page is pinned to the light (white) theme so its
 * background matches the rest of the site — the canonical chrome has no theme
 * toggle, only `/resume` keeps its own layout. `data-theme="light"` stays on
 * the element because the contrast-correction rules are keyed off it.
 */
export default function ExperienceShell({ children }: { children: ReactNode }) {
  return (
    <div id="top" className="exp-shell" data-theme="light">
      {children}
    </div>
  )
}
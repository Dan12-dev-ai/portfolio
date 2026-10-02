/**
 * Inline SVG icon set for the Experience page.
 *
 * The site chrome inlines its SVGs (see `src/lib/chrome.ts`) to avoid an
 * icon-font dependency — the same approach is kept here instead of pulling in
 * an icon package.
 */

type IconProps = { className?: string }

export function ArrowRight({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

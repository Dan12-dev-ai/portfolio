/**
 * Landing page route (`/`).
 *
 * Serves the `src/landing.html` document — hero stage, live metrics,
 * capabilities, featured systems, workflow steps and the connect band — with
 * the canonical site chrome injected. The chrome supplies the working
 * navigation (the page's original nav pointed at anchors that did not exist),
 * the mobile drawer and the platform connect rail; the document keeps its own
 * Tailwind CDN config, fonts and animations.
 */

import { profile } from '@/lib/site'
import { servePage } from '@/lib/pages'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FALLBACK_HTML =
  '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Daniel Degu</title></head><body></body></html>'

export async function GET() {
  return servePage({
    file: 'landing.html',
    fallback: FALLBACK_HTML,
    active: 'home',
    variant: 'light',
    offsetBody: true,
    path: '/',
    title: `${profile.name} — ${profile.role}`,
    description: profile.headline,
  })
}

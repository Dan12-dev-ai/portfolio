/**
 * Contact page route (`/contact`).
 *
 * Serves the `src/contact.html` document through the shared chrome. The
 * document's own form script is wired to the real backend endpoint
 * (`POST /api/contact`), so submissions are validated server-side, stored and
 * acknowledged with a deterministic reference code.
 */

import { contactEmail, profile } from '@/lib/site'
import { servePage } from '@/lib/pages'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FALLBACK_HTML =
  '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Daniel Degu — Contact</title></head><body></body></html>'

export async function GET() {
  return servePage({
    file: 'contact.html',
    fallback: FALLBACK_HTML,
    active: 'contact',
    path: '/contact',
    title: `Contact — ${profile.name}`,
    description: `Open a channel: structured message form, ${contactEmail}, Telegram, LinkedIn, GitHub and X. Response SLA ${profile.responseSla}.`,
  })
}

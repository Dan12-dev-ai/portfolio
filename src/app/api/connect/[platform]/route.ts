/**
 * `GET /api/connect/[platform]` — tracked platform gateway.
 *
 * Every LinkedIn / GitHub / X / Telegram link in the shared chrome points here
 * instead of at the raw external URL, which means:
 *   - the destination is configured in one place (`src/lib/site.ts` + env vars)
 *   - outbound interest is measured (`/api/clicks` for the admin dashboard)
 *   - the redirect keeps working with JavaScript disabled (plain 302)
 */

import { errorResponse, json } from '@/lib/api'
import { displayHandle, getSocial } from '@/lib/site'
import { recordClick } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform } = await context.params
  const social = getSocial(platform.toLowerCase())

  if (!social) {
    return errorResponse(404, 'UNKNOWN_PLATFORM', `No platform named "${platform}". Try linkedin, github, x, telegram or email.`)
  }

  const url = new URL(request.url)

  // `?json=1` returns the destination instead of redirecting (handy for the
  // admin dashboard and for verifying configured links). Private channels
  // report their call to action and keep the destination server-side.
  if (url.searchParams.get('json') === '1') {
    return json({
      ok: true,
      platform: social.platform,
      handle: displayHandle(social),
      destination: social.private ? `${social.connect} (302 on click)` : social.url,
    })
  }

  await recordClick(social.platform, social.url, {
    referer: request.headers.get('referer') || '',
    userAgent: request.headers.get('user-agent') || '',
  })

  // Email has no meaningful external destination — hand the visitor to the
  // contact form instead of a bare `mailto:` tab.
  const destination = social.platform === 'email' ? '/contact#transmit' : social.url

  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      'Cache-Control': 'no-store',
      'X-Portfolio-Platform': social.platform,
    },
  })
}

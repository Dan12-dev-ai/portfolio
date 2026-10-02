/**
 * `POST /api/click` — outbound platform click beacon.
 *
 * Called by the shared runtime (`navigator.sendBeacon`) whenever a visitor
 * follows a LinkedIn / GitHub / X / Telegram / email link. Best-effort: the
 * response is intentionally tiny because the page may be unloading.
 */

import { json, readJson } from '@/lib/api'
import { getSocial } from '@/lib/site'
import { recordClick } from '@/lib/store'
import { clientKey, rateLimit, sanitizeText } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const limit = rateLimit(`click:${clientKey(request)}`, 60, 60 * 1000)
  if (!limit.allowed) return json({ ok: false, error: { code: 'RATE_LIMITED' } }, { status: 429 })

  const parsed = await readJson(request)
  if (!parsed.ok) return json({ ok: false, error: { code: 'INVALID_JSON' } }, { status: 400 })

  const body = parsed.value as Record<string, unknown>
  const platform = sanitizeText(body.platform, 24).toLowerCase()
  const social = getSocial(platform)
  if (!social) return json({ ok: false, error: { code: 'UNKNOWN_PLATFORM' } }, { status: 422 })

  const total = await recordClick(social.platform, social.url, {
    referer: sanitizeText(body.referer, 200),
    userAgent: request.headers.get('user-agent') || '',
  })

  return json({ ok: true, platform: social.platform, total })
}

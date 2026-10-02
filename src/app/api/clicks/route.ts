/**
 * `GET /api/clicks` — outbound connect analytics (admin only).
 */

import { isAdmin, json, unauthorized } from '@/lib/api'
import { clickSummary } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized()
  const summary = await clickSummary()
  return json({ ok: true, ...summary })
}

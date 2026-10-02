/**
 * `/api/subscribers` — updates list.
 *
 *   POST { email, source }  public opt-in (contact form or anywhere else)
 *   GET                     admin listing
 */

import { badJson, errorResponse, isAdmin, json, readJson, unauthorized } from '@/lib/api'
import { listSubscribers, subscribe, unsubscribe } from '@/lib/store'
import { clientKey, rateLimit, validateSubscribePayload } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const limit = rateLimit(`subscribe:${clientKey(request)}`, 10, 10 * 60 * 1000)
  if (!limit.allowed) {
    return errorResponse(429, 'RATE_LIMITED', 'Too many subscribe attempts. Try again shortly.')
  }

  const parsed = await readJson(request)
  if (!parsed.ok) return badJson()

  const validation = validateSubscribePayload(parsed.value)
  if (!validation.ok) {
    return errorResponse(422, 'VALIDATION_FAILED', 'Payload failed validation.', { fields: validation.errors })
  }

  const { subscriber, created } = await subscribe(validation.data.email, validation.data.source)
  return json({ ok: true, created, subscriber: { id: subscriber.id, email: subscriber.email } }, { status: created ? 201 : 200 })
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized()
  const subscribers = await listSubscribers()
  return json({ ok: true, total: subscribers.length, subscribers })
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return unauthorized()
  const email = (new URL(request.url).searchParams.get('email') || '').trim().toLowerCase()
  if (!email) return errorResponse(422, 'EMAIL_REQUIRED', 'Pass ?email=<address>.')

  const removed = await unsubscribe(email)
  if (!removed) return errorResponse(404, 'NOT_FOUND', 'No subscriber with that address.')
  return json({ ok: true, removed: email })
}

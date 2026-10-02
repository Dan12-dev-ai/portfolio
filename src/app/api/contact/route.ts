/**
 * `POST /api/contact` — the real contact pipeline.
 *
 * Order of operations:
 *   1. rate limit per client (5 submissions / 10 minutes)
 *   2. validate + sanitise the payload (shared rules in `src/lib/validate.ts`)
 *   3. persist the message with request metadata
 *   4. optionally add the sender to the updates list
 *
 * Responds `201` with the stored record id + reference so the contact page can
 * show a deterministic success panel.
 */

import { badJson, json, readJson } from '@/lib/api'
import { createMessage, subscribe } from '@/lib/store'
import { clientKey, rateLimit, validateContactPayload } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function reference(id: string): string {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  }
  let code = ''
  for (let index = 0; index < 6; index += 1) {
    code += REFERENCE_ALPHABET[hash % REFERENCE_ALPHABET.length]
    hash = Math.floor(hash / REFERENCE_ALPHABET.length)
  }
  return `DD-${code}`
}

export async function POST(request: Request) {
  const key = `contact:${clientKey(request)}`
  const limit = rateLimit(key, 5, 10 * 60 * 1000)

  if (!limit.allowed) {
    return json(
      {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: `Too many transmissions. Retry in ${limit.retryAfter}s.`,
        },
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const parsed = await readJson(request)
  if (!parsed.ok) return badJson()

  const validation = validateContactPayload(parsed.value)
  if (!validation.ok) {
    return json(
      { ok: false, error: { code: 'VALIDATION_FAILED', message: 'Payload failed validation.', fields: validation.errors } },
      { status: validation.status },
    )
  }

  const payload = validation.data
  const message = await createMessage({
    name: payload.name,
    email: payload.email,
    topic: payload.topic,
    message: payload.message,
    company: payload.company,
    meta: {
      ip: clientKey(request),
      userAgent: request.headers.get('user-agent') || '',
      referer: request.headers.get('referer') || '',
      source: 'contact-form',
    },
  })

  let subscribed = false
  if (payload.subscribe) {
    await subscribe(payload.email, 'contact-form')
    subscribed = true
  }

  return json(
    {
      ok: true,
      message: 'Message received. A human reply is on the way.',
      reference: reference(message.id),
      id: message.id,
      createdAt: message.createdAt,
      topic: message.topic,
      subscribed,
      responseSla: '< 24h',
    },
    { status: 201 },
  )
}

export async function GET() {
  return json(
    {
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Use POST with a JSON body: { name, email, topic, message, consent, subscribe }.',
      },
    },
    { status: 405, headers: { Allow: 'POST' } },
  )
}

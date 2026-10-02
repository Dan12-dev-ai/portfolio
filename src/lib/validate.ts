/**
 * Request payload validation for the public JSON API.
 *
 * Kept framework-free and dependency-free so the same rules can be reused by
 * the client runtime (which mirrors them for instant feedback) and by the
 * server (which is the authority).
 */

import { contactTopics } from './site'

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: Record<string, string> }

export interface ContactPayload {
  name: string
  email: string
  topic: (typeof contactTopics)[number]
  message: string
  consent: true
  company: string | null
  subscribe: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/** Remove control characters and collapse runaway whitespace. */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength)
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value) && value.length <= 160
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function asRecord(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {}
}

export function validateContactPayload(payload: unknown): ValidationResult<ContactPayload> {
  const body = asRecord(payload)
  const errors: Record<string, string> = {}

  const name = sanitizeText(body.name, 80)
  if (name.length < 2) errors.name = 'ERR_NAME_REQUIRED: Identifier field cannot be empty.'

  const email = normalizeEmail(sanitizeText(body.email, 160))
  if (!isValidEmail(email)) errors.email = 'ERR_EMAIL_INVALID: Address must match RFC-style pattern.'

  const topicValue = sanitizeText(body.topic, 60)
  const topic = (contactTopics as readonly string[]).includes(topicValue)
    ? (topicValue as ContactPayload['topic'])
    : undefined
  if (!topic) errors.topic = 'ERR_TOPIC_INVALID: Unknown transmission type.'

  const message = sanitizeText(body.message, 4000)
  if (message.length < 20) errors.message = 'ERR_PAYLOAD_SHORT: Minimum 20 characters required.'

  const consent = body.consent === true || body.consent === 'true' || body.consent === 'on'
  if (!consent) errors.consent = 'ERR_CONSENT_REQUIRED: Acknowledgement flag must be set.'

  // Honeypot: a real visitor never fills the hidden `company` field.
  const honeypot = sanitizeText(body.company, 120)
  if (honeypot) {
    return { ok: false, status: 400, errors: { company: 'ERR_BOT_SUSPECTED: Submission rejected.' } }
  }

  // Timing trap: humans need more than ~1s to read and type the payload.
  const elapsed = Number(body.elapsedMs)
  if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < 1200) {
    return { ok: false, status: 400, errors: { form: 'ERR_BOT_SUSPECTED: Submission rejected.' } }
  }

  if (Object.keys(errors).length > 0) return { ok: false, status: 422, errors }

  return {
    ok: true,
    data: {
      name,
      email,
      topic: topic as ContactPayload['topic'],
      message,
      consent: true,
      company: honeypot || null,
      subscribe: body.subscribe === true || body.subscribe === 'true' || body.subscribe === 'on',
    },
  }
}

export function validateSubscribePayload(payload: unknown): ValidationResult<{ email: string; source: string }> {
  const body = asRecord(payload)
  const email = normalizeEmail(sanitizeText(body.email, 160))
  if (!isValidEmail(email)) {
    return { ok: false, status: 422, errors: { email: 'ERR_EMAIL_INVALID: Address must match RFC-style pattern.' } }
  }
  return { ok: true, data: { email, source: sanitizeText(body.source, 40) || 'footer' } }
}

export function validateMessagePatch(payload: unknown): ValidationResult<{ id: string; status: 'new' | 'read' | 'archived' }> {
  const body = asRecord(payload)
  const id = sanitizeText(body.id, 80)
  const status = sanitizeText(body.status, 12)
  const errors: Record<string, string> = {}
  if (!id) errors.id = 'ERR_ID_REQUIRED'
  if (!['new', 'read', 'archived'].includes(status)) errors.status = 'ERR_STATUS_INVALID'
  if (Object.keys(errors).length > 0) return { ok: false, status: 422, errors }
  return { ok: true, data: { id, status: status as 'new' | 'read' | 'archived' } }
}

/**
 * Extremely small in-memory sliding-window limiter. Enough to stop accidental
 * double submits and casual form spam; deliberately not a security boundary.
 */
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((time) => now - time < windowMs)
  if (hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000)
    buckets.set(key, hits)
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) }
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 5000) buckets.clear()
  return { allowed: true, retryAfter: 0 }
}

/** Best-effort client identity for rate limiting behind proxies/CDNs. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown'
}

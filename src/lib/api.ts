/**
 * Shared helpers for the JSON API routes.
 */

import { siteUrl } from './site'

export const DEFAULT_ADMIN_TOKEN = 'daniel-degu-admin'

/** Admin token — override with `ADMIN_TOKEN` in the environment. */
export function adminToken(): string {
  const value = (process.env.ADMIN_TOKEN || '').trim()
  return value.length > 0 ? value : DEFAULT_ADMIN_TOKEN
}

export function isAdmin(request: Request): boolean {
  const expected = adminToken()
  const header = request.headers.get('authorization') || ''
  const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
  const custom = (request.headers.get('x-admin-token') || '').trim()
  const query = new URL(request.url).searchParams.get('token')?.trim() ?? ''
  return [bearer, custom, query].some((candidate) => candidate.length > 0 && candidate === expected)
}

export type JsonInit = { status?: number; headers?: Record<string, string> }

export function json(body: unknown, init: JsonInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init.headers ?? {}),
    },
  })
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
): Response {
  return json({ ok: false, error: { code, message, ...extra } }, { status })
}

export function unauthorized(): Response {
  return errorResponse(401, 'UNAUTHORIZED', 'A valid admin token is required for this endpoint.')
}

export function badJson(): Response {
  return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON.')
}

/** Safely parse a JSON request body without throwing. */
export async function readJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    const raw = await request.text()
    if (!raw.trim()) return { ok: true, value: {} }
    return { ok: true, value: JSON.parse(raw) }
  } catch {
    return { ok: false }
  }
}

/** Absolute URL helper so feeds/metadata work with or without NEXT_PUBLIC_SITE_URL. */
export function absoluteUrl(path: string, request?: Request): string {
  if (siteUrl) return `${siteUrl}${path}`
  if (request) {
    try {
      const origin = new URL(request.url).origin
      return `${origin}${path}`
    } catch {
      return path
    }
  }
  return path
}

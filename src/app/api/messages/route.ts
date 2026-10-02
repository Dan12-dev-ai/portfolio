/**
 * Admin inbox API — every method requires the admin token.
 *
 *   GET    /api/messages?status=new&search=ai&limit=50&offset=0
 *   PATCH  /api/messages   { id, status: "new" | "read" | "archived" }
 *   DELETE /api/messages?id=<message-id>
 *
 * Send the token as `Authorization: Bearer <token>`, `x-admin-token: <token>`
 * or `?token=<token>`. The token is `ADMIN_TOKEN` from the environment and
 * falls back to the documented development default.
 */

import { badJson, errorResponse, isAdmin, json, readJson, unauthorized } from '@/lib/api'
import type { MessageStatus } from '@/lib/store'
import { deleteMessage, listMessages, updateMessageStatus } from '@/lib/store'
import { validateMessagePatch } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized()

  const url = new URL(request.url)
  const statusParam = (url.searchParams.get('status') || 'all').toLowerCase()
  const status = (['new', 'read', 'archived', 'all'].includes(statusParam)
    ? statusParam
    : 'all') as MessageStatus | 'all'

  const result = await listMessages({
    status,
    search: url.searchParams.get('search') || '',
    limit: Number(url.searchParams.get('limit') || 50),
    offset: Number(url.searchParams.get('offset') || 0),
  })

  return json({ ok: true, status, ...result })
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return unauthorized()

  const parsed = await readJson(request)
  if (!parsed.ok) return badJson()

  const validation = validateMessagePatch(parsed.value)
  if (!validation.ok) {
    return errorResponse(422, 'VALIDATION_FAILED', 'Payload failed validation.', { fields: validation.errors })
  }

  const updated = await updateMessageStatus(validation.data.id, validation.data.status)
  if (!updated) return errorResponse(404, 'NOT_FOUND', 'No message with that id.')

  return json({ ok: true, message: updated })
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return unauthorized()

  const id = new URL(request.url).searchParams.get('id') || ''
  if (!id) return errorResponse(422, 'ID_REQUIRED', 'Pass ?id=<message-id>.')

  const removed = await deleteMessage(id)
  if (!removed) return errorResponse(404, 'NOT_FOUND', 'No message with that id.')

  return json({ ok: true, deleted: id })
}

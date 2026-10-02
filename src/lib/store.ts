/**
 * Tiny JSON-file persistence layer for the portfolio backend.
 *
 * The site has no external database dependency on purpose: contact messages,
 * subscribers and social click events are stored as newline-friendly JSON files
 * inside `data/` (override with `PORTFOLIO_DATA_DIR`). Every write is atomic
 * (temp file + rename) and serialised per file, so concurrent requests cannot
 * interleave a read-modify-write cycle.
 *
 * If the project directory is not writable (read-only serverless filesystem)
 * the store transparently falls back to the OS temp directory.
 */

import { promises as fs } from 'fs'
import fsSync from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'

export type MessageStatus = 'new' | 'read' | 'archived'

export interface ContactMessage {
  id: string
  name: string
  email: string
  topic: string
  message: string
  company: string | null
  status: MessageStatus
  createdAt: string
  updatedAt: string
  meta: { ip: string; userAgent: string; referer: string; source: string }
}

export interface Subscriber {
  id: string
  email: string
  source: string
  createdAt: string
}

export interface ClickRecord {
  id: string
  platform: string
  destination: string
  createdAt: string
  referer: string
  userAgent: string
}

interface Database {
  messages: ContactMessage[]
  subscribers: Subscriber[]
  clicks: ClickRecord[]
}

const EMPTY: Database = { messages: [], subscribers: [], clicks: [] }

const FILE = 'portfolio-db.json'

let resolvedDir: string | null = null

function candidateDirs(): string[] {
  const configured = (process.env.PORTFOLIO_DATA_DIR || '').trim()
  return [
    ...(configured ? [configured] : []),
    path.join(process.cwd(), 'data'),
    path.join(os.tmpdir(), 'daniel-degu-portfolio'),
  ]
}

/** First writable candidate directory, resolved once per process. */
export function dataDir(): string {
  if (resolvedDir) return resolvedDir
  for (const candidate of candidateDirs()) {
    try {
      fsSync.mkdirSync(candidate, { recursive: true })
      fsSync.accessSync(candidate, fsSync.constants.W_OK)
      resolvedDir = candidate
      return candidate
    } catch {
      // try the next candidate
    }
  }
  resolvedDir = os.tmpdir()
  return resolvedDir
}

export function dataFilePath(): string {
  return path.join(dataDir(), FILE)
}

const locks = new Map<string, Promise<unknown>>()

async function readDatabase(): Promise<Database> {
  try {
    const raw = await fs.readFile(dataFilePath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<Database>
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
      clicks: Array.isArray(parsed.clicks) ? parsed.clicks : [],
    }
  } catch {
    return { ...EMPTY }
  }
}

async function writeDatabase(data: Database): Promise<void> {
  const target = dataFilePath()
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, target)
}

/**
 * Serialised read-modify-write. The mutation callback receives the current
 * snapshot and returns the next one; the resolved value is passed back to the
 * caller so routes can echo what was persisted.
 */
function mutate<T>(fn: (data: Database) => { data: Database; result: T }): Promise<T> {
  const run = async (): Promise<T> => {
    const current = await readDatabase()
    const { data, result } = fn(current)
    await writeDatabase(data)
    return result
  }
  const previous = locks.get(FILE) ?? Promise.resolve()
  const next = previous.then(run, run)
  locks.set(
    FILE,
    next.then(
      () => undefined,
      () => undefined,
    ),
  )
  return next
}
/* ------------------------------------------------------------------ messages */

export interface NewMessageInput {
  name: string
  email: string
  topic: string
  message: string
  company?: string | null
  meta?: Partial<ContactMessage['meta']>
}

export async function createMessage(input: NewMessageInput): Promise<ContactMessage> {
  const now = new Date().toISOString()
  return mutate<ContactMessage>((db) => {
    const record: ContactMessage = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      topic: input.topic,
      message: input.message,
      company: input.company ?? null,
      status: 'new',
      createdAt: now,
      updatedAt: now,
      meta: {
        ip: input.meta?.ip ?? '',
        userAgent: input.meta?.userAgent ?? '',
        referer: input.meta?.referer ?? '',
        source: input.meta?.source ?? 'contact-form',
      },
    }
    return { data: { ...db, messages: [record, ...db.messages] }, result: record }
  })
}

export interface MessageQuery {
  status?: MessageStatus | 'all'
  search?: string
  limit?: number
  offset?: number
}

export async function listMessages(query: MessageQuery = {}): Promise<{
  items: ContactMessage[]
  total: number
  counts: Record<MessageStatus | 'all', number>
}> {
  const db = await readDatabase()
  const status = query.status ?? 'all'
  const needle = (query.search || '').trim().toLowerCase()

  const filtered = db.messages.filter((item) => {
    if (status !== 'all' && item.status !== status) return false
    if (!needle) return true
    return [item.name, item.email, item.topic, item.message, item.company ?? '']
      .join(' ')
      .toLowerCase()
      .includes(needle)
  })

  const counts = {
    all: db.messages.length,
    new: db.messages.filter((item) => item.status === 'new').length,
    read: db.messages.filter((item) => item.status === 'read').length,
    archived: db.messages.filter((item) => item.status === 'archived').length,
  }

  const offset = Math.max(0, query.offset ?? 0)
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 200) : 50

  return { items: filtered.slice(offset, offset + limit), total: filtered.length, counts }
}

export async function updateMessageStatus(
  id: string,
  status: MessageStatus,
): Promise<ContactMessage | null> {
  return mutate<ContactMessage | null>((db) => {
    let updated: ContactMessage | null = null
    const messages = db.messages.map((item) => {
      if (item.id !== id) return item
      updated = { ...item, status, updatedAt: new Date().toISOString() }
      return updated
    })
    return { data: { ...db, messages }, result: updated }
  })
}

export async function deleteMessage(id: string): Promise<boolean> {
  return mutate<boolean>((db) => {
    const messages = db.messages.filter((item) => item.id !== id)
    return { data: { ...db, messages }, result: messages.length !== db.messages.length }
  })
}
/* --------------------------------------------------------------- subscribers */

export async function subscribe(
  email: string,
  source = 'contact-form',
): Promise<{ subscriber: Subscriber; created: boolean }> {
  const normalized = email.trim().toLowerCase()
  return mutate<{ subscriber: Subscriber; created: boolean }>((db) => {
    const existing = db.subscribers.find((item) => item.email === normalized)
    if (existing) return { data: db, result: { subscriber: existing, created: false } }
    const subscriber: Subscriber = {
      id: randomUUID(),
      email: normalized,
      source,
      createdAt: new Date().toISOString(),
    }
    return {
      data: { ...db, subscribers: [subscriber, ...db.subscribers] },
      result: { subscriber, created: true },
    }
  })
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const db = await readDatabase()
  return db.subscribers
}

/** Remove an opt-out address from the updates list (admin action). */
export async function unsubscribe(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  return mutate<boolean>((db) => {
    const subscribers = db.subscribers.filter((item) => item.email !== normalized)
    return { data: { ...db, subscribers }, result: subscribers.length !== db.subscribers.length }
  })
}

/* -------------------------------------------------------------------- clicks */

export async function recordClick(
  platform: string,
  destination: string,
  context: { referer?: string; userAgent?: string } = {},
): Promise<number> {
  return mutate<number>((db) => {
    const record: ClickRecord = {
      id: randomUUID(),
      platform,
      destination,
      createdAt: new Date().toISOString(),
      referer: context.referer ?? '',
      userAgent: context.userAgent ?? '',
    }
    // Bounded log so the JSON file never grows without limit.
    const clicks = [record, ...db.clicks].slice(0, 2000)
    return { data: { ...db, clicks }, result: clicks.length }
  })
}

export interface ClickSummary {
  total: number
  byPlatform: { platform: string; count: number; last: string }[]
  recent: ClickRecord[]
}

export async function clickSummary(): Promise<ClickSummary> {
  const db = await readDatabase()
  const grouped = new Map<string, { count: number; last: string }>()
  for (const click of db.clicks) {
    const entry = grouped.get(click.platform) ?? { count: 0, last: click.createdAt }
    entry.count += 1
    if (click.createdAt > entry.last) entry.last = click.createdAt
    grouped.set(click.platform, entry)
  }
  return {
    total: db.clicks.length,
    byPlatform: [...grouped.entries()]
      .map(([platform, value]) => ({ platform, ...value }))
      .sort((a, b) => b.count - a.count),
    recent: db.clicks.slice(0, 25),
  }
}

/* --------------------------------------------------------------------- stats */

export interface StoreStats {
  messages: Record<MessageStatus | 'all', number>
  subscribers: number
  clicks: number
}

export async function storeStats(): Promise<StoreStats> {
  const db = await readDatabase()
  return {
    messages: {
      all: db.messages.length,
      new: db.messages.filter((item) => item.status === 'new').length,
      read: db.messages.filter((item) => item.status === 'read').length,
      archived: db.messages.filter((item) => item.status === 'archived').length,
    },
    subscribers: db.subscribers.length,
    clicks: db.clicks.length,
  }
}



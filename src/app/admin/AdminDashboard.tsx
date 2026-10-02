'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type MessageStatus = 'new' | 'read' | 'archived'
type Tab = 'inbox' | 'subscribers' | 'clicks' | 'health'

interface Message {
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

interface Subscriber {
  id: string
  email: string
  source: string
  createdAt: string
}

interface ClickSummary {
  total: number
  byPlatform: { platform: string; count: number; last: string }[]
  recent: { id: string; platform: string; destination: string; createdAt: string; referer: string }[]
}

interface HealthPayload {
  status?: string
  version?: string
  time?: string
  uptimeSeconds?: number
  node?: string
  data?: {
    messages?: Record<string, number>
    subscribers?: number
    clicks?: number
    directory?: string
  }
}

const TOKEN_KEY = 'pd-admin-token'

interface CallResult<T> {
  ok: boolean
  status: number
  body: T | null
  errorMessage: string
}

async function callApi<T>(
  path: string,
  token = '',
  init: RequestInit = {},
): Promise<CallResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-admin-token': token } : {}),
        ...(init.headers || {}),
      },
      cache: 'no-store',
    })
    let body: T | null = null
    try {
      body = (await response.json()) as T
    } catch {
      body = null
    }
    const fallback = `Request failed (HTTP ${response.status})`
    const apiMessage =
      body && typeof body === 'object' && 'error' in body && (body as { error?: { message?: string } }).error
        ? ((body as { error?: { message?: string } }).error?.message ?? '')
        : ''
    return {
      ok: response.ok,
      status: response.status,
      body,
      errorMessage: response.ok ? '' : apiMessage || fallback,
    }
  } catch {
    return { ok: false, status: 0, body: null, errorMessage: 'Network error — is the server running?' }
  }
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`)
        .join(','),
    )
    .join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function AdminDashboard() {
  const [token, setToken] = useState('')
  const [draftToken, setDraftToken] = useState('')
  const [authError, setAuthError] = useState('')
  const [checking, setChecking] = useState(false)

  const [tab, setTab] = useState<Tab>('inbox')
  const [messages, setMessages] = useState<Message[]>([])
  const [counts, setCounts] = useState({ all: 0, new: 0, read: 0, archived: 0 })
  const [statusFilter, setStatusFilter] = useState<'all' | MessageStatus>('new')
  const [search, setSearch] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [clicks, setClicks] = useState<ClickSummary | null>(null)
  const [health, setHealth] = useState<HealthPayload | null>(null)

  const flash = useCallback((text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 4000)
  }, [])

  const loadInbox = useCallback(
    async (activeToken: string, status: string, needle: string) => {
      const params = new URLSearchParams({ status, limit: '200' })
      if (needle.trim()) params.set('search', needle.trim())
      const result = await callApi<{ items?: Message[]; total?: number; counts?: typeof counts }>(
        `/api/messages?${params.toString()}`,
        activeToken,
      )
      if (!result.ok) {
        if (result.status === 401) {
          setToken('')
          localStorage.removeItem(TOKEN_KEY)
          setAuthError('Session expired — enter the admin token again.')
        }
        return
      }
      setMessages(result.body?.items ?? [])
      if (result.body?.counts) setCounts(result.body.counts)
    },
    [],
  )

  const loadSupporting = useCallback(async (activeToken: string) => {
    const [subs, clickData, healthData] = await Promise.all([
      callApi<{ subscribers?: Subscriber[] }>('/api/subscribers', activeToken),
      callApi<ClickSummary>('/api/clicks', activeToken),
      callApi<HealthPayload>('/api/health'),
    ])
    if (subs.ok) setSubscribers(subs.body?.subscribers ?? [])
    if (clickData.ok) setClicks(clickData.body)
    if (healthData.ok) setHealth(healthData.body)
  }, [])

  const authenticate = useCallback(
    async (candidate: string) => {
      if (!candidate.trim()) {
        setAuthError('Enter the admin token.')
        return
      }
      setChecking(true)
      setAuthError('')
      const result = await callApi<{ ok?: boolean }>('/api/messages?limit=1', candidate.trim())
      setChecking(false)
      if (!result.ok) {
        setAuthError(result.errorMessage || 'Token rejected.')
        return
      }
      localStorage.setItem(TOKEN_KEY, candidate.trim())
      setToken(candidate.trim())
      setDraftToken('')
      await Promise.all([
        loadInbox(candidate.trim(), 'new', ''),
        loadSupporting(candidate.trim()),
      ])
    },
    [loadInbox, loadSupporting],
  )

  const refresh = useCallback(
    async (status: string = statusFilter, needle: string = search) => {
      if (!token) return
      setBusy(true)
      await Promise.all([loadInbox(token, status, needle), loadSupporting(token)])
      setBusy(false)
    },
    [loadInbox, loadSupporting, search, statusFilter, token],
  )

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) authenticate(stored)
  }, [authenticate])

  const updateStatus = async (id: string, status: MessageStatus) => {
    if (!token) return
    const result = await callApi('/api/messages', token, {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    })
    if (!result.ok) {
      flash(result.errorMessage || 'Status update failed.')
      return
    }
    flash(`Message marked ${status}.`)
    await refresh()
  }

  const removeMessage = async (message: Message) => {
    if (!window.confirm(`Delete the message from ${message.name} permanently?`)) return
    if (!token) return
    const result = await callApi(`/api/messages?id=${encodeURIComponent(message.id)}`, token, {
      method: 'DELETE',
    })
    if (!result.ok) {
      flash(result.errorMessage || 'Delete failed.')
      return
    }
    setExpanded(null)
    flash('Message deleted.')
    await refresh()
  }

  const removeSubscriber = async (subscriber: Subscriber) => {
    if (!window.confirm(`Remove ${subscriber.email} from the updates list?`)) return
    if (!token) return
    const result = await callApi(
      `/api/subscribers?email=${encodeURIComponent(subscriber.email)}`,
      token,
      { method: 'DELETE' },
    )
    if (!result.ok) {
      flash(result.errorMessage || 'Remove failed.')
      return
    }
    flash('Subscriber removed.')
    await refresh()
  }

  const exportMessages = () => {
    downloadCsv('portfolio-messages.csv', [
      ['id', 'createdAt', 'status', 'name', 'email', 'company', 'topic', 'message', 'source', 'ip'],
      ...messages.map((message) => [
        message.id,
        message.createdAt,
        message.status,
        message.name,
        message.email,
        message.company ?? '',
        message.topic,
        message.message,
        message.meta.source,
        message.meta.ip,
      ]),
    ])
    flash('Messages exported as CSV.')
  }

  const exportSubscribers = () => {
    downloadCsv('portfolio-subscribers.csv', [
      ['id', 'email', 'source', 'createdAt'],
      ...subscribers.map((subscriber) => [
        subscriber.id,
        subscriber.email,
        subscriber.source,
        subscriber.createdAt,
      ]),
    ])
    flash('Subscribers exported as CSV.')
  }

  const metricCards = [
    { label: 'New messages', value: counts.new, accent: 'text-cyan-400' },
    { label: 'Read', value: counts.read, accent: 'text-slate-300' },
    { label: 'Archived', value: counts.archived, accent: 'text-slate-500' },
    { label: 'Subscribers', value: subscribers.length, accent: 'text-emerald-400' },
    { label: 'Connect clicks', value: clicks?.total ?? 0, accent: 'text-violet-400' },
  ]

  const tabs: { key: Tab; label: string }[] = [
    { key: 'inbox', label: `Inbox (${counts.all})` },
    { key: 'subscribers', label: `Subscribers (${subscribers.length})` },
    { key: 'clicks', label: `Clicks (${clicks?.total ?? 0})` },
    { key: 'health', label: 'System' },
  ]

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            authenticate(draftToken)
          }}
          className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8"
        >
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-cyan-400">Restricted console</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Portfolio admin</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter the admin token to open the inbox, subscriber list and click analytics. The token
            is <code className="text-cyan-300">ADMIN_TOKEN</code> from the environment (development
            default: <code className="text-cyan-300">daniel-degu-admin</code>).
          </p>
          <label className="mt-6 block text-xs font-medium uppercase tracking-widest text-slate-400">
            Admin token
            <input
              type="password"
              autoFocus
              value={draftToken}
              onChange={(event) => setDraftToken(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
              placeholder="••••••••••••"
            />
          </label>
          {authError ? <p className="mt-3 text-sm text-rose-400">{authError}</p> : null}
          <button
            type="submit"
            disabled={checking}
            className="mt-5 w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
          >
            {checking ? 'Verifying…' : 'Unlock console'}
          </button>
          <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-cyan-400">← Portfolio</Link>
            <Link href="/api/health" className="hover:text-cyan-400">/api/health</Link>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-cyan-400">Admin console</p>
            <h1 className="mt-1 text-xl font-bold text-white">Daniel Degu — portfolio operations</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              ● {health?.status || 'checking'}
            </span>
            <button
              type="button"
              onClick={() => refresh()}
              disabled={busy}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50"
            >
              {busy ? 'Refreshing…' : '↻ Refresh'}
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY)
                setToken('')
                setDraftToken('')
              }}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-rose-500 hover:text-rose-300"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold ${card.accent}`}>{card.value}</p>
            </div>
          ))}
        </section>

        <nav className="mt-6 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === item.key
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {notice ? (
          <p className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
            {notice}
          </p>
        ) : null}

        {tab === 'inbox' ? (
          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(['new', 'read', 'archived', 'all'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(value)
                      refresh(value, search)
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                      statusFilter === value
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {value} · {value === 'all' ? counts.all : counts[value]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    setSearch(searchDraft)
                    refresh(statusFilter, searchDraft)
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    placeholder="Search name, email, message…"
                    className="w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500 hover:text-cyan-300"
                  >
                    Search
                  </button>
                </form>
                <button
                  type="button"
                  onClick={exportMessages}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
                >
                  ↓ CSV
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {messages.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-700 px-4 py-10 text-center text-sm text-slate-500">
                  No messages match this filter. Submissions to{' '}
                  <code className="text-cyan-400">POST /api/contact</code> appear here instantly.
                </p>
              ) : (
                messages.map((message) => {
                  const open = expanded === message.id
                  return (
                    <article
                      key={message.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60"
                    >
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : message.id)}
                        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <span className="flex flex-wrap items-center gap-3">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              message.status === 'new'
                                ? 'bg-cyan-400'
                                : message.status === 'read'
                                  ? 'bg-emerald-400'
                                  : 'bg-slate-600'
                            }`}
                          />
                          <span className="text-sm font-semibold text-white">{message.name}</span>
                          <span className="text-xs text-slate-400">{message.email}</span>
                          <span className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                            {message.topic}
                          </span>
                        </span>
                        <span className="text-xs text-slate-500">{formatWhen(message.createdAt)}</span>
                      </button>
                      {open ? (
                        <div className="border-t border-slate-800 px-4 py-4">
                          <p className="whitespace-pre-wrap text-sm text-slate-200">{message.message}</p>
                          <dl className="mt-3 grid grid-cols-1 gap-1 text-xs text-slate-500 sm:grid-cols-2">
                            <div>Company: {message.company || '—'}</div>
                            <div>Source: {message.meta.source}</div>
                            <div>IP: {message.meta.ip || '—'}</div>
                            <div>Ref: {message.meta.referer || '—'}</div>
                          </dl>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <a
                              href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.topic}`)}`}
                              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                            >
                              Reply by email
                            </a>
                            {(['new', 'read', 'archived'] as MessageStatus[]).map((status) =>
                              status === message.status ? null : (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => updateStatus(message.id, status)}
                                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500 hover:text-cyan-300"
                                >
                                  Mark {status}
                                </button>
                              ),
                            )}
                            <button
                              type="button"
                              onClick={() => removeMessage(message)}
                              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-rose-500 hover:text-rose-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  )
                })
              )}
            </div>
          </section>
        ) : null}

        {tab === 'subscribers' ? (
          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                Updates-list opt-ins captured through <code className="text-cyan-400">POST /api/subscribers</code>.
              </p>
              <button
                type="button"
                onClick={exportSubscribers}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
              >
                ↓ Export CSV
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-xs uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                        No subscribers yet.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-t border-slate-800 bg-slate-950/40">
                        <td className="px-4 py-3 text-white">{subscriber.email}</td>
                        <td className="px-4 py-3 text-slate-400">{subscriber.source}</td>
                        <td className="px-4 py-3 text-slate-400">{formatWhen(subscriber.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeSubscriber(subscriber)}
                            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-rose-500 hover:text-rose-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === 'clicks' ? (
          <section className="mt-6">
            <p className="text-sm text-slate-400">
              Outbound platform clicks recorded by <code className="text-cyan-400">/api/connect/…</code> — proof the
              social links are live.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Totals by platform</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {(clicks?.byPlatform ?? []).map((entry) => (
                    <li key={entry.platform} className="flex items-center justify-between gap-3">
                      <span className="capitalize text-slate-200">{entry.platform}</span>
                      <span className="font-mono text-cyan-300">{entry.count}</span>
                    </li>
                  ))}
                  {(clicks?.byPlatform.length ?? 0) === 0 ? (
                    <li className="text-slate-500">No clicks recorded yet.</li>
                  ) : null}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Recent events</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-400">
                  {(clicks?.recent ?? []).map((click) => (
                    <li key={click.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="capitalize text-slate-200">{click.platform}</span>
                      <span className="truncate">{click.destination}</span>
                      <span>{formatWhen(click.createdAt)}</span>
                    </li>
                  ))}
                  {(clicks?.recent.length ?? 0) === 0 ? (
                    <li className="text-slate-500">Nothing yet — click a platform link on any page.</li>
                  ) : null}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {tab === 'health' ? (
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Backend health</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Status</dt>
                  <dd className="text-emerald-300">{health?.status || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Version</dt>
                  <dd className="font-mono text-slate-200">{health?.version || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Node</dt>
                  <dd className="font-mono text-slate-200">{health?.node || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Uptime</dt>
                  <dd className="font-mono text-slate-200">{health?.uptimeSeconds ?? '—'}s</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Checked at</dt>
                  <dd className="font-mono text-slate-200">{health?.time ? formatWhen(health.time) : '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Data store</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Messages</dt>
                  <dd className="font-mono text-slate-200">{health?.data?.messages?.all ?? counts.all}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Subscribers</dt>
                  <dd className="font-mono text-slate-200">{health?.data?.subscribers ?? subscribers.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Click events</dt>
                  <dd className="font-mono text-slate-200">{health?.data?.clicks ?? clicks?.total ?? 0}</dd>
                </div>
                <div className="break-all">
                  <dt className="text-slate-400">Directory</dt>
                  <dd className="mt-1 font-mono text-xs text-slate-300">{health?.data?.directory || '—'}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Link href="/api/health" className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-cyan-500 hover:text-cyan-300">/api/health</Link>
                <Link href="/api/profile" className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-cyan-500 hover:text-cyan-300">/api/profile</Link>
                <Link href="/api/projects" className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-cyan-500 hover:text-cyan-300">/api/projects</Link>
                <Link href="/api/experience" className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-cyan-500 hover:text-cyan-300">/api/experience</Link>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}




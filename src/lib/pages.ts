/**
 * Page loading + serving helpers.
 *
 * Each portfolio page is authored as a self-contained HTML document under
 * `src/`. At request time the document is read once (cached in production,
 * re-read on every request in development so edits appear immediately) and run
 * through `withChrome()` so every page shares one header, one footer and one
 * set of working links.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { withChrome, type ChromeOptions } from './chrome'

const cache = new Map<string, string>()

export function readPage(file: string, fallback: string): string {
  const cacheEnabled = process.env.NODE_ENV === 'production'
  if (cacheEnabled) {
    const cached = cache.get(file)
    if (cached) return cached
  }

  let html = fallback
  try {
    html = readFileSync(join(process.cwd(), 'src', file), 'utf8')
  } catch (error) {
    // The fallback keeps the route from hard-failing, but a missing document is
    // a packaging bug (see `outputFileTracingIncludes` in next.config.js) and
    // must not fail silently — otherwise only the chrome renders.
    console.error(`[pages] failed to read src/${file}:`, error)
  }

  if (cacheEnabled) cache.set(file, html)
  return html
}

export function htmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export interface ServeOptions extends ChromeOptions {
  file: string
  fallback: string
  title: string
  description: string
  path: string
}

/** Read a page document and serve it with canonical chrome + SEO metadata. */
export function servePage(options: ServeOptions): Response {
  const { file, fallback, title, description, path, ...chrome } = options
  const html = readPage(file, fallback)
  return htmlResponse(withChrome(html, { ...chrome, title, description, path }))
}

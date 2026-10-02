/**
 * `GET /api/projects` — the four signature systems with filtering.
 *
 * Query parameters:
 *   q         free-text match across title, tagline, summary, stack, highlights
 *   category  AI Systems | Automation | Platform | Infrastructure
 *   tech      technology name (repeatable, comma separated)
 *   status    In production | Active development | Prototype | Research
 */

import { json } from '@/lib/api'
import { projects } from '@/lib/site'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = (url.searchParams.get('q') || '').trim().toLowerCase()
  const category = (url.searchParams.get('category') || '').trim().toLowerCase()
  const status = (url.searchParams.get('status') || '').trim().toLowerCase()
  const tech = (url.searchParams.get('tech') || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  const items = projects.filter((project) => {
    if (category && project.category.toLowerCase() !== category) return false
    if (status && project.status.toLowerCase() !== status) return false
    if (tech.length > 0) {
      const stack = project.stack.map((item) => item.toLowerCase())
      if (!tech.some((wanted) => stack.some((item) => item.includes(wanted)))) return false
    }
    if (!query) return true
    return [project.title, project.tagline, project.summary, project.stack.join(' '), project.highlights.join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })

  return json({
    ok: true,
    total: items.length,
    facets: {
      categories: [...new Set(projects.map((project) => project.category))],
      statuses: [...new Set(projects.map((project) => project.status))],
      stack: [...new Set(projects.flatMap((project) => project.stack))].sort(),
    },
    items,
  })
}

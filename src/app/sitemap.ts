import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { publicRoutes, siteUrl } from '@/lib/site'

/**
 * `/sitemap.xml` — built from the canonical route list in `src/lib/site.ts`.
 *
 * Absolute URLs come from `NEXT_PUBLIC_SITE_URL` when configured and fall back
 * to the request host, so the sitemap is always valid regardless of where the
 * app is deployed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const base = siteUrl || `${protocol}://${host}`

  return publicRoutes.map((route) => ({
    url: `${base}${route.path === '/' ? '' : route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}

import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { siteUrl } from '@/lib/site'

/** `/robots.txt` — allow everything public, keep the admin inbox out of the index. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const base = siteUrl || `${protocol}://${host}`

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}

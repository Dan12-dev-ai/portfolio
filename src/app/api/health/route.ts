/**
 * `GET /api/health` — liveness + real backend telemetry.
 *
 * Also consumed by the shared client runtime, which renders the footer status
 * pill from this payload ("Operational · N messages received").
 */

import { json } from '@/lib/api'
import { displayHandle, profile, publicRoutes, socials, stats } from '@/lib/site'
import { dataDir, storeStats } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const store = await storeStats()

  return json({
    ok: true,
    status: 'operational',
    service: 'daniel-degu-portfolio',
    version: '2.5.0',
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    node: process.version,
    profile: {
      name: profile.name,
      role: profile.role,
      location: profile.location,
      availability: profile.availability,
      timezone: profile.timezone,
    },
    stats,
    routes: publicRoutes.map((route) => route.path),
    platforms: socials.map((social) => ({ platform: social.platform, handle: displayHandle(social) })),
    data: { ...store, directory: dataDir() },
  })
}

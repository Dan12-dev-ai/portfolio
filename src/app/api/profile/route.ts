/**
 * `GET /api/profile` — machine-readable profile for the whole portfolio.
 *
 * This is the endpoint the JSON consumers (résumé page, admin dashboard, any
 * future integration) read instead of scraping the HTML pages.
 */

import { json } from '@/lib/api'
import {
  contactEmail,
  contactTopics,
  displayHandle,
  experience,
  highSignalTopics,
  nav,
  profile,
  projects,
  services,
  skills,
  socials,
  stats,
  timeline,
} from '@/lib/site'
import { storeStats } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return json({
    ok: true,
    profile: {
      ...profile,
      email: contactEmail,
    },
    // Private channels report their call to action instead of a handle.
    socials: socials.map(({ icon, url, ...rest }) => ({
      ...rest,
      handle: displayHandle(rest),
      url: rest.private ? `/api/connect/${rest.platform}` : url,
    })),
    nav,
    stats,
    services,
    skills,
    timeline,
    experience,
    projects: projects.map(({ slug, title, tagline, category, status }) => ({
      slug,
      title,
      tagline,
      category,
      status,
      // The standalone /projects route was retired. The engineering record on
      // /experience is the page these systems are written up on now.
      url: '/experience',
    })),
    contactTopics,
    highSignalTopics,
    telemetry: await storeStats(),
  })
}

/**
 * `GET /api/experience` — experience timeline, capability domains and skills.
 */

import { json } from '@/lib/api'
import { experience, skills, timeline } from '@/lib/site'

export const runtime = 'nodejs'

export async function GET() {
  return json({
    ok: true,
    experience,
    timeline,
    skills,
    total: experience.length,
  })
}

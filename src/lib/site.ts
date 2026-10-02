/**
 * Single source of truth for the whole portfolio.
 *
 * Everything that appears in more than one place — profile copy, platform
 * links, the navigation model, projects, experience — lives here. The
 * server-rendered HTML pages, the JSON API routes and the client runtime all
 * read from this module so a link or a headline never drifts between pages.
 *
 * Every external URL can be overridden with an environment variable (see
 * `.env.example`) so the owner can repoint a platform without touching markup:
 *
 *   NEXT_PUBLIC_SITE_URL   canonical origin, e.g. https://danieldegu.dev
 *   LINKEDIN_URL           https://www.linkedin.com/in/<handle>
 *   GITHUB_URL             https://github.com/<handle>
 *   X_URL                  https://x.com/<handle>
 *   TELEGRAM_URL           https://t.me/<handle>
 *   CONTACT_EMAIL          you@example.com
 */

export type SocialPlatform = 'linkedin' | 'github' | 'x' | 'telegram' | 'email'

export type SocialLink = {
  platform: SocialPlatform
  label: string
  /** Display handle, derived from the URL when the env override is absent. */
  handle: string
  /** Real destination (external URL, or `mailto:` for email). */
  url: string
  /** Same-origin gateway that records the click, then 302s to `url`. */
  connect: string
  description: string
  /**
   * Private channels (Telegram) never print an address on screen. The card
   * shows a call to action instead, and the only thing a click does is open
   * the chat — the visitor talks to Daniel instead of reading a handle.
   */
  private?: boolean
  /** Button/link copy used when `private` hides the handle. */
  cta?: string
  /** Inline SVG icon markup (shared chrome has no icon-font dependency). */
  icon: string
  accent: string
}

export type NavItem = {
  key: string
  label: string
  href: string
  hint: string
}

export type Stat = { label: string; value: string; detail: string }

export type Service = {
  key: string
  title: string
  summary: string
  deliverables: string[]
}

export type Project = {
  slug: string
  title: string
  tagline: string
  summary: string
  stack: string[]
  category: 'AI Systems' | 'Automation' | 'Platform' | 'Infrastructure'
  status: 'In production' | 'Active development' | 'Prototype' | 'Research'
  metrics: { label: string; value: string }[]
  highlights: string[]
}

export type ExperienceEntry = {
  org: string
  role: string
  period: string
  location: string
  track: 'Primary engine' | 'Laboratory'
  summary: string
  highlights: string[]
  stack: string[]
}

export type TimelineStep = { step: string; title: string; detail: string }

export type SkillGroup = { category: string; items: string[] }

const readEnv = (key: string, fallback: string): string => {
  const value = process.env[key]
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

/** Canonical origin; empty string keeps every internal link relative. */
export const siteUrl = readEnv('NEXT_PUBLIC_SITE_URL', '').replace(/\/+$/, '')

const absolute = (path: string): string => (siteUrl ? `${siteUrl}${path}` : path)

/**
 * Derive a display handle from a profile URL so a username is never hard-coded
 * twice and a shown handle can never disagree with the link behind it.
 */
function handleFromUrl(url: string, fallback: string): string {
  try {
    const path = new URL(url).pathname.replace(/^\/+|\/+$/g, '')
    if (!path) return fallback
    return `@${path.replace(/^in\//, '')}`
  } catch {
    return fallback
  }
}

const LINKEDIN_URL = readEnv('LINKEDIN_URL', 'https://www.linkedin.com/in/daniel-degu-0a086b3b3')
const GITHUB_URL = readEnv('GITHUB_URL', 'https://github.com/Dan12-dev-ai')
const X_URL = readEnv('X_URL', 'https://x.com/DeguDaniel14592')
const TELEGRAM_URL = readEnv('TELEGRAM_URL', 'https://t.me/DDDan21')

export const contactEmail = readEnv('CONTACT_EMAIL', 'danieldegu909@gmail.com')

export const profile = {
  name: 'Daniel Degu',
  initials: 'DD',
  /** Brand logo rendered from the uploaded artwork (`danid-port.png`). */
  logo: '/logo.png',
  logoMark: '/logo-mark.png',
  avatarLocal: '/avatar.png',
  role: 'AI & Distributed Systems Engineer',
  roleShort: 'AI & Distributed Systems Engineer',
  tagline: 'Architecting Next-Gen Intelligence',
  location: 'Bahir Dar, Ethiopia',
  timezone: 'EAT · UTC+3',
  availability: 'Open to work',
  responseSla: '< 24h',
  workMode: 'Remote / Hybrid',
  languages: ['English', 'Amharic'],
  headline:
    'I architect and automate high-throughput multi-agent systems, integrating LLM pipelines, autonomous state machines and resilient APIs to eliminate friction and scale operational intelligence.',
  shortBio:
    'AI & Distributed Systems Engineer building deterministic multi-agent swarms, FastAPI microservices and observable LLM pipelines from Bahir Dar, Ethiopia.',
  longBio: [
    'I build systems that think in parallel. My work sits at the intersection of AI engineering and distributed backend design: multi-agent swarms that plan, re-plan and recover; LLM pipelines with evaluation harnesses; and event-driven services wired for observability rather than guesswork.',
    'Across DEDAN AI and the Bahir Dar Development Center I have taken products from first commit to production traffic — a multimodal diagnostic engine, an autonomous discovery swarm, an escrow-backed commodity marketplace — each one instrumented end-to-end so behaviour is measurable, not assumed.',
    'The signature systems on this site document their architecture in the open because the architecture is the work. If you are hiring for AI platform, orchestration or automation engineering, the fastest path is the contact form.',
  ],
  avatar: '/avatar.png',
} as const

/**
 * Platform links. Order drives the connect rail in the shared header/footer,
 * the contact page and the resume page.
 */
export const socials: SocialLink[] = [
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    handle: handleFromUrl(LINKEDIN_URL, 'LinkedIn profile'),
    url: LINKEDIN_URL,
    connect: '/api/connect/linkedin',
    description: 'Professional record, recommendations and verification.',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.9 9.4h4.16V21H2.9V9.4Zm6.6 0h3.99v1.58h.06c.55-1 1.9-2.06 3.9-2.06 4.18 0 4.95 2.55 4.95 5.87V21h-4.15v-5.34c0-1.27-.02-2.9-1.86-2.9-1.86 0-2.14 1.38-2.14 2.81V21H9.5V9.4Z"/></svg>',
    accent: '#0a66c2',
  },
  {
    platform: 'github',
    label: 'GitHub',
    handle: handleFromUrl(GITHUB_URL, 'GitHub repositories'),
    url: GITHUB_URL,
    connect: '/api/connect/github',
    description: 'Source of truth: repositories, RFCs and commit history.',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.57.1.78-.25.78-.55v-2.1c-3.2.69-3.88-1.4-3.88-1.4-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.09 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.3 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.18-1.48 3.14-1.18 3.14-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.26 5.69.42.36.79 1.07.79 2.16v3.2c0 .31.2.67.79.55A11.5 11.5 0 0 0 12 .5Z"/></svg>',
    accent: '#24292f',
  },
  {
    platform: 'x',
    label: 'X',
    handle: handleFromUrl(X_URL, 'X / Twitter'),
    url: X_URL,
    connect: '/api/connect/x',
    description: 'Build notes, shipped experiments and short engineering threads.',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.83-5.96 6.83H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z"/></svg>',
    accent: '#0f1419',
  },
  {
    platform: 'telegram',
    label: 'Telegram',
    handle: handleFromUrl(TELEGRAM_URL, 'Telegram'),
    url: TELEGRAM_URL,
    connect: '/api/connect/telegram',
    private: true,
    cta: 'Open chat on Telegram',
    description: 'Fastest async channel — scoping, quick questions, collaboration.',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.94 4.3 18.9 19.1c-.23 1.03-.85 1.28-1.72.8l-4.75-3.5-2.29 2.2c-.25.25-.47.47-.95.47l.34-4.84 8.8-7.95c.38-.34-.09-.53-.6-.2L6.85 12.8 2.16 11.3c-1.02-.32-1.04-1.02.21-1.5L20.4 2.9c.85-.31 1.6.2 1.54 1.4Z"/></svg>',
    accent: '#229ed9',
  },
  {
    platform: 'email',
    label: 'Email',
    handle: contactEmail,
    url: `mailto:${contactEmail}`,
    connect: '/api/connect/email',
    description: 'Best for role descriptions, project scopes and NDAs.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6.5 9 6 9-6"/></svg>',
    accent: '#c2410c',
  },
]
/**
 * Handle as it may be shown to visitors. Private channels (Telegram) never
 * print an address — the UI only advertises the call to action, and the click
 * is what opens the chat.
 */
export function displayHandle(social: Pick<SocialLink, 'handle' | 'private' | 'cta'>): string {
  return social.private ? social.cta ?? 'Direct chat' : social.handle
}



export function getSocial(platform: string): SocialLink | undefined {
  return socials.find((item) => item.platform === platform)
}

/** Primary navigation — one entry per real, routable page. */
export const nav: NavItem[] = [
  { key: 'home', label: 'Home', href: '/', hint: 'Engineering identity and systems overview' },
  { key: 'experience', label: 'Experience', href: '/experience', hint: 'Distributed systems and AI engineering track record' },
  { key: 'contact', label: 'Contact', href: '/contact', hint: 'Open a channel for collaboration and engineering work' },
  { key: 'resume', label: 'Resume', href: '/resume', hint: 'Download the organized engineering resume' },
]

export const stats: Stat[] = [
  { label: 'Multi-Agent Workflows', value: '25+', detail: 'Autonomous self-correcting agents' },
  { label: 'Execution Reliability', value: '99.9%', detail: 'Fault-tolerant distributed runs' },
  { label: 'Events Processed', value: '1.2M+', detail: 'Real-time webhook orchestrations' },
  { label: 'Median Latency', value: '< 180ms', detail: 'Optimized vector & tool pipelines' },
]

/** Capability cards used by the landing page and `/api/profile`. */
export const services: Service[] = [
  {
    key: 'agent-orchestration',
    title: 'Agent Orchestration',
    summary:
      'Deterministic multi-agent swarms with planning, tool boundaries, retries and re-plan loops that stay inside a governed state machine.',
    deliverables: ['LangGraph state machines', 'Tool protocol design', 'Re-plan + circuit breakers'],
  },
  {
    key: 'llm-pipelines',
    title: 'LLM & RAG Pipelines',
    summary:
      'Retrieval, ranking and evaluation harnesses wired to vector stores so model output is measured before it ever reaches a user.',
    deliverables: ['Vector indexing', 'Offline eval matrices', 'Prompt regression suites'],
  },
  {
    key: 'distributed-backends',
    title: 'Distributed Backends',
    summary:
      'FastAPI and Next.js services with async event fabrics, queue workers and idempotent writes that survive partial failure.',
    deliverables: ['FastAPI + Celery workers', 'PostgreSQL / Redis', 'Idempotent webhooks'],
  },
  {
    key: 'automation-observability',
    title: 'Automation & Observability',
    summary:
      'CI/CD automation plus end-to-end tracing, token profiling and latency budgets — so every run is auditable after the fact.',
    deliverables: ['OpenTelemetry tracing', 'Token & cost profiling', 'Zero-downtime deploys'],
  },
]

/** The four signature systems. Shared by `/`, `/api/projects` and the admin dashboard. */
export const projects: Project[] = [
  {
    slug: 'dedan-health',
    title: 'DEDAN Health',
    tagline: 'Multimodal AI diagnostic & triage system',
    summary:
      'A clinical triage pipeline that ingests multimodal input, grounds it against a vector knowledge base and returns ranked, safety-checked guidance to a clinician.',
    stack: ['FastAPI', 'Qdrant', 'Reasoning model', 'Safety guard', 'Next.js'],
    category: 'AI Systems',
    status: 'Active development',
    metrics: [
      { label: 'Triage stages', value: '5' },
      { label: 'Guardrails', value: 'Dual-pass' },
      { label: 'Grounding', value: 'Vector RAG' },
    ],
    highlights: [
      'Ingress normalises text and images before any reasoning call is made.',
      'Every recommendation passes a deterministic safety guard before output.',
      'The clinician hand-out is the only write path — nothing auto-files.',
    ],
  },
  {
    slug: 'swarm-orchestrator',
    title: 'DEDAN Swarm Orchestrator',
    tagline: 'Autonomous multi-agent swarm engine',
    summary:
      'An orchestrator that fans work out to specialised agents, tracks state through a governed machine and re-plans on failure with circuit breakers instead of infinite loops.',
    stack: ['LangGraph', 'Celery', 'Redis', 'FastAPI', 'OpenTelemetry'],
    category: 'Automation',
    status: 'In production',
    metrics: [
      { label: 'Agents per swarm', value: '25+' },
      { label: 'Re-plan ceiling', value: 'Bounded' },
      { label: 'Trace coverage', value: '100%' },
    ],
    highlights: [
      'Agent actions are typed and permission-scoped at the boundary.',
      'Circuit breakers trip on prompt drift and cost spikes.',
      'Every hop is traceable end-to-end for post-run audits.',
    ],
  },
  {
    slug: 'aijobfinder',
    title: 'AIJobFinder',
    tagline: 'High-throughput autonomous discovery & scoring pipeline',
    summary:
      'A concurrent crawl-and-score pipeline that discovers listings across platforms, de-duplicates them, scores semantic fit and dispatches only qualified matches.',
    stack: ['Async Python', 'Semantic scoring', 'PostgreSQL', 'Webhooks', 'Docker'],
    category: 'Platform',
    status: 'In production',
    metrics: [
      { label: 'Concurrency', value: 'Worker pool' },
      { label: 'De-duplication', value: 'Hash + vector' },
      { label: 'Dispatch', value: 'Webhook' },
    ],
    highlights: [
      'Two-pass de-duplication: exact hash first, then embedding distance.',
      'Fit scoring is explainable — every score ships its rationale.',
      'Relational upserts keep the store idempotent across re-runs.',
    ],
  },
  {
    slug: 'world-mine',
    title: 'World-Mine',
    tagline: 'Digital commodity & mineral marketplace platform',
    summary:
      'A marketplace where every trade is escrow-backed: listings are validated, escrow state is synchronised across services and the ledger stays auditable.',
    stack: ['Next.js', 'Supabase', 'Escrow engine', 'Document AI', 'Append-only ledger'],
    category: 'Infrastructure',
    status: 'Active development',
    metrics: [
      { label: 'Escrow states', value: 'Synchronised' },
      { label: 'Doc validation', value: 'AI-assisted' },
      { label: 'Ledger', value: 'Append-only' },
    ],
    highlights: [
      'Escrow transitions are the single source of truth for order state.',
      'Document AI validates certificates before escrow release.',
      'An append-only ledger makes every settlement replayable.',
    ],
  },
]

export const experience: ExperienceEntry[] = [
  {
    org: 'DEDAN AI',
    role: 'AI Systems & Software Engineering',
    period: '2024 — Present',
    location: 'Remote · Bahir Dar, Ethiopia',
    track: 'Primary engine',
    summary:
      'Full-lifecycle AI systems: deterministic multi-agent swarms, resilient FastAPI microservices and deep tracing pipelines.',
    highlights: [
      'Designed the swarm orchestrator that coordinates 25+ tool-bound agents.',
      'Introduced evaluation harnesses so prompt changes ship with evidence.',
      'Owned tracing and token profiling across every service boundary.',
    ],
    stack: ['Agent swarms', 'FastAPI backend', 'Telemetry audits', 'Vector search'],
  },
  {
    org: 'Bahir Dar Development Center',
    role: 'AI Development · Software Engineering · Observability',
    period: '2023 — Present',
    location: 'Bahir Dar, Ethiopia',
    track: 'Laboratory',
    summary:
      'Systems incubation and CI/CD: inference loops, agent tool execution boundaries and end-to-end telemetry engineering.',
    highlights: [
      'Built inference loops with offline evaluation before any release.',
      'Automated CI/CD with zero-downtime rolling updates.',
      'Standardised OpenTelemetry instrumentation across the lab stack.',
    ],
    stack: ['Inference loops', 'CI/CD automation', 'OpenTelemetry', 'PostgreSQL'],
  },
]

export const timeline: TimelineStep[] = [
  { step: '01', title: 'Software Engineering', detail: 'Core algorithms, data structures and clean modular codebases.' },
  { step: '02', title: 'Backend & APIs', detail: 'FastAPI, asynchronous event routing, PostgreSQL and Redis caching.' },
  { step: '03', title: 'AI Systems', detail: 'Model integration, prompt pipelines, vector similarity search and RAG.' },
  { step: '04', title: 'Multi-Agent Swarms', detail: 'LangGraph orchestration, tool protocols and state machine loops.' },
  { step: '05', title: 'Distributed Systems', detail: 'Decoupled queue workers, fail-safes and concurrent processing.' },
  { step: '06', title: 'Observability Fabric', detail: 'End-to-end distributed tracing, token profiling and latency tracking.' },
  { step: '07', title: 'Autonomous Systems', detail: 'Self-evaluating, self-healing agents bounded by rigid governance.' },
]

export const skills: SkillGroup[] = [
  { category: 'AI & Agents', items: ['LangGraph', 'LLM orchestration', 'Retrieval-augmented generation', 'Prompt evaluation', 'Tooling protocols', 'Multi-agent systems'] },
  { category: 'Distributed Systems', items: ['Async Python', 'Queue-driven workflows', 'Event-driven design', 'Fault tolerance', 'Resilience patterns', 'Service boundaries'] },
  { category: 'Backend Engineering', items: ['Python', 'FastAPI', 'Celery', 'PostgreSQL', 'Redis', 'REST APIs', 'Webhook integrations'] },
  { category: 'Platform & Observability', items: ['Docker', 'CI/CD automation', 'OpenTelemetry', 'Qdrant', 'Supabase', 'Vercel', 'Production monitoring'] },
  { category: 'Frontend & Product', items: ['TypeScript', 'Next.js', 'React', 'Tailwind CSS', 'Design systems', 'User-centric interfaces'] },
]

/** Structured intake taxonomy used by the contact form and `/api/contact`. */
export const contactTopics = [
  'Full-time role',
  'Contract build',
  'Open-source collaboration',
  'Research',
  'Other',
] as const

export const highSignalTopics = [
  'AI PLATFORM ROLES',
  'AGENT ORCHESTRATION',
  'DISTRIBUTED BACKENDS',
  'AUTOMATION BUILDS',
  'OSS COLLABORATION',
]

export const publicRoutes: {
  path: string
  priority: number
  changeFrequency: 'daily' | 'weekly' | 'monthly'
}[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/experience', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/resume', priority: 0.6, changeFrequency: 'monthly' },
]

export { absolute, readEnv }


/**
 * Shared site chrome.
 *
 * The portfolio pages are self-contained HTML documents (each one ships its own
 * Tailwind CDN config, fonts and section markup). Rather than duplicate a
 * header/footer in five files — which is how the navigation drifted out of sync
 * and ended up pointing at `href="#"` — every page is served through
 * `withChrome()`, which swaps in one canonical header, connect rail and footer.
 *
 * The chrome is written with plain `pd-` classes and styled by
 * `/portfolio.css`, so it renders identically no matter which Tailwind config a
 * page happens to load.
 */

import { getSocial, nav, profile, siteUrl, socials } from './site'

/**
 * The site runs a single visual identity (cyan → blue → coral on white/slate)
 * shared by the landing page and every content page, so the chrome variant is
 * kept as a single value and simply recorded on the markup for debugging.
 */
export type ChromeVariant = 'light'

export interface ChromeOptions {
  /** Nav key that should render as the current page. */
  active: string
  /** Accent flavour: Material-indigo for the content pages, cyan for landing. */
  variant?: ChromeVariant
  /**
   * Set when the page body has no top padding of its own (the landing page's
   * header was sticky rather than fixed) so the fixed chrome does not overlap
   * the first section.
   */
  offsetBody?: boolean
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const ARROW_UP =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'

const ARROW_RIGHT =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'

function navLinksHtml(active: string, className: string): string {
  return nav
    .map((item) => {
      const isActive = item.key === active
      const classes = [className, isActive ? 'is-active' : ''].filter(Boolean).join(' ')
      const current = isActive ? ' aria-current="page"' : ''
      return `<a class="${classes}"${current} href="${item.href}" title="${escapeHtml(item.hint)}" data-pd-nav="${item.key}">${escapeHtml(item.label)}</a>`
    })
    .join('')
}

function socialRailHtml(className: string): string {
  return socials
    .map((social) => {
      // Private channels (Telegram) show a call to action instead of a handle:
      // one click opens the chat, nothing is left on screen to copy.
      const tip = social.private ? `${social.label} — ${social.cta ?? 'open chat'}` : `${social.label} — ${social.handle}`
      const aria = social.private
        ? `${social.label} — ${social.cta ?? 'open a direct chat'}`
        : `${social.label} (${social.handle})`
      return `<a class="${className}" href="${social.connect}" target="_blank" rel="noopener noreferrer"
        data-pd-connect="${social.platform}" style="--pd-social-accent:${social.accent}"
        title="${escapeHtml(tip)}" aria-label="${escapeHtml(aria)}">
        <span class="pd-social__icon">${social.icon}</span>
        <span class="pd-social__label">${escapeHtml(social.label)}</span>
      </a>`
    })
    .join('')
}

/** Canonical header: fixed bar + scroll progress + mobile connect drawer. */
export function buildHeader({ active, variant = 'light' }: ChromeOptions): string {
  const drawerLinks = nav
    .map((item) => {
      const isActive = item.key === active
      return `<a class="pd-drawer__link${isActive ? ' is-active' : ''}" href="${item.href}" data-pd-nav="${item.key}">
          <span>${escapeHtml(item.label)}</span>
          <small>${escapeHtml(item.hint)}</small>
        </a>`
    })
    .join('')

  return `<header class="pd-header" data-pd-header data-pd-variant="${variant}" data-pd-active="${active}">
  <div class="pd-progress" data-pd-progress aria-hidden="true"></div>
  <div class="pd-container pd-header__row">
    <a class="pd-brand" href="/" aria-label="${escapeHtml(profile.name)} — home">
      <span class="pd-brand__mark pd-brand__mark--photo"><img src="${escapeAttr(profile.logoMark)}" alt="${escapeHtml(`${profile.name} — logo`)}" width="40" height="40" fetchpriority="high" /></span>
      <span class="pd-brand__text">
        <span class="pd-brand__name">${escapeHtml(profile.name)}</span>
        <span class="pd-brand__role">${escapeHtml(profile.roleShort)}</span>
      </span>
    </a>

    <nav class="pd-nav" aria-label="Primary navigation">
      ${navLinksHtml(active, 'pd-nav__link')}
    </nav>

    <div class="pd-header__actions">
      <span class="pd-pill pd-pill--live" data-pd-live hidden>
        <span class="pd-dot"></span><span data-pd-live-text>Open to work</span>
      </span>
      <a class="pd-btn pd-btn--solid pd-header__cta" href="/contact">
        <span>Hire me</span>${ARROW_RIGHT}
      </a>
      <button class="pd-burger" type="button" data-pd-burger aria-expanded="false" aria-controls="pd-drawer" aria-label="Open navigation menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>

  <div class="pd-drawer" id="pd-drawer" data-pd-drawer hidden>
    <div class="pd-drawer__panel">
      <div class="pd-drawer__head">
        <span class="pd-drawer__title">Navigation</span>
        <button class="pd-drawer__close" type="button" data-pd-close aria-label="Close navigation menu">&times;</button>
      </div>
      <nav class="pd-drawer__nav" aria-label="Mobile navigation">${drawerLinks}</nav>
      <div class="pd-drawer__section">
        <span class="pd-drawer__title">Connect</span>
        <div class="pd-socials pd-socials--drawer">${socialRailHtml('pd-social')}</div>
      </div>
      <div class="pd-drawer__section">
        <span class="pd-drawer__title">Availability</span>
        <p class="pd-muted">${escapeHtml(profile.availability)} · ${escapeHtml(profile.location)} · replies ${escapeHtml(profile.responseSla)}</p>
      </div>
    </div>
    <div class="pd-drawer__backdrop" data-pd-close tabindex="-1"></div>
  </div>
</header>`
}
/** Extra containers the client runtime needs on every page. */
export const RUNTIME_MARKUP = `
<div class="pd-scrim" data-pd-scrim hidden></div>
<div class="pd-toasts" data-pd-toasts role="status" aria-live="polite"></div>
<button class="pd-totop" type="button" data-pd-totop aria-label="Back to top" hidden>${ARROW_UP}</button>`

const HEAD_ASSETS = `<link rel="stylesheet" href="/portfolio.css" data-pd-asset="css"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link href="https://fonts.gstatic.com" rel="preconnect" crossorigin=""/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500;600&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap" rel="stylesheet"/>
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" data-pd-asset="icon"/>
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" data-pd-asset="icon"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" data-pd-asset="icon"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<meta name="theme-color" content="#0b1220"/>
<link rel="manifest" href="/manifest.webmanifest"/>
<script src="/portfolio.js" defer data-pd-asset="runtime"></script>`

function escapeAttr(value: string): string {
  // `escapeHtml` already handles quotes; keep the name for call-site clarity.
  return escapeHtml(value)
}

function injectSeo(html: string, options: ChromeOptions & { title: string; description: string; path: string }): string {
  const { title, description, path } = options
  const canonical = path
  // Scrapers only rasterise PNG/JPG, so the share card ships as /og.png.
  const ogImage = siteUrl ? `${siteUrl}/og.png` : '/og.png'
  const tags = [
    `<meta name="description" content="${escapeAttr(description)}"/>`,
    `<link rel="canonical" href="${escapeAttr(canonical)}"/>`,
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="${escapeAttr(profile.name)}"/>`,
    `<meta property="og:title" content="${escapeAttr(title)}"/>`,
    `<meta property="og:description" content="${escapeAttr(description)}"/>`,
    `<meta property="og:url" content="${escapeAttr(canonical)}"/>`,
    `<meta property="og:image" content="${escapeAttr(ogImage)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${escapeAttr(title)}"/>`,
    `<meta name="twitter:description" content="${escapeAttr(description)}"/>`,
    `<meta name="twitter:image" content="${escapeAttr(ogImage)}"/>`,
    `<meta name="author" content="${escapeAttr(profile.name)}"/>`,
    `<meta name="robots" content="index,follow"/>`,
    `<meta name="apple-mobile-web-app-title" content="${escapeAttr(profile.name)}"/>`,
  ].join('\n')

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.role,
    description: profile.shortBio,
    url: canonical,
    image: siteUrl ? `${siteUrl}${profile.logo}` : profile.logo,
    address: { '@type': 'PostalAddress', addressLocality: 'Bahir Dar', addressCountry: 'ET' },
    // Private channels stay out of the published markup entirely: the handle
    // only ever exists in the server-side redirect, never in the page source.
    sameAs: socials.filter((item) => item.platform !== 'email' && !item.private).map((item) => item.url),
    knowsAbout: [
      'AI orchestration',
      'Multi-agent systems',
      'LangGraph',
      'FastAPI',
      'Distributed systems',
      'LLM evaluation',
    ],
    mainEntityOfPage: { '@type': `WebPage`, '@id': canonical, name: title },
  })

  let next = html
  if (/<title>[\s\S]*?<\/title>/i.test(next)) {
    next = next.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  } else {
    next = next.replace(/<head[^>]*>/i, (match) => `${match}\n<title>${escapeHtml(title)}</title>`)
  }
  next = next.replace(
    /<\/head>/i,
    `${tags}\n<script type="application/ld+json">${jsonLd}</script>\n${HEAD_ASSETS}\n</head>`,
  )
  return next
}

/** Replace the first `<header>…</header>` block (or inject one). */
function replaceHeader(html: string, header: string): string {
  const start = html.search(/<header[\s>]/i)
  if (start === -1) {
    return html.replace(/<body[^>]*>/i, (match) => `${match}\n${header}`)
  }
  const end = html.toLowerCase().indexOf('</header>', start)
  if (end === -1) {
    return html.replace(/<body[^>]*>/i, (match) => `${match}\n${header}`)
  }
  return `${html.slice(0, start)}${header}${html.slice(end + '</header>'.length)}`
}

/** Replace the last `<footer>…</footer>` block (or inject one). */
function replaceFooter(html: string, footer: string): string {
  const lower = html.toLowerCase()
  const closeAt = lower.lastIndexOf('</footer>')
  if (closeAt === -1) {
    return html.replace(/<\/body>/i, `${footer}\n</body>`)
  }
  const openAt = lower.lastIndexOf('<footer', closeAt)
  if (openAt === -1) {
    return html.replace(/<\/body>/i, `${footer}\n</body>`)
  }
  return `${html.slice(0, openAt)}${footer}${html.slice(closeAt + '</footer>'.length)}`
}

/**
 * Dead-CTA repair.
 *
 * The authored documents mark their call-to-action links with
 * `data-path="<key>"` while still carrying the `href="#"` placeholder they were
 * exported with. Swapping the header removes most of them (the nav is rebuilt
 * from `nav` in `site.ts`), but the ones inside `<main>` survive, so every page
 * is passed through here. A `data-path` key resolves to either
 *
 *   • a site route          — `home`, `about`, `experience`, `projects`,
 *                             `contact`, `resume`
 *   • a platform gateway    — `linkedin`, `github`, `x`, `telegram`, `email`,
 *                             which records the click and then 302s onward
 *
 * Links that already carry a real destination are left untouched, and unknown
 * keys are ignored rather than guessed at, so a typo surfaces in QA instead of
 * silently pointing somewhere plausible.
 */
function repairLinks(html: string): string {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    const keyMatch = tag.match(/data-path="([^"]*)"/i)
    if (!keyMatch) return tag

    const key = keyMatch[1].trim().toLowerCase()
    const hrefMatch = tag.match(/href="([^"]*)"/i)
    if (hrefMatch && hrefMatch[1] && hrefMatch[1] !== '#') return tag

    const route = nav.find((item) => item.key === key)?.href
    const platform = route ? undefined : getSocial(key)
    const destination = route ?? platform?.connect
    if (!destination) return tag

    let next = hrefMatch
      ? tag.replace(/href="[^"]*"/i, `href="${destination}"`)
      : tag.replace(/^<a\b/i, `<a href="${destination}"`)

    if (platform) {
      next = next.replace(/\s+data-pd-connect="[^"]*"/gi, '')
      if (!/target=/i.test(next)) next = next.replace(/^<a\b/i, '<a target="_blank"')
      if (!/rel=/i.test(next)) next = next.replace(/^<a\b/i, '<a rel="noopener noreferrer"')
      next = next.replace(/^<a\b/i, `<a data-pd-connect="${platform.platform}"`)
    }
    return next
  })
}

/**
 * Serve a page document with canonical chrome, head assets, SEO metadata and
 * repaired call-to-action links.
 */
export function withChrome(
  html: string,
  options: ChromeOptions & { title: string; description: string; path: string },
): string {
  const { active, variant = 'light', offsetBody = false } = options
  let next = html

  next = injectSeo(next, options)
  next = replaceHeader(next, buildHeader({ active, variant }))
  next = replaceFooter(next, buildFooter({ active, variant }))
  next = repairLinks(next)

  next = next.replace(/<body([^>]*)>/i, (_match, attrs: string) => {
    const classMatch = attrs.match(/class="([^"]*)"/i)
    const existing = classMatch ? classMatch[1] : ''
    const classes = ['pd-body', offsetBody ? 'pd-offset' : '', existing].filter(Boolean).join(' ')
    const nextAttrs = classMatch
      ? attrs.replace(/class="[^"]*"/i, `class="${classes}"`)
      : `${attrs} class="${classes}"`
    return `<body${nextAttrs}>`
  })

  next = next.replace(/<\/body>/i, `${RUNTIME_MARKUP}\n</body>`)
  return next
}

export function buildFooter({ active, variant = 'light' }: ChromeOptions): string {
  const quickLinks = nav
    .filter((item) => item.key !== 'resume')
    .map(
      (item) =>
        `<li><a class="${item.key === active ? 'is-active' : ''}" href="${item.href}" data-pd-nav="${item.key}">${escapeHtml(item.label)}</a></li>`,
    )
    .join('')

  return `<footer class="pd-footer" data-pd-footer data-pd-variant="${variant}">
  <div class="pd-container pd-footer__grid">
    <div class="pd-footer__brand">
      <a class="pd-brand pd-brand--footer" href="/">
        <span class="pd-brand__mark pd-brand__mark--photo"><img src="${escapeAttr(profile.logoMark)}" alt="${escapeHtml(`${profile.name} — logo`)}" width="40" height="40" loading="lazy" /></span>
        <span class="pd-brand__text">
          <span class="pd-brand__name">${escapeHtml(profile.name)}</span>
          <span class="pd-brand__role">${escapeHtml(profile.role)}</span>
        </span>
      </a>
      <p class="pd-muted pd-footer__bio">${escapeHtml(profile.shortBio)}</p>
      <div class="pd-footer__meta">
        <span class="pd-chip">${escapeHtml(profile.location)}</span>
        <span class="pd-chip">${escapeHtml(profile.timezone)}</span>
        <span class="pd-chip pd-chip--accent">${escapeHtml(profile.availability)}</span>
      </div>
    </div>

    <div class="pd-footer__col">
      <h3 class="pd-footer__heading">Navigate</h3>
      <ul class="pd-footer__links">${quickLinks}</ul>
    </div>

    <div class="pd-footer__col">
      <h3 class="pd-footer__heading">Signals</h3>
      <ul class="pd-footer__list">
        <li><span>Response SLA</span><strong>${escapeHtml(profile.responseSla)}</strong></li>
        <li><span>Work mode</span><strong>${escapeHtml(profile.workMode)}</strong></li>
        <li><span>Languages</span><strong>${profile.languages.map(escapeHtml).join(' · ')}</strong></li>
      </ul>
      <button class="pd-btn pd-btn--ghost pd-copy" type="button" data-pd-copy="${escapeHtml(socials.find((s) => s.platform === 'email')?.handle ?? '')}">
        <span>Copy email</span>
        <code data-pd-copy-value>${escapeHtml(socials.find((s) => s.platform === 'email')?.handle ?? '')}</code>
      </button>
    </div>

    <div class="pd-footer__col">
      <h3 class="pd-footer__heading">Connect everywhere</h3>
      <div class="pd-socials">${socialRailHtml('pd-social pd-social--chip')}</div>
      <p class="pd-muted pd-footer__note">LinkedIn, GitHub, X, Telegram and email — every link is live and routed through this site.</p>
    </div>
  </div>

  <div class="pd-container pd-footer__bottom">
    <span>© ${new Date().getFullYear()} ${escapeHtml(profile.name)}. All rights reserved.</span>
    <span class="pd-status" data-pd-status data-pd-endpoint="/api/health">
      <span class="pd-dot pd-dot--ok"></span><span data-pd-status-text>Systems operational</span>
    </span>
    <a class="pd-footer__top" href="#top" data-pd-top-link>Back to top ${ARROW_UP}</a>
  </div>
</footer>`
}


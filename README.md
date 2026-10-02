# portfolio

Production portfolio and engineering record for **Daniel Degu**, AI and Distributed Systems Engineer.

A Next.js 15 application serving four public routes from a single shared chrome, backed by a dependency-free JSON API and a file-based data store. No external database, no CMS, no icon font.

---

## Table of Contents

- [Overview](#overview)
- [Technology](#technology)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [The Shared Chrome](#the-shared-chrome)
- [JSON API](#json-api)
- [Data and Persistence](#data-and-persistence)
- [Admin Console](#admin-console)
- [SEO and Accessibility](#seo-and-accessibility)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Overview

The site has four public routes and one token-gated console.

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/` | Route handler serving a static document | Landing page: hero, live metrics, capabilities, featured systems |
| `/contact` | Route handler serving a static document | Contact form wired to `POST /api/contact`, plus direct channels |
| `/experience` | App Router page, statically prerendered | Engineering record: expertise, capabilities, career timeline, principles |
| `/resume` | App Router page, statically prerendered | Print-optimised curriculum vitae with a dedicated print stylesheet |
| `/admin` | App Router page, noindex | Token-gated console for messages, subscribers and click analytics |

### What the application does

- **One shared chrome.** Every route renders the same header, footer, mobile drawer and floating controls from one module (`src/lib/chrome.ts`), so navigation and layout cannot drift between pages.
- **Machine-readable content.** The data that renders the pages is exposed as JSON at `/api/profile`, so the site never has to be scraped.
- **Working contact pipeline.** Messages are validated server-side, rate-limited, persisted, and surfaced in the console with a deterministic reference code.
- **Tracked outbound links.** Social links route through a redirect gateway that records interest before forwarding, and that still works with JavaScript disabled.
- **Operational telemetry.** The footer status pill is rendered from live `/api/health` data rather than hard-coded copy.

---

## Technology

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15.5.14, App Router | Server Components, route handlers, metadata API |
| Language | TypeScript 5 | `strict: true` |
| Styling | Tailwind CSS 3.4 | Design tokens as CSS custom properties |
| Runtime | Node.js 20 or newer | File persistence requires a writable filesystem |
| Linting | ESLint 8, `next/core-web-vitals` | Runs in CI |
| Package manager | npm | Lockfile committed |

### Declared but unused dependencies

The following packages appear in `package.json` but are **not imported anywhere** in the current source tree. They survive from an earlier design and inflate install time and audit surface:

`framer-motion`, `lucide-react`, `@radix-ui/*`, `class-variance-authority`, `tailwindcss-animate`

Animation, icons and the drawer are implemented by hand in `public/portfolio.js`, `public/portfolio.css` and the shared chrome module. If you are auditing this repository, ignore these entries or remove them.

> For a deeper treatment of the rendering model, the persistence layer and the reasoning behind each major decision, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). For endpoint-level detail, see [docs/API.md](docs/API.md).

### Design notes

- **No icon font or icon package.** All interface icons are inline SVG generated in one place, which removes a network request and a build-time asset pipeline.
- **No CSS framework runtime.** The chrome stylesheet is a single hand-written file served from `/public`, shared by every route.
- **Fonts are loaded once.** `next/font` self-hosts for the App Router pages; the static documents reference the same families through the chrome.

---

## Architecture

The application uses a deliberate hybrid rendering model. Understanding it is the most useful thing to know before contributing.

```text
                    ┌────────────────────────────┐
   request  ───────>│     Next.js App Router     │
                    └─────────────┬──────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
   Route handler (dynamic)             App Router pages (static)
   /  and  /contact                     /experience  /resume  /admin
              │                                       │
   reads src/landing.html                 React components
   reads src/contact.html                 plus experience.css
              │                                       │
              └───────────────────┬───────────────────┘
                                  │
                    ┌─────────────v──────────────┐
                    │      src/lib/chrome.ts     │
                    │  buildHeader()             │
                    │  buildFooter()             │
                    │  RUNTIME_MARKUP            │
                    │  withChrome()              │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────v──────────────┐
                    │  public/portfolio.css      │
                    │  public/portfolio.js       │
                    │   shared chrome runtime    │
                    └────────────────────────────┘
```

### The two rendering strategies

**Static documents served by route handlers.** The landing and contact pages are authored as complete HTML documents in `src/landing.html` and `src/contact.html`. At request time `servePage()` reads the document from disk, injects the canonical header, footer and runtime markup, and sets the title and description. In production the file is read once and cached in memory; in development it is re-read on every request so edits appear without a restart. A fallback document is provided so a missing file degrades rather than crashes the route.

**App Router pages for structured content.** The experience, resume and admin pages are ordinary Server Components. They import the same chrome builders and render the markup with `dangerouslySetInnerHTML`, because the chrome is authored as strings in `src/lib/chrome.ts` and is shared verbatim with the static documents. Sharing one code path is what keeps the two strategies visually identical.

**Why this design.** The static documents allow dense, hand-tuned visual sections without fighting a component abstraction. The App Router pages suit content that is genuinely structured data. The cost of the hybrid is therefore confined to the page body and never reaches the navigation.

### Content is a single source of truth

`src/lib/site.ts` holds every piece of content appearing in more than one place: profile copy, platform links, navigation, statistics, services, skills, projects and the career timeline. The HTML pages, the JSON API, the sitemap and the client runtime all read from it, so a link or a headline cannot disagree between surfaces.

External URLs are overridable through environment variables, and display handles are derived from those URLs rather than hard-coded a second time, so a shown handle can never contradict the link behind it.

---

## Getting Started

### Requirements

- Node.js 20 or newer
- npm 10 or newer

### Installation

```bash
git clone https://github.com/Dan12-dev-ai/portfolio.git
cd portfolio
npm install
```

### Running locally

```bash
npm run dev
```

Open `http://localhost:3000`. The application runs with no environment configuration at all: every variable has a working default.

### Production build

```bash
npm run build
npm run start
```

### Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server with hot reloading |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint across the source tree |

---

## Environment Variables

Copy `.env.example` to `.env.local` and set only what you need. Every key is optional.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | empty | Canonical origin for sitemap, canonical and Open Graph URLs. Empty keeps internal links relative. |
| `LINKEDIN_URL` | live account | LinkedIn destination |
| `GITHUB_URL` | live account | GitHub destination |
| `X_URL` | live account | X destination |
| `TELEGRAM_URL` | live account | Telegram destination |
| `CONTACT_EMAIL` | live address | Address shown as the email contact and used for reply links |
| `ADMIN_TOKEN` | `daniel-degu-admin` | Bearer token for the console and admin API routes |
| `PORTFOLIO_DATA_DIR` | `data/` | Write location for the JSON store |

**Change `ADMIN_TOKEN` before deploying.** See [Security Notes](#security-notes).

---

## Project Structure

```text
portfolio/
├── data/                          Runtime JSON store (git-ignored)
│   └── portfolio-db.json          Messages, subscribers, click events
├── docs/
│   ├── ARCHITECTURE.md         Rendering model, chrome, persistence, decisions
│   └── API.md                 Endpoint contracts, auth, limits, error codes
├── public/                        Static assets and shared chrome runtime
│   ├── portfolio.css              Header, footer, drawer, toasts, to-top
│   ├── portfolio.js               Delegated-event client runtime
│   ├── manifest.webmanifest       PWA manifest
│   └── favicon.svg, og.png, ...   Icons and social preview images
├── snapshots/                     Local visual-review artefacts (git-ignored)
├── src/
│   ├── landing.html               Landing page document, served by /
│   ├── contact.html               Contact page document, served by /contact
│   ├── app/
│   │   ├── layout.tsx             Root layout, fonts, global metadata
│   │   ├── globals.css            Global styles and design tokens
│   │   ├── route.ts               Landing page route handler
│   │   ├── sitemap.ts             Sitemap generated from the route table
│   │   ├── robots.ts              Robots policy; excludes /admin and /api
│   │   ├── contact/route.ts       Contact page route handler
│   │   ├── experience/            App Router page
│   │   │   ├── page.tsx
│   │   │   ├── experience.css     Scoped token and component layer
│   │   │   └── _components/       Six content sections and the shell
│   │   ├── resume/                App Router page with print stylesheet
│   │   ├── admin/                 Token-gated operations console
│   │   └── api/                   Route handlers
│   └── lib/
│       ├── site.ts                Single source of truth for all content
│       ├── chrome.ts              Shared header, footer and runtime markup
│       ├── pages.ts               Document loading and serving helpers
│       ├── store.ts               Atomic JSON persistence layer
│       ├── validate.ts            Validation, sanitisation and rate limiting
│       ├── api.ts                 Response helpers and admin authorisation
│       └── utils.ts               Class-name merging helper
├── .env.example                   Documented environment template
└── next.config.js, tailwind.config.ts, tsconfig.json
```

---

## The Shared Chrome

`src/lib/chrome.ts` is the single implementation of the site frame.

| Export | Purpose |
| --- | --- |
| `buildHeader(options)` | Header markup: brand, navigation, availability pill, call to action |
| `buildFooter(options)` | Footer markup: profile summary, navigation, signals, contact channels, status |
| `RUNTIME_MARKUP` | Non-visual runtime nodes: drawer, scrim, progress bar, to-top button, toast host |
| `withChrome(html, options)` | Injects the chrome and metadata into a complete HTML document |
| `ChromeOptions` | `active` route key, `variant`, and `offsetBody` compensation flag |

Options behave as follows:

- `active` marks the current navigation entry as active.
- `variant` selects the accent flavour. Only `'light'` is currently defined, because the experience page was moved to the light theme and the remaining pages share it.
- `offsetBody` is set for the landing page, whose header is sticky rather than fixed, so the fixed chrome does not overlap the first section.

### Client runtime

`public/portfolio.js` provides the interactive behaviour and is loaded by every route. It uses **delegated event listeners on `document`** and resolves nodes through live DOM queries on each interaction, rather than binding to elements captured at load time. This is what allows the chrome to survive App Router navigation and component remounting: the runtime never assumes a node it captured still exists.

It implements the mobile drawer with scroll locking, the scroll progress bar, the back-to-top control, header-aware anchor scrolling, the live status pill, copy-to-clipboard helpers with toast feedback, and outbound click beacons via `navigator.sendBeacon`. An initialisation guard prevents double-binding.

---

## JSON API

All endpoints return JSON. Admin endpoints require the bearer token.

### Public

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/profile` | The portfolio as structured data: profile, socials, navigation, statistics, services, skills, timeline, experience, projects, contact topics, telemetry |
| `GET` | `/api/health` | Liveness probe and backend telemetry: uptime, runtime version, resolved data directory, record counts. The footer status pill renders from this response. |
| `GET` | `/api/projects` | Project summaries |
| `GET` | `/api/experience` | Career entries and skills |
| `GET` | `/api/connect/[platform]` | Redirect gateway for outbound links. Records the click, then issues a 302. Add `?json=1` to inspect the destination without redirecting. |
| `POST` | `/api/click` | Click beacon, called by the client runtime through `navigator.sendBeacon` |
| `POST` | `/api/contact` | Submit a contact message |
| `POST` | `/api/subscribers` | Subscribe an address to project updates |

### Admin

Require `Authorization: Bearer <ADMIN_TOKEN>`. The `x-admin-token` header and a `?token=` query parameter are also accepted for convenience.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/messages` | List contact messages, newest first |
| `PATCH` | `/api/messages` | Update a message status: `new`, `read` or `archived` |
| `DELETE` | `/api/messages` | Delete a message |
| `GET` | `/api/subscribers` | List subscribers |
| `DELETE` | `/api/subscribers` | Remove a subscriber |
| `GET` | `/api/clicks` | Click analytics grouped by platform |

### Conventions

Successful responses are shaped `{ "ok": true, ... }`. Failures are shaped `{ "ok": false, "error": { "code", "message", "fields"? } }` with an appropriate HTTP status. Validation failures return `422` with per-field messages.

---

## Data and Persistence

The application has no database dependency. `src/lib/store.ts` implements a small JSON-file store, which keeps the project deployable anywhere a Node process can write to disk.

Design properties:

- **Atomic writes.** Every write goes to a temporary file and is then renamed into place, so a crash mid-write cannot corrupt the database.
- **Serialised mutation.** Read-modify-write cycles are serialised per file, so concurrent requests cannot interleave and lose data.
- **Write-location fallback.** If the configured directory is not writable, the store falls back to the system temp directory rather than failing requests. The resolved path is reported by `/api/health`.
- **Bounded click log.** Click events are capped at the most recent 2000 records so the file cannot grow without limit.

Three collections are maintained: `messages`, `subscribers` and `clicks`.

The store is appropriate for a single-instance deployment. It is **not** safe across multiple server instances or a serverless environment with an ephemeral filesystem, because each instance would hold a divergent copy. Moving to a managed database is the correct step if the site is scaled horizontally.

---

## Admin Console

`/admin` is a single-page operations console for reviewing contact messages, managing subscribers and inspecting click analytics. It is excluded from search engines by both its page metadata and `robots.ts`.

Access requires the admin token, which is entered in the client and sent as a bearer token on every request. The token is held in session storage, so closing the tab ends the session.

The console is intentionally minimal. It is an operational tool, not a content management system.

---

## SEO and Accessibility

- Per-route metadata with a title template, canonical URLs, and Open Graph and Twitter card images.
- A generated `sitemap.xml` built from the canonical route table, and a `robots.txt` that disallows `/admin` and `/api/`.
- Structured data: the experience page emits Schema.org `Person` JSON-LD.
- Semantic landmarks and labelled navigation, with `aria-expanded` on the drawer toggle and `aria-label` on icon-only controls.
- Visible focus states throughout, defined with `:focus-visible` so they appear for keyboard users without appearing on pointer interaction.
- `prefers-reduced-motion` is respected by the reveal, tilt and scroll animations.
- The drawer closes on `Escape` and locks background scrolling while open.
- Colour contrast on the experience page is enforced by unlayered correction rules that override literal Tailwind colour utilities.

**Not yet implemented.** There is no skip-to-content link, and the drawer does not trap focus. Both are worthwhile additions and are listed in [Contributing](../README.md#contributing).

---

## Deployment

The project deploys to Vercel without additional build configuration. Vercel detects Next.js and applies the correct defaults.

1. Import the repository at <https://github.com/Dan12-dev-ai/portfolio> from the Vercel dashboard.
2. Add the environment variables below before the first production deploy.
3. Assign the production domain. The canonical origin is `https://danid.vercel.app`, which is also the value of `NEXT_PUBLIC_SITE_URL`.
4. Deploy.

Setting `NEXT_PUBLIC_SITE_URL` matters. When it is empty, the sitemap and robots generators fall back to the request host, and `metadataBase` is left undefined, which makes Next.js warn and resolve social images against `localhost`. Setting it explicitly keeps canonical URLs, the sitemap and Open Graph tags correct in production.

### Environment variables required in production

| Variable | Value |
| --- | --- |
| `ADMIN_TOKEN` | A strong, unique secret. **The default is public knowledge.** |
| `NEXT_PUBLIC_SITE_URL` | `https://danid.vercel.app` |

### Other platforms

The application requires a Node.js runtime with a writable filesystem, so it suits any long-running Node host. On a platform with an ephemeral or read-only filesystem, point `PORTFOLIO_DATA_DIR` at a mounted volume, or accept that the store falls back to the temp directory and loses contact messages on restart.

### Pre-deployment checklist

- [ ] `ADMIN_TOKEN` set to a strong, unique secret
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production origin
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` is clean
- [ ] `npm run build` completes
- [ ] `data/` is not committed to version control
- [ ] `/admin` is unreachable without the token

---

## Security Notes

This section documents the security posture honestly, including its limitations.

**Change the admin token.** `ADMIN_TOKEN` falls back to the literal `daniel-degu-admin` when unset. That default exists so the console is reachable during local development, but it is public knowledge. Set a strong secret before deploying, or the console and every admin endpoint are open.

**Rate limiting is not a security boundary.** `rateLimit()` in `src/lib/validate.ts` is an in-memory sliding window. It prevents accidental double submits and casual form spam. It is per-process, resets on restart, and is trivially bypassed across distributed instances.

**Bot mitigation is defence in depth.** The contact endpoint combines a honeypot field, a minimum completion-time check, server-side validation and rate limiting. These raise the cost of naive automation. They are not a substitute for a CAPTCHA if the endpoint is targeted.

**Input handling.** All inbound text is sanitised: control characters are stripped, whitespace collapsed, and length capped before validation. Email addresses are normalised to lowercase and length-limited.

**Server-rendered HTML is escaped.** `escapeHtml()` in `src/lib/chrome.ts` escapes interpolated values before they are written into a document.

**Data retention.** The store records visitor IP addresses and user agents on contact submissions and outbound clicks. It is git-ignored, but it is still personal data on disk. A production deployment should define a retention window and a deletion path.

**Known limitations.** There is no CSRF protection beyond the fact that mutations are bearer-token authenticated; there is no structured audit log; and there is no automated test suite.

---

## Contributing

Contributions are welcome, particularly documentation, accessibility improvements and bug reports.

Before opening a pull request:

1. Run `npm run lint` and `npm run build`. Both must pass.
2. Run `npx tsc --noEmit`. It must be clean.
3. Keep changes focused. One concern per pull request.
4. Follow the existing code style: two-space indentation, no semicolons, single quotes, and JSDoc block comments on exported functions that explain intent rather than restate the signature.

### Adding content

Content belongs in `src/lib/site.ts`. Add a project, a skill or a timeline step there and it propagates to every surface that renders it: the pages, the JSON API and the sitemap.

### Adding a route

Add the path to `publicRoutes` in `src/lib/site.ts` so the sitemap stays correct.

### Style conventions

- Prefer named exports.
- Keep the shared chrome free of page-specific logic. If a page needs chrome behaviour, add an option rather than branching inside the builder.
- Do not add runtime dependencies for problems a few lines of TypeScript solve. The project deliberately carries no UI framework.

### Known gaps

Contributions addressing any of these are particularly welcome.

| Gap | Where |
| --- | --- |
| No automated test suite | Add a runner and cover `store.ts` and `validate.ts` first, as they hold the logic most worth protecting |
| No skip-to-content link | `buildHeader()` in `src/lib/chrome.ts` |
| Drawer does not trap focus | `public/portfolio.js` |
| Five unused dependencies | `package.json` |
| In-memory rate limiting | `src/lib/validate.ts` |

### Reporting bugs

Open an issue describing what you expected, what happened, the route, and the browser and viewport. Screenshots help.

---

## License

Released under the MIT License. See [LICENSE](LICENSE).

---

## Contact

- **Email** — danieldegu909@gmail.com
- **LinkedIn** — https://www.linkedin.com/in/daniel-degu-0a086b3b3
- **GitHub** — https://github.com/Dan12-dev-ai
- **Telegram** — https://t.me/DDDan21
- **Website** — https://danid.vercel.app

Built by [Daniel Degu](https://github.com/Dan12-dev-ai).

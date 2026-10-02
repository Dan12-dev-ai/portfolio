import type { Metadata } from 'next'
import Script from 'next/script'
import { profile, socials } from '@/lib/site'
import { buildFooter, buildHeader, RUNTIME_MARKUP } from '@/lib/chrome'
import './experience.css'
import CapabilitiesSection from './_components/CapabilitiesSection'
import CareerTimelineSection from './_components/CareerTimelineSection'
import CtaSection from './_components/CtaSection'
import ExpertiseSection from './_components/ExpertiseSection'
import ExperienceShell from './_components/ExperienceShell'
import HeroSection from './_components/HeroSection'
import PrinciplesSection from './_components/PrinciplesSection'

/**
 * Experience page (`/experience`).
 *
 * A first-class App Router page whose sections share the light (white) design
 * system defined in `experience.css` — glassmorphic surfaces, indigo → cyan
 * accent, reveal-on-scroll. The header and footer come from the canonical site
 * chrome (`buildHeader`/`buildFooter` in `src/lib/chrome.ts`): the exact
 * markup the HTML-served pages receive, so the navigation, its fixed position
 * and the footer match the rest of the site — only `/resume` keeps its own
 * chrome. `portfolio.css`/`portfolio.js` power the shared drawer, progress
 * bar, anchor offset, status pill and copy helpers.
 */

export const metadata: Metadata = {
  title: 'Experience',
  description:
    'Engineering experience across DEDAN AI and the Bahir Dar Development Center: AI systems, multi-agent orchestration, distributed backends and observability.',
  robots: { index: true, follow: true },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  jobTitle: profile.role,
  description: profile.shortBio,
  url: '/experience',
  image: profile.logo,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bahir Dar',
    addressCountry: 'ET',
  },
  sameAs: socials.map((social) => social.url),
  knowsAbout: [
    'AI orchestration',
    'Multi-agent systems',
    'LangGraph',
    'FastAPI',
    'Distributed systems',
    'LLM evaluation',
  ],
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': '/experience',
    name: `Experience — ${profile.name}`,
  },
}

export default function ExperiencePage() {
  return (
    <ExperienceShell>
      {/* This page renders the canonical chrome, so it loads the exact same font
          and stylesheet assets the HTML-served pages inject in `src/lib/chrome.ts`
          (`HEAD_ASSETS`). Importing them instead would pull the stylesheet into
          this route's CSS bundle and duplicate the bytes it already fetches from
          `/public`, so the two warnings below are the intended trade-off.
          (`/resume` intentionally keeps its own chrome and does not load them.) */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/no-css-tags */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
        rel="stylesheet"
      />
      {/* Shared chrome styles: fixed header, footer, drawer, toasts, to-top. */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/portfolio.css" />

      <div
        dangerouslySetInnerHTML={{
          __html: buildHeader({ active: 'experience', variant: 'light' }),
        }}
      />
      <main className="flex-1">
        <HeroSection />
        <ExpertiseSection />
        <CapabilitiesSection />
        <CareerTimelineSection />
        <PrinciplesSection />
        <CtaSection />
      </main>
      <div
        dangerouslySetInnerHTML={{
          __html: buildFooter({ active: 'experience', variant: 'light' }),
        }}
      />
      <div dangerouslySetInnerHTML={{ __html: RUNTIME_MARKUP }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Drawer, progress bar, anchor offset, status pill, copy toasts. */}
      <Script src="/portfolio.js" strategy="afterInteractive" />
    </ExperienceShell>
  )
}
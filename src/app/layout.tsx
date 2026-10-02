import './globals.css'
import type { Metadata } from 'next'
import { Geist, IBM_Plex_Mono, JetBrains_Mono } from 'next/font/google'

/**
 * Note: the layout intentionally avoids direct Google <link> injection because
 * App Router builds are safer when fonts are managed through Next's font loader.
 */
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '')

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: 'Daniel Degu — AI & Distributed Systems Engineer',
    template: '%s — Daniel Degu',
  },
  description:
    'Personal portfolio of Daniel Degu — AI & Distributed Systems Engineer building deterministic multi-agent systems and distributed backends.',
  keywords: ['AI Engineering', 'Distributed Systems', 'AI Automation', 'Multi-Agent Orchestration', 'Machine Learning', 'Web Development', 'Portfolio'],
  authors: [{ name: 'Daniel Degu' }],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Daniel Degu — AI & Distributed Systems Engineer',
    description: 'Personal portfolio of Daniel Degu — AI & Distributed Systems Engineer',
    type: 'website',
    locale: 'en_US',
    images: [
      { url: '/og.png', width: 1200, height: 630, alt: 'Daniel Degu — AI & Distributed Systems Engineer' },
      { url: '/og.svg', width: 1200, height: 630, alt: 'Daniel Degu — portfolio' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daniel Degu — AI & Distributed Systems Engineer',
    description: 'Personal portfolio of Daniel Degu — AI & Distributed Systems Engineer',
    images: ['/og.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable} ${ibmPlexMono.variable} scroll-smooth`}>
      <body>{children}</body>
    </html>
  )
}

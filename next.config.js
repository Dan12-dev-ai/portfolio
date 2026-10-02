/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },

  /**
   * The page documents under `src/*.html` are read at request time with
   * `fs.readFileSync` (see `src/lib/pages.ts`). Node's file tracing cannot see
   * that dynamic read, so Vercel does not copy the documents into the serverless
   * bundle and the route silently falls back to an empty `<body>` — the header
   * and footer render but the page content does not. Including them explicitly
   * keeps the trace in sync with the runtime access.
   */
  outputFileTracingIncludes: {
    '/**': ['./src/**/*.html'],
  },
}

module.exports = nextConfig

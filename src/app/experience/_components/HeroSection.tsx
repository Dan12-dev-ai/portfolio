import Link from 'next/link'
import Reveal from './Reveal'
import { ArrowRight } from './icons'

const metaPills = ['AI Systems', 'Distributed Infrastructure']

/**
 * Hero stage: eyebrow, headline, supporting copy, meta pills, CTAs and the
 * theme-aware architecture diagram (evaluation → observability →
 * orchestration → reliability).
 */
export default function HeroSection() {
  return (
    <section className="relative" aria-labelledby="hero-title">
      <div className="exp-container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <Reveal>
          <p className="exp-eyebrow font-mono text-xs uppercase tracking-widest text-indigo-400">
            Experience / 01
          </p>
          <h1
            id="hero-title"
            className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Building systems that remain clear under pressure.
          </h1>
          <p className="exp-muted mt-6 max-w-xl text-lg leading-relaxed">
            I design AI platforms, distributed services, and agentic workflows that are
            measurable, resilient, and ready for production.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {metaPills.map((pill) => (
              <span
                key={pill}
                className="exp-skill rounded-md border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs text-slate-300"
              >
                {pill}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            {/* Plain anchor (not next/link): the shared chrome runtime owns in-page
                anchor scrolling and offsets it for the fixed header. */}
            <a
              href="#timeline"
              className="exp-btn group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.98]"
            >
              <span className="relative z-10">View career timeline</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <Link
              href="/resume"
              className="exp-link group inline-flex items-center gap-1.5 text-sm font-medium"
            >
              Download résumé
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="exp-glass relative rounded-2xl p-6 md:p-8">
            <svg
              viewBox="0 0 420 360"
              fill="none"
              className="h-auto w-full"
              role="img"
              aria-label="System architecture diagram connecting evaluation, observability, orchestration and reliability"
            >
              <defs>
                <linearGradient id="expVizAccent" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <filter id="expVizShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#020617" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* frame */}
              <rect x="0.5" y="0.5" width="419" height="359" rx="20" className="exp-viz-frame" />

              {/* dashed progression */}
              <line
                x1="40"
                y1="300"
                x2="380"
                y2="60"
                stroke="url(#expVizAccent)"
                strokeOpacity="0.4"
                strokeWidth="2"
                strokeDasharray="6 8"
              />

              {/* nodes */}
              <circle cx="80" cy="260" r="9" fill="url(#expVizAccent)" />
              <circle cx="160" cy="200" r="6" className="exp-viz-dot" />
              <circle cx="260" cy="140" r="11" fill="url(#expVizAccent)" />
              <circle cx="340" cy="90" r="6" className="exp-viz-dot" />

              {/* labels */}
              <text x="98" y="264" className="exp-viz-label">EVALUATION</text>
              <text x="178" y="204" className="exp-viz-label">OBSERVABILITY</text>
              <text x="280" y="144" className="exp-viz-label">ORCHESTRATION</text>
              <text x="330" y="76" textAnchor="end" className="exp-viz-label">RELIABILITY</text>

              {/* floating status card (top-left keeps every node visible) */}
              <g filter="url(#expVizShadow)">
                <rect x="20" y="20" width="152" height="58" rx="12" className="exp-viz-card" />
              </g>
              <text x="38" y="44" className="exp-viz-kicker">SYSTEMS</text>
              <text x="38" y="65" className="exp-viz-value">OPERATIONAL</text>

              {/* animated signal line */}
              <path
                d="M40 300 C 120 240, 220 180, 340 100"
                stroke="#22d3ee"
                strokeWidth="2"
                fill="none"
                strokeOpacity="0.12"
              >
                <animate
                  attributeName="stroke-opacity"
                  values="0.08;0.55;0.08"
                  dur="5s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
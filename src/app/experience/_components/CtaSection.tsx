import Link from 'next/link'
import Reveal from './Reveal'
import { ArrowRight } from './icons'

/** Closing call-to-action band with the gradient shimmer button. */
export default function CtaSection() {
  return (
    <section id="closing" className="py-16 md:py-24" aria-labelledby="cta-title">
      <div className="exp-container">
        <Reveal className="exp-glass exp-cta rounded-2xl p-8 md:p-12">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="exp-eyebrow font-mono text-xs uppercase tracking-widest text-indigo-400">
                Start a conversation
              </p>
              <h2 id="cta-title" className="mt-4 text-3xl font-extrabold tracking-tight">
                Building a system that needs to hold up in the real world?
              </h2>
              <p className="exp-muted mt-3 max-w-2xl leading-relaxed">
                Let’s talk about the architecture, the constraints, and the path from idea to
                dependable production.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-4">
              <Link
                href="/contact"
                className="exp-btn group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.98]"
              >
                <span className="relative z-10">Get in touch</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/resume"
                className="exp-link group inline-flex items-center gap-1.5 text-sm font-medium"
              >
                View résumé
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
import { experience } from '@/lib/site'
import Reveal from './Reveal'

/**
 * Career track: a connected vertical timeline built from the canonical
 * experience entries in `src/lib/site.ts`.
 *
 * Each node is a full milestone card — date pill, org, role, summary,
 * chevron highlights and stack pills — which consolidates the two blocks the
 * old page rendered separately (a compact rail + duplicated case cards) into
 * a single source of truth per role. The first node marks the current role
 * with a glowing gradient dot.
 */
export default function CareerTimelineSection() {
  return (
    <section id="timeline" className="py-16 md:py-24" aria-labelledby="timeline-title">
      <div className="exp-container">
        <Reveal>
          <p className="exp-eyebrow font-mono text-xs uppercase tracking-widest text-indigo-400">
            Career track / 04
          </p>
          <h2 id="timeline-title" className="mt-4 text-3xl font-extrabold tracking-tight">
            Engineering roles built around real systems.
          </h2>
          <p className="exp-muted mt-4 max-w-3xl leading-relaxed">
            A vertical timeline of roles and outcomes. Each entry shows the role, a concise
            summary and outcome-focused highlights.
          </p>
        </Reveal>

        <div className="exp-timeline mt-12">
          {experience.map((entry, index) => (
            <Reveal
              key={`${entry.org}-${entry.period}`}
              delay={index * 90}
              className="exp-timeline-item"
            >
              <span
                className={`exp-node${index === 0 ? ' exp-node--active' : ''}`}
                aria-hidden="true"
              />
              <article className="exp-glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/50 hover:shadow-lg md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
                    {entry.period}
                  </span>
                  <span className="exp-eyebrow font-mono text-xs uppercase tracking-widest text-indigo-400">
                    {entry.track}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold tracking-tight">{entry.org}</h3>
                <p className="mt-1 text-sm font-medium">{entry.role}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-indigo-400/80">
                  {entry.location}
                </p>

                <p className="exp-muted mt-4 leading-relaxed">{entry.summary}</p>

                <ul className="exp-chevron-list exp-muted mt-5 text-sm leading-relaxed">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap gap-2">
                  {entry.stack.map((tech) => (
                    <span
                      key={tech}
                      className="exp-skill rounded-md border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs text-slate-300 transition hover:shadow-[0_0_12px_-2px_rgba(99,102,241,0.65)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
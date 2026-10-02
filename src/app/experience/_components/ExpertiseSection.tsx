import Reveal from './Reveal'

const expertise = [
  {
    step: '01',
    title: 'Multi-agent orchestration',
    description:
      'Designing deterministic execution paths for autonomous systems, with explicit tools, recoverable state, and controlled coordination.',
    tags: ['Agent workflows', 'Deterministic execution', 'State handling'],
  },
  {
    step: '02',
    title: 'Distributed systems',
    description:
      'Building services and infrastructure with resilient boundaries, clear contracts, and predictable failure behavior.',
    tags: ['Async services', 'Data contracts', 'Fault tolerance'],
  },
  {
    step: '03',
    title: 'Observability & evaluation',
    description:
      'Making system behavior measurable through traces, SLOs, evaluation loops, and operational feedback.',
    tags: ['OpenTelemetry', 'SLOs', 'LLM evaluation'],
  },
  {
    step: '04',
    title: 'Production AI infrastructure',
    description:
      'Connecting models, services, and product workflows into reliable production systems.',
    tags: ['LLM integrations', 'ML infrastructure', 'Platform engineering'],
  },
]

/** Core expertise: four glassmorphic cards with pill badges. */
export default function ExpertiseSection() {
  return (
    <section id="expertise" className="py-16 md:py-20" aria-labelledby="expertise-title">
      <div className="exp-container">
        <Reveal>
          <p className="exp-eyebrow font-mono text-xs uppercase tracking-widest text-indigo-400">
            Core expertise / 02
          </p>
          <h2 id="expertise-title" className="mt-4 text-3xl font-extrabold tracking-tight">
            Systems designed for clarity, recovery, and scale.
          </h2>
          <p className="exp-muted mt-4 max-w-3xl leading-relaxed">
            From agent orchestration to distributed backends, I focus on systems that remain
            understandable when complexity increases.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {expertise.map((item) => (
            <Reveal
              key={item.step}
              className="exp-glass flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/50 hover:shadow-lg"
            >
              <div>
                <p className="exp-eyebrow font-mono text-xs uppercase tracking-widest text-indigo-400">
                  {item.step}
                </p>
                <h3 className="mt-3 text-lg font-bold tracking-tight">{item.title}</h3>
                <p className="exp-muted mt-3 text-sm leading-relaxed">{item.description}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="exp-skill rounded-md border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs text-slate-300 transition hover:shadow-[0_0_12px_-2px_rgba(99,102,241,0.65)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
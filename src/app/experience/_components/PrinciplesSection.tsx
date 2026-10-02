import Reveal from './Reveal'

const principles = [
  {
    step: '01',
    title: 'Make behavior observable',
    detail:
      'Design tracing, metrics and evaluation so every run is auditable and every regression diagnosable.',
  },
  {
    step: '02',
    title: 'Design for recovery',
    detail:
      'Plan for partial failure, bounded retries and clear recovery paths that maintain user trust.',
  },
  {
    step: '03',
    title: 'Prefer explicit boundaries',
    detail:
      'Make interfaces typed and governed so behavior cannot silently leak across services.',
  },
  {
    step: '04',
    title: 'Optimize for operational trust',
    detail:
      'Engineer for predictable behavior, clear SLAs and continuous evaluation in production.',
  },
]

/** Operating principles: refined 2×2 grid with gradient corner accents. */
export default function PrinciplesSection() {
  return (
    <section id="principles" className="py-16 md:py-20" aria-labelledby="principles-title">
      <div className="exp-container">
        <Reveal>
          <p className="exp-eyebrow font-mono text-xs uppercase tracking-widest text-indigo-400">
            Operating principles / 05
          </p>
          <h2 id="principles-title" className="mt-4 text-3xl font-extrabold tracking-tight">
            Good systems make complexity easier to reason about.
          </h2>
          <p className="exp-muted mt-4 max-w-3xl leading-relaxed">
            Principles I apply across architecture, orchestration and platform delivery.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {principles.map((principle) => (
            <Reveal
              key={principle.step}
              className="exp-glass exp-corner rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/50 hover:shadow-lg md:p-8"
            >
              <p className="exp-eyebrow relative z-10 font-mono text-xs uppercase tracking-widest text-indigo-400">
                {principle.step}
              </p>
              <h3 className="relative z-10 mt-3 text-lg font-bold tracking-tight">
                {principle.title}
              </h3>
              <p className="exp-muted relative z-10 mt-3 text-sm leading-relaxed">
                {principle.detail}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
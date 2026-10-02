import Reveal from './Reveal'

const capabilities = [
  {
    step: '01',
    name: 'Agent orchestration',
    detail:
      'Structured workflows for recoverable autonomous execution. — Agent workflows, explicit retries.',
    tag: 'LangGraph · Workflows',
  },
  {
    step: '02',
    name: 'Platform engineering',
    detail: 'Backends and APIs with clear contracts and observable behavior.',
    tag: 'FastAPI · Async',
  },
  {
    step: '03',
    name: 'Reliability design',
    detail:
      'Systems designed around failure modes, recovery paths, and measurable service quality.',
    tag: 'SLOs · Chaos',
  },
  {
    step: '04',
    name: 'AI evaluation',
    detail: 'Evaluation pipelines that connect model behavior to production outcomes.',
    tag: 'Eval pipelines · Traces',
  },
  {
    step: '05',
    name: 'Developer experience',
    detail: 'Interfaces and tooling that make complex systems easier to operate.',
    tag: 'Docs · Tooling',
  },
]

/** Engineering capabilities: numbered glass rows with a trailing stack pill. */
export default function CapabilitiesSection() {
  return (
    <section id="capabilities" className="py-16 md:py-20" aria-labelledby="capabilities-title">
      <div className="exp-container">
        <Reveal>
          <p className="exp-eyebrow font-mono text-xs uppercase tracking-widest text-indigo-400">
            Engineering capabilities / 03
          </p>
          <h2 id="capabilities-title" className="mt-4 text-3xl font-extrabold tracking-tight">
            Engineering capabilities
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-4">
          {capabilities.map((item) => (
            <Reveal
              key={item.step}
              className="exp-glass flex items-start gap-4 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/50 hover:shadow-lg md:gap-6"
            >
              <span className="exp-eyebrow shrink-0 pt-1 font-mono text-xs uppercase tracking-widest text-indigo-400">
                {item.step}
              </span>
              <div>
                <h3 className="text-base font-bold tracking-tight">{item.name}</h3>
                <p className="exp-muted mt-1.5 text-sm leading-relaxed">{item.detail}</p>
              </div>
              <span className="exp-skill ml-auto hidden shrink-0 rounded-md border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs text-slate-300 md:inline-block">
                {item.tag}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
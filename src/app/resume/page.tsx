import type { Metadata } from 'next'
import Link from 'next/link'
import { contactEmail, displayHandle, experience, profile, projects, services, skills, socials } from '@/lib/site'
import PrintButton from './PrintButton'

export const metadata: Metadata = {
  title: 'Résumé',
  description: `Print-ready CV for ${profile.name}, ${profile.role}. Multi-agent orchestration, LLM pipelines, distributed backends and observability.`,
  robots: { index: true, follow: true },
}

const printStyles = `
  @page { size: A4; margin: 14mm 12mm; }
  @media print {
    .no-print { display: none !important; }
    .resume-page { box-shadow: none !important; border: 0 !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }
    a { color: inherit !important; text-decoration: none !important; }
    .avoid-break { break-inside: avoid; }
  }
  .resume-page {
    font-family: 'Geist', 'Segoe UI', sans-serif;
  }
  .resume-heading {
    font-family: 'Geist', 'Segoe UI', sans-serif;
    letter-spacing: -0.05em;
  }
  .resume-section-title {
    font-family: 'Geist', 'Segoe UI', sans-serif;
    letter-spacing: 0.14em;
  }
  .resume-meta {
    font-family: 'IBM Plex Mono', 'JetBrains Mono', monospace;
    letter-spacing: 0.03em;
  }
`

export default function ResumePage() {
  const nonEmailSocials = socials.filter((social) => social.platform !== 'email')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_25%,#f8fafc_100%)] text-slate-900">
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      <div className="no-print border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Curriculum vitae</p>
            <h1 className="resume-heading text-lg font-semibold tracking-tight text-slate-900">
              {profile.name} — {profile.role}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              ← Back to portfolio
            </Link>
            <PrintButton />
          </div>
        </div>
      </div>

      <article className="resume-page mx-auto mt-8 max-w-5xl rounded-[24px] border border-slate-200 bg-white px-8 py-10 text-[13px] leading-relaxed shadow-[0_20px_50px_-32px_rgba(15,23,42,0.34)] sm:px-10">
        <header className="avoid-break border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.logoMark}
              alt={`${profile.name} — logo`}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-cover shadow-sm"
            />
            <div>
              <h1 className="resume-heading text-3xl font-semibold tracking-tight text-slate-900">{profile.name}</h1>
              <p className="mt-1 text-base font-semibold text-cyan-700">{profile.role}</p>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-slate-700">{profile.shortBio}</p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <li>✉ {contactEmail}</li>
            <li>⌖ {profile.location}</li>
            <li>◷ {profile.timezone}</li>
            {nonEmailSocials.map((social) => (
              <li key={social.platform}>
                {social.label}: <span className="text-slate-800">{displayHandle(social)}</span>
              </li>
            ))}
          </ul>
        </header>

        <section className="avoid-break mt-6">
          <h2 className="resume-section-title border-b border-slate-200 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Profile</h2>
          <div className="mt-3 space-y-2 text-slate-700">
            {profile.longBio.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="avoid-break mt-6">
          <h2 className="resume-section-title border-b border-slate-200 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Experience</h2>
          <div className="mt-3 space-y-4">
            {experience.map((entry) => (
              <div key={entry.org} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {entry.org} — <span className="font-semibold text-slate-700">{entry.role}</span>
                  </h3>
                  <span className="resume-meta text-[11px] font-medium text-slate-500">{entry.period}</span>
                </div>
                <p className="resume-meta mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  {entry.track} · {entry.location}
                </p>
                <p className="mt-1 text-slate-700">{entry.summary}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-700">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px] text-slate-500">Stack: {entry.stack.join(' · ')}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="avoid-break mt-6">
          <h2 className="resume-section-title border-b border-slate-200 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Signature systems</h2>
          <div className="mt-3 space-y-3">
            {projects.map((project) => (
              <div key={project.slug} className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{project.title}</h3>
                  <span className="resume-meta text-[11px] font-medium text-slate-500">{project.category} · {project.status}</span>
                </div>
                <p className="text-slate-700">{project.summary}</p>
                <p className="mt-1 text-[11px] text-slate-500">Stack: {project.stack.join(' · ')}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="avoid-break mt-6">
          <h2 className="resume-section-title border-b border-slate-200 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Capabilities</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {services.map((service) => (
              <div key={service.key} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <h3 className="text-[13px] font-semibold text-slate-900">{service.title}</h3>
                <p className="text-slate-700">{service.summary}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Deliverables: {service.deliverables.join(' · ')}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="avoid-break mt-6">
          <h2 className="resume-section-title border-b border-slate-200 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Technical skills</h2>
          <div className="mt-3 space-y-1.5">
            {skills.map((group) => (
              <p key={group.category} className="text-slate-700">
                <span className="font-semibold text-slate-900">{group.category}:</span> {group.items.join(' · ')}
              </p>
            ))}
          </div>
        </section>

        <section className="avoid-break mt-6">
          <h2 className="resume-section-title border-b border-slate-200 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Engagement &amp; logistics</h2>
          <ul className="mt-3 grid grid-cols-1 gap-1 text-slate-700 sm:grid-cols-2">
            <li><span className="font-semibold text-slate-900">Availability:</span> {profile.availability}</li>
            <li><span className="font-semibold text-slate-900">Response SLA:</span> {profile.responseSla}</li>
            <li><span className="font-semibold text-slate-900">Work mode:</span> {profile.workMode}</li>
            <li><span className="font-semibold text-slate-900">Languages:</span> {profile.languages.join(' · ')}</li>
          </ul>
        </section>

        <footer className="no-print mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <span>
            Rendered live from the portfolio data layer · <Link className="text-cyan-700" href="/api/profile">/api/profile</Link>
          </span>
          <span>
            <Link className="text-cyan-700" href="/contact">Open a channel</Link>
          </span>
        </footer>
      </article>
    </div>
  )
}

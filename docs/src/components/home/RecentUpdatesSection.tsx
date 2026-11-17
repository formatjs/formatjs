import * as React from 'react'

export default function RecentUpdatesSection(): React.ReactNode {
  return (
    <section
      id="updates"
      aria-labelledby="updates-title"
      className="px-[clamp(20px,2.2vw,32px)] pt-24 sm:pt-28"
    >
      <div className="mx-auto max-w-[1320px]">
        <h2
          id="updates-title"
          className="m-0 text-sm font-medium tracking-wide text-home-muted"
        >
          Recent updates
        </h2>
        <article className="mt-4 grid gap-5 border-l-4 border-primary bg-home-surface p-5 sm:p-7 lg:grid-cols-[180px_1fr] lg:gap-10">
          <div className="flex items-center gap-3 text-sm lg:flex-col lg:items-start lg:gap-2">
            <span className="font-medium text-home-ink">New release</span>
            <time dateTime="2026-11-17" className="text-home-muted">
              November 17, 2026
            </time>
          </div>
          <div>
            <h3 className="m-0 text-[clamp(1.5rem,1.1rem+1.5vw,2.25rem)] leading-tight font-bold tracking-tight">
              Temporal 1.0, in TypeScript and Rust.
            </h3>
            <p className="mt-3 mb-0 max-w-[760px] text-base leading-relaxed text-home-muted">
              Dates, times, calendars, and time zones. Use the TypeScript
              polyfill on the web or Hermes, or the Rust core in native apps.
              Checked with Test262 and independent ICU oracles.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-base font-medium">
              <a
                href="/docs/polyfills/temporal"
                className="underline decoration-primary decoration-2 underline-offset-4 hover:text-home-muted"
              >
                TypeScript guide
              </a>
              <a
                href="/docs/rust/temporal"
                className="underline decoration-primary decoration-2 underline-offset-4 hover:text-home-muted"
              >
                Rust guide
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

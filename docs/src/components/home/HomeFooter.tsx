import * as React from 'react'
import {FormattedDate, FormattedTime, IntlProvider} from 'react-intl'

const DOCS = [
  {href: '/docs/getting-started/installation', label: 'Installation'},
  {href: '/docs/core-concepts/icu-syntax', label: 'ICU message syntax'},
  {href: '/docs/react-intl', label: 'react-intl'},
  {href: '/docs/polyfills', label: 'Polyfills'},
  {href: '/docs/tooling/cli', label: 'CLI'},
  {href: '/docs/rust', label: 'Rust'},
]

const tile = 'flex flex-col bg-home-surface p-5 lg:min-h-[220px] lg:p-6'

// Locale and time only exist in the browser, so render them after mount to
// keep the prerendered HTML identical to the first client render.
function BrowserClock(): React.ReactNode {
  const [now, setNow] = React.useState<Date | null>(null)
  const [locale, setLocale] = React.useState('en')

  React.useEffect(() => {
    setLocale(navigator.language || 'en')
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <IntlProvider locale={locale} defaultLocale="en">
      <p className="m-0 text-sm text-home-muted">Your browser, formatted</p>
      <p className="m-0 text-2xl tabular-nums">{now ? locale : '\u00a0'}</p>
      <p className="m-0 text-2xl tabular-nums">
        {now ? (
          <FormattedTime
            value={now}
            hour="numeric"
            minute="2-digit"
            second="2-digit"
          />
        ) : (
          '—'
        )}
      </p>
      <p className="m-0 mt-auto text-sm text-home-muted">
        {now ? (
          <FormattedDate
            value={now}
            weekday="long"
            day="numeric"
            month="long"
            year="numeric"
          />
        ) : (
          '—'
        )}
      </p>
    </IntlProvider>
  )
}

export default function HomeFooter(): React.ReactNode {
  return (
    <footer
      aria-labelledby="foot-title"
      className="grid grid-cols-2 gap-1.5 p-1.5 sm:grid-cols-12 sm:gap-2 sm:p-2.5"
    >
      <div
        data-reveal
        className={`${tile} order-6 col-span-2 justify-between gap-5 sm:order-none sm:col-span-6 lg:col-span-4`}
      >
        <h2 className="sr-only" id="foot-title">
          About FormatJS
        </h2>
        <p className="m-0 text-2xl leading-[1.3]">
          Open source since 2014 and maintained by people who also help write{' '}
          <span className="whitespace-nowrap">ECMA-402</span>.
        </p>
        <p className="m-0 text-sm text-home-muted">
          BSD-3-Clause. Photographs: “Rosetta Stone – front face – corrected
          image” by Awikimate,{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">
            CC BY-SA 4.0
          </a>
          , via{' '}
          <a href="https://commons.wikimedia.org/w/index.php?curid=84378499">
            Wikimedia Commons
          </a>
          ; “Greek Script from Rosetta Stone” by Gary Todd,{' '}
          <a href="https://commons.wikimedia.org/w/index.php?curid=109158771">
            CC0
          </a>
          .
        </p>
      </div>
      <nav
        data-reveal
        style={{'--d': '60ms'} as React.CSSProperties}
        aria-label="Documentation"
        className={`${tile} order-3 col-span-1 sm:order-none sm:col-span-6 lg:col-span-3`}
      >
        <ul className="m-0 grid list-none gap-1.5 p-0">
          {DOCS.map(link => (
            <li key={link.href}>
              <a href={link.href} className="no-underline hover:underline">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div
        data-reveal
        style={{'--d': '120ms'} as React.CSSProperties}
        className={`${tile} order-5 col-span-2 gap-0.5 sm:order-none sm:col-span-6 lg:col-span-2`}
      >
        <BrowserClock />
      </div>
      <div
        data-reveal
        style={{'--d': '180ms'} as React.CSSProperties}
        className={`${tile} order-4 col-span-1 justify-between gap-4 sm:order-none sm:col-span-6 lg:col-span-3`}
      >
        <p className="m-0 text-sm text-home-muted">
          Questions, bugs, proposals
        </p>
        <a
          href="https://github.com/formatjs/formatjs/discussions"
          className="text-lg sm:text-2xl"
        >
          GitHub Discussions
        </a>
      </div>
      <div className="order-1 col-span-2 flex min-h-40 items-center justify-center overflow-hidden bg-home-ink text-home-bg sm:order-none sm:col-span-12 sm:min-h-[320px] lg:col-span-8">
        <span className="pt-[.06em] text-[15vw] leading-none font-bold tracking-[-0.04em] uppercase lg:text-[9vw]">
          FormatJS
        </span>
      </div>
      <a
        href="/docs/getting-started/installation"
        className="group order-2 col-span-2 flex min-h-40 flex-col justify-between bg-primary p-5 text-white no-underline transition-colors hover:bg-brand-hover sm:order-none sm:col-span-12 sm:min-h-[200px] lg:col-span-4 lg:min-h-[320px] lg:p-6"
      >
        <span className="text-2xl font-medium">Read the docs</span>
        <svg
          viewBox="0 0 64 64"
          width="64"
          height="64"
          aria-hidden="true"
          className="self-end transition-transform duration-300 group-hover:translate-x-1.5 group-hover:-translate-y-1.5"
        >
          <path
            d="M12 52 52 12M22 12h30v30"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
        </svg>
      </a>
    </footer>
  )
}

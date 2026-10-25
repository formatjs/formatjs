import * as React from 'react'
import downloadStats from './library-downloads.json'

const downloadCounts: Record<string, number> = downloadStats.downloads
const compactNumber = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const fullNumber = new Intl.NumberFormat('en')

type Library = {name: string; note: string; href: string}

const npm = (name: string): string => `https://www.npmjs.com/package/${name}`
const crate = (name: string): string => `https://crates.io/crates/${name}`

const GROUPS: {id: string; name: string; docs: string; items: Library[]}[] = [
  {
    id: 'react',
    name: 'React',
    docs: '/docs/react-intl',
    items: [
      {
        name: 'react-intl',
        note: 'Components and hooks for React and React Native',
        href: npm('react-intl'),
      },
      {
        name: '@formatjs/intl',
        note: 'The framework-agnostic core that react-intl is built on',
        href: npm('@formatjs/intl'),
      },
      {
        name: 'eslint-plugin-formatjs',
        note: 'Lint rules for message syntax, placeholders and IDs',
        href: npm('eslint-plugin-formatjs'),
      },
    ],
  },
  {
    id: 'vue',
    name: 'Vue & Svelte',
    docs: '/docs/vue-intl',
    items: [
      {
        name: 'vue-intl',
        note: 'FormatJS bindings for Vue',
        href: npm('vue-intl'),
      },
      {
        name: '@formatjs/svelte-intl',
        note: 'FormatJS bindings for Svelte',
        href: npm('@formatjs/svelte-intl'),
      },
    ],
  },
  {
    id: 'core',
    name: 'Core',
    docs: '/docs/intl-messageformat',
    items: [
      {
        name: 'intl-messageformat',
        note: 'Formats ICU messages: plurals, selects, dates, numbers, rich text',
        href: npm('intl-messageformat'),
      },
      {
        name: '@formatjs/icu-messageformat-parser',
        note: 'Parses ICU MessageFormat into a typed AST',
        href: npm('@formatjs/icu-messageformat-parser'),
      },
      {
        name: '@formatjs/icu-skeleton-parser',
        note: 'Parses ICU number and date skeletons',
        href: npm('@formatjs/icu-skeleton-parser'),
      },
      {
        name: '@formatjs/intl-localematcher',
        note: 'Locale negotiation, as specified by ECMA-402',
        href: npm('@formatjs/intl-localematcher'),
      },
    ],
  },
  {
    id: 'polyfills',
    name: 'Polyfills',
    docs: '/docs/polyfills',
    items: [
      {
        name: '@formatjs/intl-numberformat',
        note: 'Intl.NumberFormat with units, compact and currency',
        href: npm('@formatjs/intl-numberformat'),
      },
      {
        name: '@formatjs/intl-datetimeformat',
        note: 'Intl.DateTimeFormat with time zones and calendars',
        href: npm('@formatjs/intl-datetimeformat'),
      },
      {
        name: '@formatjs/intl-pluralrules',
        note: 'Intl.PluralRules from CLDR data',
        href: npm('@formatjs/intl-pluralrules'),
      },
      {
        name: '@formatjs/intl-locale',
        note: 'Intl.Locale',
        href: npm('@formatjs/intl-locale'),
      },
      {
        name: '@formatjs/intl-durationformat',
        note: 'Intl.DurationFormat',
        href: npm('@formatjs/intl-durationformat'),
      },
      {
        name: '@formatjs/intl-segmenter',
        note: 'Intl.Segmenter for graphemes, words and sentences',
        href: npm('@formatjs/intl-segmenter'),
      },
    ],
  },
  {
    id: 'tooling',
    name: 'Tooling',
    docs: '/docs/tooling/cli',
    items: [
      {
        name: '@formatjs/cli',
        note: 'Extract, compile and verify message catalogs',
        href: npm('@formatjs/cli'),
      },
      {
        name: '@formatjs/ts-transformer',
        note: 'TypeScript transformer that injects IDs and pre-parses messages',
        href: npm('@formatjs/ts-transformer'),
      },
      {
        name: 'babel-plugin-formatjs',
        note: 'The same compile step for Babel',
        href: npm('babel-plugin-formatjs'),
      },
      {
        name: '@formatjs/unplugin',
        note: 'One plugin for Vite, webpack, Rollup, esbuild, Rspack and Rsbuild',
        href: npm('@formatjs/unplugin'),
      },
    ],
  },
  {
    id: 'rust',
    name: 'Rust & Python',
    docs: '/docs/rust',
    items: [
      {
        name: 'formatjs_intl',
        note: 'Catalogs, locale negotiation and caching for Rust backends',
        href: crate('formatjs_intl'),
      },
      {
        name: 'formatjs_icu_messageformat',
        note: 'ICU MessageFormat formatting on ICU4X',
        href: crate('formatjs_icu_messageformat'),
      },
      {
        name: 'formatjs_icu_messageformat_parser',
        note: 'The parser, as a strongly typed Rust AST',
        href: crate('formatjs_icu_messageformat_parser'),
      },
      {
        name: 'py_intl',
        note: 'Python bindings to the Rust runtime',
        href: 'https://pypi.org/project/py_intl/',
      },
    ],
  },
]

const registry = (href: string): string =>
  href.includes('crates.io')
    ? 'crates.io'
    : href.includes('pypi')
      ? 'PyPI'
      : 'npm'

const band =
  'grid min-h-[76px] items-center gap-1 p-4 no-underline transition-[background-color,transform] duration-200 hover:translate-x-1 sm:grid-cols-[1fr_auto] sm:gap-6 sm:py-3 sm:pr-6 sm:pl-5'

export default function LibrariesSection(): React.ReactNode {
  const [selected, setSelected] = React.useState(GROUPS[0].id)
  const tabs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const group = GROUPS.find(g => g.id === selected) ?? GROUPS[0]

  const onKeyDown = (e: React.KeyboardEvent, index: number): void => {
    const delta = (
      {ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1} as Record<
        string,
        number
      >
    )[e.key]
    if (!delta) {
      return
    }
    e.preventDefault()
    const next = GROUPS[(index + delta + GROUPS.length) % GROUPS.length]
    setSelected(next.id)
    tabs.current[next.id]?.focus()
  }

  return (
    <section
      id="libraries"
      aria-labelledby="libs-title"
      className="px-[clamp(20px,2.2vw,32px)] pt-[140px] pb-[100px] sm:pt-[200px] sm:pb-[120px]"
    >
      <div className="flex flex-col items-stretch justify-between gap-8 sm:flex-row sm:items-end">
        <h2
          id="libs-title"
          data-reveal
          className="m-0 text-[clamp(2rem,1.3rem+3.2vw,4rem)] leading-[1.02] font-bold tracking-[-0.025em]"
        >
          <span className="text-home-muted">Pick your stack.</span>
          <br />
          The libraries follow.
        </h2>
        <a
          href="/docs/getting-started/installation"
          className="inline-flex min-h-12 items-center justify-center bg-primary px-5 font-medium text-white no-underline transition-colors hover:bg-brand-hover"
        >
          Read the docs
        </a>
      </div>

      <div
        data-reveal
        style={{'--d': '120ms'} as React.CSSProperties}
        className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-[170px_1fr] sm:gap-7"
      >
        <div
          role="tablist"
          aria-label="Library groups"
          aria-orientation="vertical"
          className="sticky top-0 z-[2] grid grid-cols-3 content-start gap-1.5 bg-home-bg py-2 sm:static sm:grid-cols-1 sm:py-0"
        >
          {GROUPS.map((g, i) => {
            const on = g.id === selected
            return (
              <button
                key={g.id}
                ref={el => {
                  tabs.current[g.id] = el
                }}
                id={`tab-${g.id}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="library-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => setSelected(g.id)}
                onKeyDown={e => onKeyDown(e, i)}
                className={`grid min-h-14 cursor-pointer gap-0.5 px-2.5 py-2 text-left transition-[background-color,transform] duration-200 active:scale-[0.98] sm:min-h-16 sm:px-4 sm:py-2.5 ${on ? 'bg-home-ink text-home-bg' : 'bg-home-surface hover:bg-home-raised'}`}
              >
                <b className="font-medium">{g.name}</b>
                <small
                  className={`text-sm ${on ? 'text-[#444]' : 'text-home-muted'}`}
                >
                  {g.items.length} packages
                </small>
              </button>
            )
          })}
        </div>

        <div
          id="library-panel"
          role="tabpanel"
          aria-labelledby={`tab-${group.id}`}
          className="grid content-start gap-1"
        >
          <p className="m-0 pb-3 text-sm text-home-muted">
            Downloads · last 30 days ({downloadStats.start}–{downloadStats.end})
          </p>
          {group.items.map((item, i) => (
            <a
              key={`${group.id}-${item.name}`}
              href={item.href}
              aria-label={`${item.name}: ${item.note}. ${fullNumber.format(downloadCounts[item.name])} downloads in the last 30 days on ${registry(item.href)}.`}
              style={{'--i': i} as React.CSSProperties}
              className={`home-pane-in ${band} ${i % 2 ? 'bg-home-band' : 'bg-home-surface'} hover:bg-home-raised`}
            >
              <span>
                <span className="font-medium break-words">{item.name}</span>
                <span className="block text-sm text-home-muted">
                  {item.note}
                </span>
              </span>
              <span
                className="text-sm text-home-muted sm:text-right"
                title={`${fullNumber.format(downloadCounts[item.name])} downloads in the last 30 days (${downloadStats.start}–${downloadStats.end})`}
              >
                <span className="block font-medium text-home-ink">
                  {compactNumber.format(downloadCounts[item.name])}
                  <span className="sr-only">
                    {' '}
                    downloads in the last 30 days
                  </span>
                </span>
                <span>{registry(item.href)}</span>
              </span>
            </a>
          ))}
          <a
            key={`${group.id}-docs`}
            href={group.docs}
            style={{'--i': group.items.length} as React.CSSProperties}
            className={`home-pane-in ${band} grid-cols-[1fr_auto] bg-primary text-white hover:bg-brand-hover`}
          >
            <span className="font-medium">Read the {group.name} guide</span>
            <span aria-hidden="true" className="text-2xl">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}

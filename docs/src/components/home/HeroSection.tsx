import * as React from 'react'
import {
  defineMessages,
  FormattedMessage,
  FormattedNumber,
  IntlProvider,
  type NoMessageValues,
} from 'react-intl'

// The headline is an ICU message. Its arguments, count and locale, are the
// controls placed around it.
const messages = defineMessages<{
  readonly ship: NoMessageValues
  readonly count: {readonly count: number | bigint}
}>({
  ship: {
    id: 'hero.ship',
    defaultMessage: 'Ship in',
    description: 'Homepage headline, first line',
  },
  count: {
    id: 'hero.count',
    defaultMessage:
      '{count, plural, =0 {no languages} one {# language} other {# languages}}',
    description: 'Homepage headline, second line: number of languages',
  },
})

type Branch = [selector: string, text: string]

const HERO_LOCALES: Record<
  string,
  {ship: string; branches: Branch[]; dir?: 'rtl'}
> = {
  en: {
    ship: 'Ship in',
    branches: [
      ['=0', 'no languages'],
      ['one', '# language'],
      ['other', '# languages'],
    ],
  },
  fr: {
    ship: 'Publiez en',
    branches: [
      ['one', '# langue'],
      ['other', '# langues'],
    ],
  },
  de: {
    ship: 'Bereit für',
    branches: [
      ['one', '# Sprache'],
      ['other', '# Sprachen'],
    ],
  },
  pl: {
    ship: 'Gotowe na',
    branches: [
      ['one', '# język'],
      ['few', '# języki'],
      ['many', '# języków'],
      ['other', '# języka'],
    ],
  },
  ar: {
    ship: 'انشر تطبيقك',
    dir: 'rtl',
    branches: [
      ['zero', 'بلا أي لغة'],
      ['one', 'بلغة واحدة'],
      ['two', 'بلغتين'],
      ['few', 'بـ# لغات'],
      ['many', 'بـ# لغةً'],
      ['other', 'بـ# لغة'],
    ],
  },
  ja: {ship: '世界へ', branches: [['other', '#言語で公開']]},
}

const LOCALE_CODES = Object.keys(HERO_LOCALES)

const toMessage = (branches: Branch[]): string =>
  `{count, plural, ${branches.map(([k, v]) => `${k} {${v}}`).join(' ')}}`

function selectedBranch(locale: string, count: number): string {
  const {branches} = HERO_LOCALES[locale]
  const exact = branches.find(([k]) => k === `=${count}`)
  if (exact) {
    return exact[0]
  }
  const category = new Intl.PluralRules(locale).select(count)
  return branches.some(([k]) => k === category) ? category : 'other'
}

const chip =
  'home-chip-in inline-flex min-h-14 items-center gap-2.5 rounded-lg bg-home-raised px-3 py-2.5 text-sm sm:min-h-16 sm:gap-3.5 sm:px-[18px] sm:py-3'

export default function HeroSection(): React.ReactNode {
  const [count, setCount] = React.useState(42)
  const [locale, setLocale] = React.useState('en')
  const [showSource, setShowSource] = React.useState(true)
  const headline = React.useRef<HTMLHeadingElement>(null)

  const hero = HERO_LOCALES[locale]
  const branch = selectedBranch(locale, count)

  // Size the face so the longer of the two lines fills the stage.
  React.useLayoutEffect(() => {
    const h1 = headline.current
    if (!h1) {
      return
    }
    const fit = (): void => {
      const lines = Array.from(
        h1.querySelectorAll<HTMLElement>('.home-line > span')
      )
      const stage = h1.parentElement?.clientWidth ?? window.innerWidth
      const available = stage * (window.innerWidth > 640 ? 0.9 : 1)
      const max = Math.min(150, Math.max(56, window.innerWidth * 0.09))
      h1.style.fontSize = '100px'
      const widest = Math.max(1, ...lines.map(line => line.scrollWidth))
      h1.style.fontSize = `${Math.min(max, (100 * available) / widest)}px`
    }
    fit()
    window.addEventListener('resize', fit)
    void document.fonts?.ready.then(fit)
    return () => window.removeEventListener('resize', fit)
  }, [locale, count])

  const ruleText = branch.startsWith('=')
    ? `count = ${count} → exact match ${branch}`
    : `Intl.PluralRules('${locale}').select(${count}) → ${new Intl.PluralRules(locale).select(count)}`

  return (
    <IntlProvider
      locale={locale}
      defaultLocale="en"
      messages={{
        [messages.ship.id]: hero.ship,
        [messages.count.id]: toMessage(hero.branches),
      }}
    >
      <section
        aria-labelledby="hero-title"
        className="grid min-h-svh px-[clamp(20px,2.2vw,32px)] pt-24 pb-14 sm:pt-28"
      >
        <div className="mx-auto grid w-full min-w-0 max-w-[1320px] grid-cols-[minmax(0,1fr)] content-center justify-items-center gap-5 sm:gap-7">
          <div
            className={`${chip} justify-between justify-self-stretch sm:justify-self-center sm:-rotate-3 lg:ml-[9%] lg:justify-self-start`}
          >
            <label className="text-home-muted" htmlFor="hero-count">
              count
            </label>
            <input
              id="hero-count"
              type="range"
              min={0}
              max={120}
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              className="home-range w-auto min-w-0 flex-1 sm:w-[180px] sm:flex-none"
            />
            <output
              htmlFor="hero-count"
              className="min-w-[2.5ch] text-right font-medium tabular-nums"
            >
              <FormattedNumber value={count} />
            </output>
          </div>

          <h1
            ref={headline}
            id="hero-title"
            lang={locale}
            dir={hero.dir ?? 'ltr'}
            className={`m-0 w-full min-w-0 text-center text-[clamp(56px,9vw,150px)] leading-[0.9] font-bold uppercase ${hero.dir ? 'tracking-normal' : 'tracking-[-0.03em]'}`}
          >
            <span className="home-line">
              <span style={{'--i': 0} as React.CSSProperties}>
                <FormattedMessage {...messages.ship} />
              </span>
            </span>
            <span className="home-line">
              <span style={{'--i': 1} as React.CSSProperties}>
                <FormattedMessage {...messages.count} values={{count}} />
              </span>
            </span>
          </h1>

          <div className="grid w-full grid-cols-1 items-center gap-3.5 sm:grid-cols-2 sm:gap-8 lg:grid-cols-[1fr_minmax(0,40ch)_1fr]">
            <fieldset
              aria-label="Locale"
              className={`${chip} m-0 border-0 flex-col items-start gap-1.5 justify-self-stretch sm:flex-row sm:items-center sm:justify-self-start sm:rotate-2`}
            >
              <span className="text-home-muted">locale</span>
              <div className="flex w-full justify-between gap-0.5 rounded-md bg-[#333] p-[3px] sm:inline-flex sm:w-auto">
                {LOCALE_CODES.map(code => (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={code === locale}
                    onClick={() => setLocale(code)}
                    className="min-h-11 min-w-0 flex-1 cursor-pointer rounded px-2 font-medium transition-[background-color,transform] duration-150 hover:bg-[#3d3d3d] active:scale-95 aria-pressed:bg-home-ink aria-pressed:text-home-bg sm:min-h-[38px] sm:min-w-10 sm:flex-none"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </fieldset>
            <p
              className="home-load order-3 m-0 max-w-[40ch] justify-self-center text-center sm:order-none sm:col-span-2 sm:row-start-2 lg:col-span-1 lg:row-start-auto"
              style={{'--d': '420ms'} as React.CSSProperties}
            >
              FormatJS is a set of JavaScript libraries for
              internationalization, built on ICU MessageFormat, Unicode CLDR and
              the ECMA-402 Intl APIs.
            </p>
            <div
              className={`${chip} justify-between justify-self-stretch sm:justify-self-end sm:-rotate-2`}
            >
              <span className="text-home-muted" id="hero-source-label">
                Show message
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showSource}
                aria-labelledby="hero-source-label"
                onClick={() => setShowSource(on => !on)}
                className="group relative h-[30px] w-[52px] cursor-pointer rounded-full bg-[#444] transition-colors aria-checked:bg-primary"
              >
                <span className="absolute top-[3px] left-[3px] size-6 rounded-full bg-home-ink transition-transform duration-300 group-aria-checked:translate-x-[22px]" />
              </button>
              <span className="min-w-[2.5ch] text-right font-medium">
                {showSource ? 'on' : 'off'}
              </span>
            </div>
          </div>

          <div
            aria-live="polite"
            aria-hidden={!showSource}
            className={`w-full max-w-[860px] min-w-0 overflow-hidden rounded-lg bg-home-surface text-sm transition-[opacity,transform] duration-300 ${showSource ? '' : 'pointer-events-none invisible translate-y-2 opacity-0'}`}
          >
            <div className="flex flex-col justify-between gap-1 bg-home-raised px-[18px] py-3 text-home-muted sm:flex-row sm:gap-4">
              <span>lang/{locale}.json</span>
              <code className="text-home-ink">{ruleText}</code>
            </div>
            <pre className="m-0 overflow-x-auto px-[18px] pt-4 pb-[18px] text-[13px] leading-[1.65] break-words whitespace-pre-wrap sm:text-sm">
              <code>
                {'{\n'}
                {`  "${messages.ship.id}": "${hero.ship}",\n`}
                {`  "${messages.count.id}": "{count, plural, `}
                {hero.branches.map(([selector, text], i) => (
                  <React.Fragment key={selector}>
                    {i > 0 && ' '}
                    <span
                      className={
                        selector === branch
                          ? 'rounded-[3px] bg-primary px-1 py-px text-white'
                          : 'text-home-muted'
                      }
                    >
                      {selector} {`{${text}}`}
                    </span>
                  </React.Fragment>
                ))}
                {'}"\n}'}
              </code>
            </pre>
          </div>
        </div>
      </section>
    </IntlProvider>
  )
}

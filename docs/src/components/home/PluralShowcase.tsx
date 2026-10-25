import * as React from 'react'
import {
  defineMessages,
  FormattedMessage,
  FormattedNumber,
  IntlProvider,
} from 'react-intl'

const messages = defineMessages<{
  readonly newMessages: {readonly count: number | bigint}
}>({
  newMessages: {
    id: 'showcase.newMessages',
    defaultMessage:
      '{count, plural, =0 {no new messages} one {# new message} other {# new messages}}',
    description: 'Arabic plural showcase, count of new messages',
  },
})

const AR_MESSAGES = {
  [messages.newMessages.id]:
    '{count, plural, zero {لا رسائل جديدة} one {رسالة جديدة واحدة} two {رسالتان جديدتان} few {# رسائل جديدة} many {# رسالة جديدة} other {# رسالة جديدة}}',
}

const CATEGORIES: Intl.LDMLPluralRule[] = [
  'zero',
  'one',
  'two',
  'few',
  'many',
  'other',
]

// Steps that walk through all six Arabic categories without a long slog:
// 0 zero, 1 one, 2 two, 3–10 few, 11–99 many, 100–102 other.
const STEPS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20, 42, 99, 100, 101, 102, 103, 111,
  200, 1000,
]

const arabicRules = new Intl.PluralRules('ar')

export default function PluralShowcase(): React.ReactNode {
  const [index, setIndex] = React.useState(3)
  const count = STEPS[index]
  const category = arabicRules.select(count)

  // Swap the field colour each time the category changes.
  const [field, setField] = React.useState<'brand' | 'bronze'>('brand')
  const previous = React.useRef(category)
  React.useEffect(() => {
    if (previous.current !== category) {
      previous.current = category
      setField(f => (f === 'brand' ? 'bronze' : 'brand'))
    }
  }, [category])

  const step = (delta: number): void =>
    setIndex(i => Math.max(0, Math.min(STEPS.length - 1, i + delta)))

  return (
    <section
      aria-labelledby="plural-title"
      className={`relative h-[86svh] min-h-[640px] overflow-hidden px-[clamp(20px,2.2vw,32px)] py-14 transition-colors duration-500 sm:h-[92svh] sm:min-h-[620px] sm:py-[72px] ${field === 'brand' ? 'bg-primary text-white' : 'bg-bronze text-home-bg'}`}
    >
      <div data-reveal className="relative z-[2] max-w-[34rem]">
        <h2
          id="plural-title"
          className="m-0 mb-4 text-[26px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[clamp(28px,2.6vw,40px)]"
        >
          In Arabic, {count} is {category}
        </h2>
        <p className="m-0 max-w-[46ch]">
          CLDR gives Arabic six plural categories, English two and Japanese one.
          FormatJS selects the branch with{' '}
          <code className="bg-black/20!">Intl.PluralRules</code>, so every
          translation says the number the way its own grammar does.
        </p>
      </div>

      <div
        data-reveal
        style={{'--d': '160ms'} as React.CSSProperties}
        className="absolute bottom-0 left-[clamp(20px,2.2vw,32px)] text-[3.5vw] sm:right-[clamp(20px,2.2vw,32px)] sm:left-auto sm:text-[clamp(15px,2vw,32px)]"
      >
        <IntlProvider locale="ar" defaultLocale="en" messages={AR_MESSAGES}>
          <div
            dir="ltr"
            className="w-[25em] rounded-t-[0.5em] bg-[#151515] px-[1.3em] pt-[1.1em] pb-[1.4em] text-home-ink"
          >
            <div className="flex justify-between text-[0.8em] text-home-muted">
              <span>count</span>
              <span>locale: ar</span>
            </div>
            <div className="mt-[0.5em] mb-[0.6em] flex items-center gap-[0.5em]">
              {[
                {label: 'Decrease count', symbol: '−', delta: -1},
                {label: 'Increase count', symbol: '+', delta: 1},
              ].map(button => (
                <button
                  key={button.delta}
                  type="button"
                  aria-label={button.label}
                  onClick={() => step(button.delta)}
                  className="size-[2.2em] cursor-pointer rounded-[0.3em] bg-[#2c2c2c] text-[1.1em] transition-[background-color,transform] duration-150 hover:bg-[#3a3a3a] active:scale-95"
                >
                  {button.symbol}
                </button>
              ))}
              <output
                lang="ar"
                aria-live="polite"
                className="ml-auto text-[4.6em] leading-[0.9] font-bold tabular-nums"
              >
                <FormattedNumber value={count} />
              </output>
            </div>
            <ul
              aria-label="Arabic plural categories"
              className="m-0 grid list-none grid-cols-6 gap-[0.25em] rounded-[0.35em] bg-[#232323] p-[0.25em]"
            >
              {CATEGORIES.map(c => (
                <li
                  key={c}
                  aria-current={c === category}
                  className={`rounded-[0.25em] px-[0.5em] py-[0.35em] text-center text-[0.78em] transition-colors duration-200 ${c === category ? 'bg-home-ink font-medium text-home-bg' : 'text-[#b5b5b5]'}`}
                >
                  {c}
                </li>
              ))}
            </ul>
            <p
              lang="ar"
              dir="rtl"
              className="mt-[0.6em] mb-0 text-right text-[1.15em]"
            >
              <FormattedMessage {...messages.newMessages} values={{count}} />
            </p>
          </div>
        </IntlProvider>
      </div>
    </section>
  )
}

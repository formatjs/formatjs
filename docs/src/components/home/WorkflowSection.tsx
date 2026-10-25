import * as React from 'react'
import {defineMessages, FormattedMessage, IntlProvider} from 'react-intl'

const messages = defineMessages<{
  readonly unread: {readonly count: number | bigint}
}>({
  unread: {
    id: 'workflow.unread',
    defaultMessage:
      '{count, plural, one {# new message} other {# new messages}}',
    description: 'Inbox header, count of unread mail',
  },
})

const FR_MESSAGES = {
  [messages.unread.id]:
    '{count, plural, one {# nouveau message} other {# nouveaux messages}}',
}

const STEPS = [
  {
    say: 'First, declare messages where they render.',
    sub: (
      <>
        <code>defineMessages</code> keeps the English default, a note for
        translators and a stable ID next to the component that uses it.
      </>
    ),
  },
  {
    say: 'Then extract them with one command.',
    sub: (
      <>
        <code>formatjs extract</code> reads your source and writes a catalog
        your translation tool can open. The CLI ships native binaries for macOS,
        Linux and Windows.
      </>
    ),
  },
  {
    say: 'Finally, compile and ship each locale.',
    sub: (
      <>
        <code>formatjs compile --ast</code> pre-parses every translation, so the
        browser formats messages without loading the parser.
      </>
    ),
  },
]

const TABS = ['Inbox.tsx', 'Terminal', 'compiled-lang/fr.json']

const K = ({children}: {children: React.ReactNode}): React.ReactNode => (
  <span className="text-[#c9a8e4]">{children}</span>
)
const S = ({children}: {children: React.ReactNode}): React.ReactNode => (
  <span className="text-[#d7bfa9]">{children}</span>
)
const M = ({children}: {children: React.ReactNode}): React.ReactNode => (
  <span className="text-[#8f8f8f]">{children}</span>
)

const VIEWS: React.ReactNode[] = [
  <pre key="source">
    <code>
      <K>import</K> {'{defineMessages, FormattedMessage}'} <K>from</K>{' '}
      <S>'react-intl'</S>
      {'\n\n'}
      <K>const</K> messages = defineMessages({'{\n'}
      {'  unread: {\n    defaultMessage:\n      '}
      <S>'{'{count, plural, one {# new message} other {# new messages}}'}'</S>
      {',\n    description: '}
      <S>'Inbox header, count of unread mail'</S>
      {',\n  },\n})\n\n'}
      <K>export function</K> {'InboxHeader({count}) {\n  '}
      <K>return</K>
      {
        ' (\n    <h2>\n      <FormattedMessage {...messages.unread} values={{count}} />\n    </h2>\n  )\n}'
      }
    </code>
  </pre>,
  <pre key="extract">
    <code>
      <M>$</M> formatjs extract <S>'src/**/*.tsx'</S>
      {' \\\n    --out-file lang/en.json \\\n    --id-interpolation-pattern '}
      <S>'[sha512:contenthash:base64:6]'</S>
      {'\n\n'}
      <M>lang/en.json</M>
      {'\n{\n  '}
      <S>"hak27d"</S>
      {': {\n    '}
      <S>"defaultMessage"</S>
      {': '}
      <S>"{'{count, plural, one {# new message} other {# new messages}}'}"</S>
      {',\n    '}
      <S>"description"</S>
      {': '}
      <S>"Inbox header, count of unread mail"</S>
      {'\n  }\n}'}
    </code>
  </pre>,
  <React.Fragment key="compile">
    <pre>
      <code>
        <M>$</M> formatjs compile lang/fr.json --ast \
        {'\n    --out-file compiled-lang/fr.json\n\n'}
        <M>compiled-lang/fr.json</M>
        {'\n{'}
        <S>"hak27d"</S>
        {': [{'}
        <S>"type"</S>
        {': 6, '}
        <S>"value"</S>
        {': '}
        <S>"count"</S>
        {',\n  '}
        <S>"options"</S>
        {': {'}
        <S>"one"</S>
        {': …, '}
        <S>"other"</S>
        {': …}}]}'}
      </code>
    </pre>
    <div
      lang="fr"
      className="mt-auto grid gap-1 rounded-md bg-home-ink px-[18px] py-4 text-home-bg"
    >
      <span className="text-sm text-[#555]">Rendered, locale fr</span>
      <span className="text-xl font-bold sm:text-2xl">
        <IntlProvider locale="fr" defaultLocale="en" messages={FR_MESSAGES}>
          <FormattedMessage {...messages.unread} values={{count: 3}} />
        </IntlProvider>
      </span>
    </div>
  </React.Fragment>,
]

export default function WorkflowSection(): React.ReactNode {
  const [active, setActive] = React.useState(0)
  const steps = React.useRef<(HTMLDivElement | null)[]>([])

  // The pinned pane follows whichever statement sits in the middle band.
  React.useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      return
    }
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.step))
          }
        }
      },
      {rootMargin: '-45% 0px -45% 0px'}
    )
    steps.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="workflow"
      aria-labelledby="flow-title"
      className="block bg-home-surface pb-20 sm:grid sm:grid-cols-12 sm:gap-6 sm:px-[clamp(20px,2.2vw,32px)] sm:pt-20 sm:pb-[120px]"
    >
      <div className="px-[clamp(20px,2.2vw,32px)] pt-12 sm:col-span-5 sm:px-0 sm:pt-0">
        {STEPS.map((step, i) => (
          <div
            key={i}
            data-step={i}
            ref={el => {
              steps.current[i] = el
            }}
            className="flex min-h-[60svh] flex-col justify-center sm:min-h-[80vh] sm:last:min-h-[70vh]"
          >
            {i === 0 && (
              <h2
                id="flow-title"
                className="m-0 mb-12 text-[26px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[clamp(28px,2.6vw,40px)]"
              >
                From component to catalog
              </h2>
            )}
            <p
              className={`m-0 mb-3.5 max-w-[18ch] text-2xl leading-[1.15] font-medium transition-colors duration-300 sm:text-[clamp(24px,2.6vw,40px)] ${i === active ? 'text-home-ink' : 'text-home-muted'}`}
            >
              {step.say}
            </p>
            <p
              className={`m-0 max-w-[40ch] transition-colors duration-300 ${i === active ? 'text-home-ink' : 'text-home-muted'}`}
            >
              {step.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="sticky top-0 z-[2] grid h-[46svh] place-items-center self-start bg-primary p-3 sm:top-[14vh] sm:col-span-6 sm:col-start-7 sm:mt-[14vh] sm:h-[min(72vh,600px)] sm:p-8">
        <div className="flex size-full max-w-[640px] flex-col overflow-hidden rounded-lg bg-[#121212] text-[13px] sm:text-sm">
          <div className="flex gap-0.5 bg-[#1e1e1e] px-1.5 pt-1.5">
            {TABS.map((tab, i) => (
              <span
                key={tab}
                className={`rounded-t-md px-3.5 py-2 whitespace-nowrap transition-colors duration-200 ${i === active ? 'bg-[#121212] text-home-ink' : 'text-[#8f8f8f]'}`}
              >
                {tab}
              </span>
            ))}
          </div>
          <div
            key={active}
            className="home-pane-in flex flex-1 flex-col overflow-hidden px-5 py-[18px] [&_pre]:m-0 [&_pre]:leading-[1.6] [&_pre]:break-words [&_pre]:whitespace-pre-wrap [&_pre]:text-[#e6e6e6]"
          >
            {VIEWS[active]}
          </div>
        </div>
      </div>
    </section>
  )
}

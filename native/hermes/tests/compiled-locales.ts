export {}

declare function print(value: string): void

let assertions = 0
function equal(actual: unknown, expected: unknown): void {
  assertions++
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(`${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`)
}
const api = Intl as any
const checks: Record<string, [string, () => void]> = {
  pluralrules: [
    'PluralRules',
    () => {
      equal(new api.PluralRules('fr').select(0), 'one')
      equal(new api.PluralRules('en', {type: 'ordinal'}).select(3), 'few')
    },
  ],
  listformat: [
    'ListFormat',
    () => equal(new api.ListFormat('fr').format(['un', 'deux']), 'un et deux'),
  ],
  displaynames: [
    'DisplayNames',
    () => {
      equal(new api.DisplayNames('fr', {type: 'region'}).of('US'), 'États-Unis')
      equal(new api.DisplayNames('zh-TW', {type: 'region'}).of('US'), '美國')
    },
  ],
  numberformat: [
    'NumberFormat',
    () => {
      equal(new api.NumberFormat('fr').format(1234.5), '1\u202f234,5')
      equal(new api.NumberFormat('fr-CA').resolvedOptions().locale, 'fr')
    },
  ],
  relativetimeformat: [
    'RelativeTimeFormat',
    () =>
      equal(
        new api.RelativeTimeFormat('fr', {numeric: 'auto'}).format(-1, 'day'),
        'hier'
      ),
  ],
  datetimeformat: [
    'DateTimeFormat',
    () =>
      equal(
        new api.DateTimeFormat('fr', {
          timeZone: 'UTC',
          dateStyle: 'long',
        }).format(0),
        '1 janvier 1970'
      ),
  ],
  durationformat: [
    'DurationFormat',
    () =>
      equal(
        new api.DurationFormat('fr', {style: 'long'}).format({hours: 2}),
        '2\u00a0heures'
      ),
  ],
}
const kinds: string[] = []
for (const kind of Object.keys(checks)) {
  const [name, check] = checks[kind]
  if (!api[name]?.polyfilled) continue
  if (kind !== 'durationformat') {
    equal(api[name].supportedLocalesOf(['en', 'fr']), ['en', 'fr'])
    equal(api[name].supportedLocalesOf(['de']), [])
  }
  check()
  kinds.push(kind)
}
print(JSON.stringify({type: 'compiled-locales', kinds, assertions}))

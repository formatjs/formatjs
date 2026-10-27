export {}

declare function print(value: string): void

const api = Intl as any
let assertions = 0
let formatter = ''
function equal(actual: unknown, expected: unknown): void {
  assertions++
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(
      `${formatter}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`
    )
}
const kinds: string[] = []
for (const [kind, name] of Object.entries({
  pluralrules: 'PluralRules',
  listformat: 'ListFormat',
  displaynames: 'DisplayNames',
  numberformat: 'NumberFormat',
  relativetimeformat: 'RelativeTimeFormat',
  datetimeformat: 'DateTimeFormat',
  durationformat: 'DurationFormat',
})) {
  if (!api[name]?.polyfilled) continue
  formatter = name
  const included = [
    'en',
    'fr-CA',
    'en-AU',
    'de',
    'es-MX',
    'ja',
    'zh-TW',
    'sr-Latn',
  ]
  equal(api[name].supportedLocalesOf(included), included)
  if (kind !== 'durationformat')
    equal(api[name].supportedLocalesOf(['aa', 'agq']), [])
  kinds.push(kind)
}
if (api.NumberFormat?.polyfilled) {
  equal(new api.NumberFormat('fr-CA').resolvedOptions().locale, 'fr-CA')
  equal(new api.NumberFormat('fr-CA').format(1234.5), '1\u00a0234,5')
}
if (api.DurationFormat?.polyfilled)
  equal(
    new api.DurationFormat('fr', {style: 'long'}).format({hours: 2}),
    '2\u00a0heures'
  )
if (api.DisplayNames?.polyfilled)
  equal(new api.DisplayNames('zh-TW', {type: 'region'}).of('US'), '美國')
print(JSON.stringify({type: 'compiled-locales', kinds, assertions}))

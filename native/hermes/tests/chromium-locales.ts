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
    equal(api[name].supportedLocalesOf(['aa', 'agq', 'ak', 'az']), [])
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
for (const [locale, list, week, quarter, region, weekday, hour] of (
  globalThis as any
).__LOCALE_FORMAT_FIXTURES as string[][]) {
  formatter = locale
  if (api.ListFormat?.polyfilled)
    equal(new api.ListFormat(locale).format(['A', 'B', 'C']), list)
  if (api.RelativeTimeFormat?.polyfilled) {
    const relative = new api.RelativeTimeFormat(locale)
    equal(relative.format(-3, 'week'), week)
    equal(relative.format(-3, 'quarter'), quarter)
  }
  if (api.DisplayNames?.polyfilled)
    equal(new api.DisplayNames(locale, {type: 'region'}).of('US'), region)
  if (api.DateTimeFormat?.polyfilled)
    equal(
      new api.DateTimeFormat(locale, {
        weekday: 'short',
        timeZone: 'UTC',
      }).format(0),
      weekday
    )
  if (api.NumberFormat?.polyfilled)
    equal(
      new api.NumberFormat(locale, {
        style: 'unit',
        unit: 'hour',
        unitDisplay: 'long',
      }).format(3),
      hour
    )
  if (api.DurationFormat?.polyfilled)
    equal(
      new api.DurationFormat(locale, {style: 'long'}).format({hours: 3}),
      hour
    )
}
function unhex(value: string): string {
  if (value === '_') return ''
  let result = ''
  for (let index = 0; index < value.length; index += 4)
    result += String.fromCharCode(parseInt(value.slice(index, index + 4), 16))
  return result
}
if (api.ListFormat?.polyfilled) {
  const rows = (globalThis as any).__LIST_FORMAT_FIXTURES as string[][]
  equal(rows.length, 3168)
  for (const [locale, type, style, encoded, , expected] of rows) {
    const items = encoded === '-' ? [] : encoded.split(',').map(unhex)
    formatter = `ListFormat ${locale}/${type}/${style}/${encoded}`
    const list = new api.ListFormat(locale, {type, style})
    equal(list.format(items), unhex(expected))
    const parts = list.formatToParts(items)
    equal(parts.map((part: any) => part.value).join(''), unhex(expected))
    equal(
      parts
        .filter((part: any) => part.type === 'element')
        .map((part: any) => part.value),
      items
    )
  }
}
if (api.PluralRules?.polyfilled) {
  const rows = (globalThis as any).__PLURAL_RULES_FIXTURES as string[][]
  equal(rows.length, 720)
  for (const [locale, type, value, expected] of rows) {
    formatter = `PluralRules ${locale}/${type}/${value}`
    equal(new api.PluralRules(locale, {type}).select(Number(value)), expected)
  }
}
if (api.PluralRules?.polyfilled) {
  const rows = (globalThis as any).__PLURAL_RANGE_FIXTURES as string[][]
  const differences = new Map<string, string[]>(
    ((globalThis as any).__PLURAL_RANGE_DIFFERENCES as string[][]).map(row => [
      row.slice(0, 3).join('\t'),
      row,
    ])
  )
  equal(rows.length, 224)
  equal(differences.size, 18)
  for (const row of rows) {
    const [locale, start, end, , expected] = row
    const key = row.slice(0, 3).join('\t')
    const difference = differences.get(key)
    if (difference) {
      equal(difference.slice(0, 5), row)
      differences.delete(key)
    }
    formatter = `PluralRules range ${locale}/${start}/${end}`
    equal(
      new api.PluralRules(locale).selectRange(Number(start), Number(end)),
      difference ? difference[6] : expected
    )
  }
  equal(differences.size, 0)
}

print(JSON.stringify({type: 'compiled-locales', kinds, assertions}))

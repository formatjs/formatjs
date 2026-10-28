import './setup.js'
import '@formatjs/intl-datetimeformat/locale-data/en.js'
import '@formatjs/intl-displaynames/locale-data/en.js'
import '@formatjs/intl-listformat/locale-data/en.js'
import '@formatjs/intl-numberformat/locale-data/en.js'
import '@formatjs/intl-pluralrules/locale-data/en.js'
import '@formatjs/intl-relativetimeformat/locale-data/en.js'
import timezone from '@formatjs_generated/tz/all-tz.js'

declare function print(message: string): void
declare global {
  var __FORMATJS_NATIVE_INTL: Record<string, unknown>
  var __FORMATJS_REFERENCE_INTL: Record<string, unknown>
}

const nativeIntl = globalThis.__FORMATJS_NATIVE_INTL
const referenceIntl = globalThis.__FORMATJS_REFERENCE_INTL
const useNative = () => Object.assign(Intl, nativeIntl)
const useReference = () => Object.assign(Intl, referenceIntl)

useReference()
;(Intl.DateTimeFormat as any).__addTZData(timezone)

interface Scenario {
  name: string
  native: () => string
  reference: () => string
}

function scenario<T>(
  name: string,
  create: () => T,
  invoke: (value: T) => string
): Scenario {
  useNative()
  const native = create()
  useReference()
  const reference = create()
  return {
    name,
    native: () => invoke(native),
    reference: () => invoke(reference),
  }
}

const scenarios = [
  scenario(
    'getCanonicalLocales',
    () => null,
    () => Intl.getCanonicalLocales('EN-us')[0]
  ),
  scenario(
    'supportedValuesOf',
    () => null,
    () => String(Intl.supportedValuesOf('calendar').includes('gregory'))
  ),
  scenario(
    'Locale.maximize',
    () => new Intl.Locale('en'),
    locale => locale.maximize().toString()
  ),
  scenario(
    'PluralRules.select',
    () => new Intl.PluralRules('en'),
    rules => rules.select(1)
  ),
  scenario(
    'ListFormat.format',
    () => new Intl.ListFormat('en'),
    formatter => formatter.format(['one', 'two', 'three'])
  ),
  scenario(
    'ListFormat.formatToParts',
    () => new Intl.ListFormat('en'),
    formatter =>
      JSON.stringify(formatter.formatToParts(['one', 'two', 'three']))
  ),
  scenario(
    'DisplayNames.of',
    () => new Intl.DisplayNames('en', {type: 'language'}),
    formatter => formatter.of('fr') || ''
  ),
  scenario(
    'Segmenter.segment',
    () => new Intl.Segmenter('en', {granularity: 'grapheme'}),
    segmenter =>
      Array.from(segmenter.segment('A🙂B'), part => part.segment).join('|')
  ),
  scenario(
    'Collator.compare',
    () => new Intl.Collator('en'),
    collator => String(Math.sign(collator.compare('a', 'b')))
  ),
  scenario(
    'NumberFormat.format',
    () => new Intl.NumberFormat('en'),
    formatter => formatter.format(123456.78)
  ),
  scenario(
    'RelativeTimeFormat.format',
    () => new Intl.RelativeTimeFormat('en', {numeric: 'always'}),
    formatter => formatter.format(-3, 'day')
  ),
  scenario(
    'RelativeTimeFormat.formatToParts',
    () => new Intl.RelativeTimeFormat('en', {numeric: 'always'}),
    formatter => JSON.stringify(formatter.formatToParts(-3, 'day'))
  ),
  scenario(
    'DateTimeFormat.format',
    () => new Intl.DateTimeFormat('en', {timeZone: 'UTC'}),
    formatter => formatter.format(1704153600000)
  ),
  scenario(
    'DurationFormat.format',
    () => new (Intl as any).DurationFormat('en', {style: 'digital'}),
    formatter => formatter.format({hours: 1, minutes: 2, seconds: 3})
  ),
]

const now = Date.now
let checksum = 0
function measure(mode: () => unknown, invoke: () => string) {
  mode()
  let calls = 10
  while (calls < 131072) {
    const start = now()
    for (let i = 0; i < calls; i++) checksum += invoke().length
    if (now() - start >= 50) break
    calls *= 2
  }
  const times = []
  for (let round = 0; round < 7; round++) {
    const start = now()
    for (let i = 0; i < calls; i++) checksum += invoke().length
    times.push(now() - start)
  }
  times.sort((a, b) => a - b)
  return {callsPerRound: calls, nsPerCall: (times[3] * 1e6) / calls}
}

for (const test of scenarios) {
  useNative()
  const actual = test.native()
  useReference()
  const expected = test.reference()
  if (actual !== expected)
    throw new Error(`${test.name}: ${actual} != ${expected}`)
  const native = measure(useNative, test.native)
  const typescript = measure(useReference, test.reference)
  print(
    JSON.stringify({
      name: test.name,
      native,
      typescript,
      speedup: typescript.nsPerCall / native.nsPerCall,
    })
  )
}
print(JSON.stringify({checksum}))

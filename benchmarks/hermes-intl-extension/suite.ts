import './setup.js'
import {DateTimeFormat} from '@formatjs/intl-datetimeformat'
import '@formatjs/intl-datetimeformat/locale-data/en.js'
import ListFormat from '@formatjs/intl-listformat'
import '@formatjs/intl-listformat/locale-data/en.js'
import {NumberFormat} from '@formatjs/intl-numberformat'
import '@formatjs/intl-numberformat/locale-data/en.js'
import '@formatjs/intl-pluralrules/locale-data/en.js'
import timezone from '@formatjs_generated/tz/all-tz.js'

declare function print(message: string): void
declare global {
  var __FORMATJS_NATIVE_INTL: {
    DateTimeFormat: typeof Intl.DateTimeFormat
    ListFormat: typeof Intl.ListFormat
    NumberFormat: typeof Intl.NumberFormat
    PluralRules: typeof Intl.PluralRules
  }
}

Object.assign(Intl, globalThis.__FORMATJS_NATIVE_INTL)

DateTimeFormat.__addTZData(timezone)

const scenarios = [
  {
    name: 'NumberFormat.format',
    native: new Intl.NumberFormat('en'),
    reference: new NumberFormat('en'),
    invoke: (formatter: Intl.NumberFormat) => formatter.format(123456.78),
  },
  {
    name: 'ListFormat.format',
    native: new Intl.ListFormat('en'),
    reference: new ListFormat('en'),
    invoke: (formatter: Intl.ListFormat) =>
      formatter.format(['one', 'two', 'three']),
  },
  {
    name: 'DateTimeFormat.format',
    native: new Intl.DateTimeFormat('en', {timeZone: 'UTC'}),
    reference: new DateTimeFormat('en', {timeZone: 'UTC'}),
    invoke: (formatter: Intl.DateTimeFormat) => formatter.format(1704153600000),
  },
] as const

const now = Date.now
let checksum = 0
for (const scenario of scenarios) {
  const expected = scenario.invoke(scenario.reference as never)
  const actual = scenario.invoke(scenario.native as never)
  if (actual !== expected)
    throw new Error(`${scenario.name}: ${actual} != ${expected}`)
  const samples = []
  for (const formatter of [scenario.native, scenario.reference]) {
    const times = []
    for (let round = 0; round < 7; round++) {
      const start = now()
      for (let i = 0; i < 10000; i++)
        checksum += scenario.invoke(formatter as never).length
      times.push(now() - start)
    }
    times.sort((a, b) => a - b)
    samples.push(times[3])
  }
  print(
    JSON.stringify({
      name: scenario.name,
      callsPerRound: 10000,
      nativeMs: samples[0],
      typescriptMs: samples[1],
      speedup: samples[1] / samples[0],
    })
  )
}
print(JSON.stringify({checksum}))

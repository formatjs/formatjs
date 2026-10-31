import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {performance} from 'node:perf_hooks'
import {runInNewContext} from 'node:vm'
import {runfiles} from '@bazel/runfiles'
import {DateTimeFormat} from '@formatjs/intl-datetimeformat'
import {NumberFormat} from '@formatjs/intl-numberformat'
import {PluralRules} from '@formatjs/intl-pluralrules'
const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
const polyfillNumbers = process.argv.includes('--polyfill-numbers')
if (polyfillNumbers) {
  Intl.NumberFormat = NumberFormat as unknown as typeof Intl.NumberFormat
  Object.defineProperty(Intl, 'PluralRules', {
    value: PluralRules,
    writable: true,
    configurable: true,
  })
  ;(Intl.PluralRules as unknown as typeof PluralRules).__addLocaleData(
    runInNewContext(
      '(' +
        readFileSync(
          resolve('packages/intl-pluralrules/cldr-raw/en.js'),
          'utf8'
        ) +
        ')'
    )
  )
  ;(Intl.NumberFormat as unknown as typeof NumberFormat).__addLocaleData(
    JSON.parse(
      readFileSync(
        resolve('crates/intl_numberformat/locale-data/en.json'),
        'utf8'
      )
    )
  )
}
DateTimeFormat.__addTZData(
  JSON.parse(
    readFileSync(resolve('packages/intl-datetimeformat/tz-all.json'), 'utf8')
  )
)
const registration = performance.now()
const directory = resolve('crates/intl_datetimeformat/locale-data')
const files = ['en.json']
for (const file of files)
  DateTimeFormat.__addLocaleData(
    JSON.parse(readFileSync(join(directory, file), 'utf8'))
  )
const registrationMilliseconds = performance.now() - registration
const iterations = Number(
  process.argv.find(s => s.startsWith('--iterations='))?.split('=')[1] || 12000
)
const profiles: [string, Intl.DateTimeFormatOptions][] = [
  ['date', {timeZone: 'UTC'}],
  [
    'date time',
    {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    },
  ],
  [
    'fractional',
    {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hourCycle: 'h23',
    },
  ],
  [
    'zone name',
    {timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'long'},
  ],
  [
    'arab digits',
    {
      timeZone: 'UTC',
      numberingSystem: 'arab',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    },
  ],
]
const values = [
  1705313700123, 1705319100456, 1705488300789, 1710053999000, 1710054000000,
]
const results = []
for (const [name, options] of profiles) {
  const formatter = new DateTimeFormat('en', options)
  for (const operation of ['format', 'parts', 'range', 'range parts']) {
    const call = (i: number) => {
      const x = values[i % values.length],
        y = x + 5400000
      switch (operation) {
        case 'format':
          return formatter.format(x).length
        case 'parts':
          return formatter.formatToParts(x).length
        case 'range':
          return formatter.formatRange(x, y).length
        default:
          return formatter.formatRangeToParts(x, y).length
      }
    }
    let checksum = 0
    for (let i = 0; i < 1000; i++) checksum += call(i)
    const timings = []
    for (let round = 0; round < 7; round++) {
      const start = performance.now()
      for (let i = 0; i < iterations; i++) checksum += call(i)
      timings.push(((performance.now() - start) * 1000) / iterations)
    }
    timings.sort((a, b) => a - b)
    results.push({
      name: `${name} ${operation}`,
      medianMicroseconds: timings[3],
      minMicroseconds: timings[0],
      maxMicroseconds: timings[6],
      checksum,
    })
  }
}
console.log(
  JSON.stringify(
    {
      node: process.version,
      icu: process.versions.icu,
      iterations,
      rounds: 7,
      numberFormat: polyfillNumbers ? 'polyfill' : 'host',
      localePacks: files.length,
      availableLocales: DateTimeFormat.availableLocales.size,
      registrationMilliseconds,
      results,
    },
    null,
    2
  )
)

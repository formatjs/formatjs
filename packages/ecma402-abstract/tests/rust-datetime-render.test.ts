import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {DateTimeFormat as Reference} from '@formatjs/intl-datetimeformat'
import links from '@formatjs_generated/tz/links.js'
import {InitializeDateTimeFormat} from '#packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.js'
import {PartitionDateTimeRangePattern} from '#packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.js'
import {FormatDateTimePattern} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import type {
  IntlDateTimeFormatInternal,
  IntlDateTimeFormatPart,
  TemporalDateTimeKind,
} from '#packages/ecma402-abstract/types/date-time.js'

type RawLocale = Parameters<typeof Reference.__addLocaleData>[number]
type Packed = RawLocale & {number: unknown}
type Input =
  | {type: 'range'; first: string; second: string; kind?: TemporalDateTimeKind}
  | {type: 'date'; value: string}
  | {type: 'epoch'; value: string; kind: TemporalDateTimeKind}
interface Case {
  locales: string[]
  options: Intl.DateTimeFormatOptions
  values: Input[]
  reload?: string
  tzReload?: string
}
const resolve = (file: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${file}`)
const read = (file: string) => readFileSync(resolve(file), 'utf8')
function pack(locale: string): Packed {
  return {
    ...(JSON.parse(
      read(`packages/intl-datetimeformat/cldr-raw/${locale}.json`)
    ) as RawLocale),
    number: JSON.parse(
      read(`crates/intl_numberformat/locale-data/${locale}.json`)
    ),
  }
}
function run(entry: Packed, tz: string, cases: Case[]): unknown[] {
  const result = spawnSync(
    resolve('crates/intl_datetimeformat/pattern_conformance'),
    [],
    {
      input:
        JSON.stringify({
          method: 'render',
          json: JSON.stringify(entry),
          tzJson: tz,
          cases,
        }) + '\n',
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  return JSON.parse(result.stdout) as unknown[]
}
function reference(entry: Packed, tz: string, request: Case): unknown {
  try {
    const formatter = new Reference(request.locales, request.options)
    const slots = Object.create(null) as IntlDateTimeFormatInternal
    InitializeDateTimeFormat(
      {} as Intl.DateTimeFormat,
      request.locales,
      request.options,
      {
        getInternalSlots: () => slots,
        availableLocales: Reference.availableLocales,
        localeData: Reference.localeData,
        getDefaultLocale: () => Reference.getDefaultLocale(),
        getDefaultTimeZone: () => Reference.getDefaultTimeZone(),
        relevantExtensionKeys: ['nu', 'ca', 'hc'],
        tzData: Reference.tzData,
        uppercaseLinks: Object.fromEntries(
          Object.entries(links).map(([name, target]) => [
            name.toUpperCase(),
            target,
          ])
        ),
      }
    )
    if (request.reload)
      Reference.__addLocaleData(JSON.parse(request.reload) as RawLocale)
    if (request.tzReload) Reference.__addTZData(JSON.parse(request.tzReload))
    return request.values.map(input => {
      try {
        if (input.type === 'range') {
          if (!input.kind)
            return {
              parts: formatter.formatRangeToParts(
                Number(input.first),
                Number(input.second)
              ),
              text: formatter.formatRange(
                Number(input.first),
                Number(input.second)
              ),
            }
          const parts = PartitionDateTimeRangePattern(
            {} as Intl.DateTimeFormat,
            {kind: input.kind, epochNanoseconds: BigInt(input.first)},
            {kind: input.kind, epochNanoseconds: BigInt(input.second)},
            {
              getInternalSlots: () => slots,
              localeData: Reference.localeData,
              getDefaultTimeZone: () => Reference.getDefaultTimeZone(),
              tzData: Reference.tzData,
              calendarData: Reference.calendarData,
            }
          )
          return {parts, text: parts.map(part => part.value).join('')}
        }
        if (input.type === 'date') {
          const value = Number(input.value)
          return {
            parts: formatter.formatToParts(value),
            text: formatter.format(value),
          }
        }
        const selected = slots.getTemporalFormat!(input.kind)
        const parts = FormatDateTimePattern(
          {} as Intl.DateTimeFormat,
          PartitionPattern<IntlDateTimeFormatPart['type']>(selected.pattern),
          BigInt(input.value),
          input.kind !== 'Instant',
          {
            getInternalSlots: () => selected,
            localeData: Reference.localeData,
            getDefaultTimeZone: () => Reference.getDefaultTimeZone(),
            tzData: Reference.tzData,
            calendarData: Reference.calendarData,
          }
        )
        return {parts, text: parts.map(part => part.value).join('')}
      } catch (error) {
        return {error: (error as Error).name}
      }
    })
  } catch (error) {
    return {error: (error as Error).name}
  } finally {
    if (request.reload) Reference.__addLocaleData(entry)
    if (request.tzReload) Reference.__addTZData(JSON.parse(tz))
  }
}
function compare(entry: Packed, tz: string, cases: Case[]) {
  Reference.localeData = {}
  Reference.availableLocales = new Set()
  Reference.__defaultLocale = ''
  Reference.calendarData = Object.create(null)
  Reference.__addLocaleData(entry)
  Reference.__addTZData(JSON.parse(tz))
  const expected = cases.map(request => reference(entry, tz, request)),
    actual = run(entry, tz, cases)
  expect(actual.length).toBe(cases.length)
  for (let index = 0; index < cases.length; index++)
    expect(
      actual[index],
      `${entry.locale}/${JSON.stringify(cases[index].options)}`
    ).toEqual(expected[index])
}
it('renders localized Gregorian/ISO fields, eras, digits, day periods and historical timezone offsets', () => {
  const values: Input[] = [
    -8640000000000000, -62167219200000, -62135596800000, -2208988800000, -1.9,
    -0.9, 0, 0.9, 951782400000, 1710053999999, 1710054000000, 1730613599999,
    1730613600000, 8640000000000000,
  ].map(value => ({type: 'date', value: String(value)}))
  const fields: Intl.DateTimeFormatOptions[] = [
    {},
    {weekday: 'long'},
    {month: 'long'},
    {month: 'short', day: 'numeric'},
    {era: 'long', year: 'numeric', month: 'long', day: '2-digit'},
    {hour: 'numeric', minute: '2-digit', second: '2-digit'},
    {hour: 'numeric', dayPeriod: 'long'},
    {hour: 'numeric', dayPeriod: 'narrow'},
    {minute: 'numeric', second: 'numeric'},
    {second: 'numeric', fractionalSecondDigits: 1},
    {second: 'numeric', fractionalSecondDigits: 2},
    {second: 'numeric', fractionalSecondDigits: 3},
    {dateStyle: 'full', timeStyle: 'full'},
    {dateStyle: 'short', timeStyle: 'short'},
  ]
  for (const timeZoneName of [
    'short',
    'long',
    'shortOffset',
    'longOffset',
    'shortGeneric',
    'longGeneric',
  ] as const)
    fields.push({
      year: '2-digit',
      month: 'numeric',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName,
    })
  const tz = read('packages/intl-datetimeformat/tz-all.json')
  for (const locale of ['en', 'fr', 'ar', 'ja', 'zh-Hans', 'ru', 'hi', 'he']) {
    const cases: Case[] = []
    for (const timeZone of [
      'UTC',
      'America/New_York',
      'Europe/Paris',
      'Asia/Kolkata',
      '-00:44',
      '+05:30',
    ])
      for (const numberingSystem of ['latn', 'arab', 'mathbold', 'hanidec'])
        for (const options of fields) {
          const index = cases.length
          cases.push({
            locales: [locale],
            options: {
              ...options,
              timeZone,
              numberingSystem,
              calendar: index % 2 ? 'gregory' : 'iso8601',
              hourCycle: (['h11', 'h12', 'h23', 'h24'] as const)[index % 4],
            },
            values,
          })
        }
    compare(pack(locale), tz, cases)
  }
}, 300000)
it('renders exact Temporal nanoseconds and plain values without changing configured timezone names', () => {
  const values: Input[] = []
  for (const kind of [
    'Instant',
    'PlainDateTime',
    'PlainDate',
    'PlainTime',
    'PlainYearMonth',
    'PlainMonthDay',
  ] as const)
    for (const value of ['-1', '0', '1710054000123456789'])
      values.push({type: 'epoch', kind, value})
  const fields: Intl.DateTimeFormatOptions[] = [
    {},
    {year: 'numeric', month: 'long', day: 'numeric'},
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    },
    {timeStyle: 'full'},
    {dateStyle: 'full', timeStyle: 'long'},
  ]
  for (const locale of ['en', 'ar', 'ru'])
    compare(
      pack(locale),
      read('packages/intl-datetimeformat/tz-all.json'),
      fields.map(options => ({
        locales: [locale],
        options: {
          ...options,
          timeZone: 'America/New_York',
          numberingSystem: 'mathbold',
        },
        values,
      }))
    )
})
it('keeps selected patterns while reading replacement names and current timezone transitions', () => {
  const entry = pack('en'),
    replacement = structuredClone(entry)
  replacement.data.month.long[0] = 'replacement month'
  replacement.data.weekday.long[4] = 'replacement weekday'
  replacement.data.formats.gregory = {y: 'y'}
  const empty = JSON.stringify({zones: [], abbrvs: '', offsets: ''})
  compare(entry, read('packages/intl-datetimeformat/tz-all.json'), [
    {
      locales: ['en'],
      options: {month: 'long', timeZone: 'UTC'},
      values: [{type: 'date', value: '0'}],
      reload: JSON.stringify(replacement),
    },
    {
      locales: ['en'],
      options: {weekday: 'long', timeZone: 'UTC'},
      values: [{type: 'date', value: '0'}],
      reload: JSON.stringify(replacement),
    },
    {
      locales: ['en'],
      options: {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
        timeZoneName: 'shortOffset',
      },
      values: [{type: 'date', value: '1710054000000'}],
      tzReload: empty,
    },
  ])
})
it('checks numeric TimeClip before field rendering', () => {
  compare(pack('en'), read('packages/intl-datetimeformat/tz-all.json'), [
    {
      locales: ['en'],
      options: {timeZone: 'UTC'},
      values: [
        'NaN',
        'Infinity',
        '-Infinity',
        '8640000000000001',
        '-8640000000000001',
      ].map(value => ({type: 'date', value})),
    },
  ])
})

it('formats ranges with displayed precision, shared grammar and endpoint sources', () => {
  const pairs = [
    [0, 0],
    [-1, 0],
    [0, 1],
    [0, 999],
    [0, 1000],
    [0, 60000],
    [0, 3600000],
    [0, 43200000],
    [39600000, 43200000],
    [0, 86400000],
    [0, 2678400000],
    [0, 31536000000],
    [123, 124],
    [199, 200],
    [1710053999999, 1710054000000],
    [1730613599999, 1730613600000],
    [-62167219200000, -62135596800000],
    [-8640000000000000, 8640000000000000],
    [86400000, 0],
    [-2208988800000, -2208902400000],
  ]
  const values: Input[] = pairs.map(([first, second]) => ({
    type: 'range',
    first: String(first),
    second: String(second),
  }))
  const fields: Intl.DateTimeFormatOptions[] = [
    {},
    {year: 'numeric'},
    {month: 'long'},
    {weekday: 'long'},
    {month: 'long', day: 'numeric'},
    {year: 'numeric', month: 'long', day: 'numeric'},
    {era: 'long', year: 'numeric', month: 'short', day: 'numeric'},
    {hour: 'numeric', minute: '2-digit'},
    {hour: 'numeric', minute: '2-digit', second: '2-digit'},
    {hour: 'numeric', dayPeriod: 'long'},
    {minute: 'numeric', second: 'numeric'},
    {second: 'numeric', fractionalSecondDigits: 1},
    {second: 'numeric', fractionalSecondDigits: 2},
    {second: 'numeric', fractionalSecondDigits: 3},
    {dateStyle: 'full'},
    {dateStyle: 'short'},
    {dateStyle: 'full', timeStyle: 'full'},
    {dateStyle: 'short', timeStyle: 'short'},
    {timeStyle: 'full'},
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'long',
    },
  ]
  const tz = read('packages/intl-datetimeformat/tz-all.json')
  for (const locale of ['en', 'fr', 'ar', 'ja', 'zh-Hans', 'ru', 'hi', 'he']) {
    const cases: Case[] = []
    for (const timeZone of [
      'UTC',
      'America/New_York',
      'Europe/Paris',
      'Asia/Kolkata',
      '-00:44',
      '+05:30',
    ])
      for (const numberingSystem of ['latn', 'arab', 'mathbold', 'hanidec'])
        for (const options of fields) {
          const index = cases.length
          cases.push({
            locales: [locale],
            options: {
              ...options,
              timeZone,
              numberingSystem,
              calendar: index % 2 ? 'gregory' : 'iso8601',
              hourCycle: (['h11', 'h12', 'h23', 'h24'] as const)[index % 4],
            },
            values,
          })
        }
    compare(pack(locale), tz, cases)
  }
}, 300000)
it('formats exact Temporal ranges with cached type profiles', () => {
  const values: Input[] = []
  for (const kind of [
    'Instant',
    'PlainDateTime',
    'PlainDate',
    'PlainTime',
    'PlainYearMonth',
    'PlainMonthDay',
  ] as const)
    for (const [first, second] of [
      ['-1', '0'],
      ['0', '999999'],
      ['1710054000123456789', '1710140400987654321'],
      ['0', '86400000000000'],
    ])
      values.push({type: 'range', kind, first, second})
  const tz = read('packages/intl-datetimeformat/tz-all.json')
  for (const locale of ['en', 'ar', 'ru'])
    compare(
      pack(locale),
      tz,
      (
        [
          {},
          {year: 'numeric', month: 'long', day: 'numeric'},
          {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            fractionalSecondDigits: 3,
          },
          {dateStyle: 'full', timeStyle: 'long'},
        ] satisfies Intl.DateTimeFormatOptions[]
      ).map(options => ({
        locales: [locale],
        options: {...options, timeZone: 'America/New_York'},
        values,
      }))
    )
})

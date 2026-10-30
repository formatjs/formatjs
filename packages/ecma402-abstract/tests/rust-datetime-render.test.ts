import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {DateTimeFormat as Reference} from '@formatjs/intl-datetimeformat'
import links from '@formatjs_generated/tz/links.js'
import {
  create as createYearMonth,
  toString as yearMonthString,
} from 'temporal-polyfill/fns/PlainYearMonth'
import {
  DayFromYear,
  DaysInYear,
} from '#packages/ecma262-abstract/DateOperations.js'
import Decimal from '@formatjs/bigdecimal'
import {
  HandleDateTimeValue,
  type DateTimeFormattable,
} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {CalendarDateFromTime} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
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
type SingleInput =
  | {type: 'date'; value: string}
  | {
      type: 'epoch'
      value: string
      kind: TemporalDateTimeKind
      calendar?: string
    }
  | {type: 'zoned'}
type Input =
  | SingleInput
  | {
      type: 'range'
      first: string
      second: string
      kind?: TemporalDateTimeKind
      calendar?: string
    }
  | {type: 'pair'; first: SingleInput; second: SingleInput}
function formattable(input: SingleInput): DateTimeFormattable {
  if (input.type === 'date') return new Decimal(Number(input.value))
  if (input.type === 'zoned')
    return {kind: 'ZonedDateTime', epochNanoseconds: 0n}
  return {
    kind: input.kind,
    calendar: input.calendar,
    epochNanoseconds: BigInt(input.value),
  }
}
interface Case {
  locales: string[]
  options: Intl.DateTimeFormatOptions
  values: Input[]
  reload?: string
  tzReload?: string
  tzDuring?: string
  inspect?: boolean
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
    const values = request.values.map(input => {
      try {
        if (input.type === 'pair') {
          const parts = PartitionDateTimeRangePattern(
            {} as Intl.DateTimeFormat,
            formattable(input.first),
            formattable(input.second),
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
            {
              kind: input.kind,
              calendar: input.calendar,
              epochNanoseconds: BigInt(input.first),
            },
            {
              kind: input.kind,
              calendar: input.calendar,
              epochNanoseconds: BigInt(input.second),
            },
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
        const handled = HandleDateTimeValue(slots, formattable(input))
        const selected = handled.format
        const parts = FormatDateTimePattern(
          {} as Intl.DateTimeFormat,
          PartitionPattern<IntlDateTimeFormatPart['type']>(selected.pattern),
          handled.epochNanoseconds,
          handled.isPlain,
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
    return request.inspect
      ? {resolved: JSON.stringify(formatter.resolvedOptions()), values}
      : values
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

it('preserves resolvedOptions fields and property order for components and styles', () => {
  const tz = read('packages/intl-datetimeformat/tz-all.json')
  const fields: Intl.DateTimeFormatOptions[] = [
    {},
    {year: 'numeric'},
    {era: 'short'},
    {timeZoneName: 'long'},
    {hour: 'numeric'},
    {minute: 'numeric', second: 'numeric'},
    {dayPeriod: 'long', hour: '2-digit'},
    {second: 'numeric', fractionalSecondDigits: 3},
    {dateStyle: 'full'},
    {timeStyle: 'full'},
    {dateStyle: 'short', timeStyle: 'long'},
    {
      year: '2-digit',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      timeZoneName: 'short',
    },
  ]
  for (const locale of ['en', 'fr', 'ar', 'ja', 'zh-Hans', 'ru', 'hi', 'he']) {
    const cases: Case[] = []
    for (const options of fields)
      for (const preference of [
        {},
        {hour12: true},
        {hour12: false},
        {hourCycle: 'h11'},
        {hourCycle: 'h12'},
        {hourCycle: 'h23'},
        {hourCycle: 'h24'},
      ] satisfies Intl.DateTimeFormatOptions[])
        cases.push({
          locales: [locale + '-u-nu-arab'],
          options: {...options, ...preference, timeZone: 'US/Eastern'},
          values: [],
          inspect: true,
        })
    compare(pack(locale), tz, cases)
  }
})
it('rejects incompatible Temporal calendars, unsupported ZonedDateTime and mixed range types', () => {
  const values: Input[] = [{type: 'zoned'}]
  for (const kind of [
    'Instant',
    'PlainDateTime',
    'PlainDate',
    'PlainTime',
    'PlainYearMonth',
    'PlainMonthDay',
  ] as const)
    for (const calendar of [undefined, 'gregory', 'iso8601', 'hebrew'])
      values.push(
        {type: 'epoch', kind, calendar, value: '0'},
        {type: 'range', kind, calendar, first: '0', second: '86400000000000'}
      )
  const endpoints: SingleInput[] = [
    {type: 'date', value: 'NaN'},
    {type: 'date', value: '0'},
    {type: 'epoch', kind: 'Instant', value: '0'},
    {type: 'epoch', kind: 'PlainDate', value: '0'},
    {type: 'epoch', kind: 'PlainTime', value: '0'},
    {type: 'zoned'},
  ]
  for (const first of endpoints)
    for (const second of endpoints) values.push({type: 'pair', first, second})
  const tz = read('packages/intl-datetimeformat/tz-all.json')
  for (const locale of ['en', 'ar', 'ja'])
    for (const calendar of ['gregory', 'iso8601'])
      compare(
        pack(locale),
        tz,
        (
          [
            {},
            {dateStyle: 'full'},
            {timeStyle: 'full'},
            {dateStyle: 'full', timeStyle: 'long'},
          ] satisfies Intl.DateTimeFormatOptions[]
        ).map((options): Case => ({
          locales: [locale],
          options: {...options, calendar, timeZone: 'America/New_York'},
          values,
        }))
      )
})
it('validates explicit timezone names against constructor-start data while rendering replacement transitions', () => {
  const entry = pack('en')
  const original = JSON.stringify({
    abbrvs: 'X',
    offsets: '1e0',
    zones: ['Test/Original|,0,0,0'],
  })
  const replacement = JSON.stringify({
    abbrvs: 'Y',
    offsets: '2s0',
    zones: ['Test/Replacement|,0,0,0'],
  })
  const changed = JSON.stringify({
    abbrvs: 'Y',
    offsets: '2s0',
    zones: ['Test/Original|,0,0,0'],
  })
  const cases: Case[] = []
  const expected: unknown[] = []
  for (const [timeZone, tzDuring] of [
    ['Test/Original', replacement],
    ['Test/Replacement', replacement],
    ['test/original', changed],
    ['US/Eastern', replacement],
    ['+05:30', replacement],
  ]) {
    Reference.localeData = {}
    Reference.availableLocales = new Set()
    Reference.__defaultLocale = ''
    Reference.calendarData = Object.create(null)
    Reference.__addLocaleData(entry)
    Reference.__addTZData(JSON.parse(original))
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'long',
    }
    Object.defineProperty(options, 'timeZone', {
      get() {
        Reference.__addTZData(JSON.parse(tzDuring))
        return timeZone
      },
    })
    try {
      const formatter = new Reference(['en'], options)
      expected.push({
        resolved: JSON.stringify(formatter.resolvedOptions()),
        values: [
          {parts: formatter.formatToParts(0), text: formatter.format(0)},
        ],
      })
    } catch (error) {
      expected.push({error: (error as Error).name})
    }
    cases.push({
      locales: ['en'],
      options: {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'long',
        timeZone,
      },
      tzDuring,
      values: [{type: 'date', value: '0'}],
      inspect: true,
    })
  }
  expect(run(entry, original, cases)).toEqual(expected)
})

it('allows provider callbacks to replace locale data and the next endpoint provider', () => {
  type Patch = Parameters<typeof Reference.__addCalendarLocaleData>[number]
  const entry = pack('en')
  function patch(marker: string): Patch {
    const data = structuredClone(entry.data)
    data.month.long[0] = marker
    return {
      locale: 'en',
      calendar: 'custom',
      data,
      formats: {yMMMMd: 'MMMM d, y'},
    }
  }
  const initial = patch('InitialMonth'),
    replacement = patch('UpdatedMonth')
  const expected = []
  for (const range of [false, true]) {
    Reference.localeData = {}
    Reference.availableLocales = new Set()
    Reference.__defaultLocale = ''
    Reference.calendarData = Object.create(null)
    Reference.__addLocaleData(entry)
    Reference.__addCalendarLocaleData(initial)
    const calls: number[] = []
    const fields = (year: number) => ({era: 'AD', year, month: 0, day: 1})
    Reference.__addCalendarData({
      calendar: 'custom',
      dateFromTime(milliseconds) {
        calls.push(milliseconds)
        Reference.__addCalendarData({
          calendar: 'custom',
          dateFromTime(milliseconds) {
            calls.push(milliseconds)
            return fields(4000)
          },
        })
        Reference.__addCalendarLocaleData(replacement)
        return fields(3000)
      },
    })
    const formatter = new Reference(['en'], {
      calendar: 'custom',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
    expected.push({
      parts: range
        ? formatter.formatRangeToParts(0, 86400000)
        : formatter.formatToParts(0),
      calls,
    })
  }
  const result = spawnSync(
    resolve('crates/intl_datetimeformat/pattern_conformance'),
    [],
    {
      input:
        JSON.stringify({
          method: 'reentrant',
          json: JSON.stringify(entry),
          patch: JSON.stringify(initial),
          replacement: JSON.stringify(replacement),
        }) + '\n',
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  expect(JSON.parse(result.stdout)).toEqual(expected)
  expect(expected.map(value => value.calls)).toEqual([[0], [0, 86400000]])
  expect(expected[0].parts.some(part => part.value === 'InitialMonth')).toBe(
    true
  )
  expect(expected[1].parts.some(part => part.value === 'UpdatedMonth')).toBe(
    true
  )
})

it('formats valid YearMonth reference dates outside numeric Date bounds', () => {
  const values: Input[] = []
  for (const [year, month, referenceDay] of [
    [-271821, 4, 1],
    [275760, 9, 30],
    [2024, 2, 29],
  ]) {
    const record = createYearMonth(year, month, undefined, referenceDay)
    const text = yearMonthString(record, {calendarName: 'always'})
    const match = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})/.exec(text)
    expect(match).not.toBeNull()
    const y = Number(match![1]),
      m = Number(match![2]),
      d = Number(match![3])
    const starts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    const days =
      DayFromYear(y) +
      starts[m - 1] +
      d -
      1 +
      Number(m > 2 && DaysInYear(y) === 366)
    values.push({
      type: 'epoch',
      kind: 'PlainYearMonth',
      calendar: 'iso8601',
      value: String(BigInt(days) * 86400000000000n + 43200000000000n),
    })
  }
  compare(pack('en'), read('packages/intl-datetimeformat/tz-all.json'), [
    {
      locales: ['en'],
      options: {
        calendar: 'iso8601',
        year: 'numeric',
        month: 'long',
        timeZone: 'America/New_York',
      },
      values,
    },
  ])
})

it('keeps one transition snapshot across range callbacks and sees updates on later calls', () => {
  const entry = pack('en')
  const patch = {
    locale: 'en',
    calendar: 'custom',
    data: entry.data,
    formats: entry.data.formats.gregory,
  }
  const tzJson = JSON.stringify({
    abbrvs: 'X',
    offsets: '0',
    zones: ['Test/Mutable|,0,0,0'],
  })
  const replacement = JSON.stringify({
    abbrvs: 'Y',
    offsets: '2s0',
    zones: ['Test/Mutable|,0,0,0'],
  })
  Reference.localeData = {}
  Reference.availableLocales = new Set()
  Reference.__defaultLocale = ''
  Reference.calendarData = Object.create(null)
  Reference.__addLocaleData(entry)
  Reference.__addCalendarLocaleData(patch)
  Reference.__addTZData(JSON.parse(tzJson))
  const calls: number[] = []
  Reference.__addCalendarData({
    calendar: 'custom',
    dateFromTime(milliseconds) {
      calls.push(milliseconds)
      Reference.__addTZData(JSON.parse(replacement))
      return CalendarDateFromTime(milliseconds, 'gregory')
    },
  })
  const formatter = new Reference(['en'], {
    calendar: 'custom',
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Test/Mutable',
  })
  const expected = {
    parts: [
      formatter.formatRangeToParts(0, 3600000),
      formatter.formatToParts(0),
      formatter.formatRangeToParts(0, 3600000),
    ],
    calls,
  }
  const result = spawnSync(
    resolve('crates/intl_datetimeformat/pattern_conformance'),
    [],
    {
      input:
        JSON.stringify({
          method: 'reentrantTz',
          json: JSON.stringify(entry),
          patch: JSON.stringify(patch),
          tzJson,
          replacement,
        }) + '\n',
      encoding: 'utf8',
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  expect(JSON.parse(result.stdout)).toEqual(expected)
})

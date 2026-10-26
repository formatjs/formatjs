import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {DateTimeFormat as Reference} from '@formatjs/intl-datetimeformat'
import calendars from '#packages/intl-datetimeformat/calendars/all.js'
import {InitializeDateTimeFormat} from '#packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.js'
import {HandleDateTimeValue} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {FormatDateTimePattern} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import links from '@formatjs_generated/tz/links.js'
import type {
  IntlDateTimeFormatInternal,
  IntlDateTimeFormatPart,
  TemporalDateTimeKind,
} from '#packages/ecma402-abstract/types/date-time.js'

type Locale = Parameters<typeof Reference.__addLocaleData>[number]
type Patch = Parameters<typeof Reference.__addCalendarLocaleData>[number]
interface Lunar {
  firstYear: number
  endDay: number
  checkpoints: number[]
  dictionary: number[]
  years: string
}
interface Umm {
  firstYear: number
  startDays: number[]
  monthLengths: number[]
}
interface Pack {
  calendar: string
  data?: Lunar | Umm
}
const resolve = (file: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${file}`)
const read = (file: string) => readFileSync(resolve(file), 'utf8')
function run<T = unknown>(request: unknown): T {
  const result = spawnSync(
    resolve('crates/intl_datetimeformat_calendars/conformance'),
    [],
    {
      input: JSON.stringify(request) + '\n',
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  return JSON.parse(result.stdout) as T
}
function pack(calendar: string): Pack {
  return JSON.parse(
    read(`crates/intl_datetimeformat_calendars/calendar-data/${calendar}.json`)
  ) as Pack
}
function safely<T>(operation: () => T): T | {error: string} {
  try {
    return operation()
  } catch (error) {
    return {error: (error as Error).name}
  }
}
const day = 86400000,
  bound = 8640000000000000
const alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
function tableBoundaries(data: Pack): number[] {
  const result: number[] = []
  if (!data.data) return result
  if (data.calendar === 'islamic-umalqura') {
    const raw = data.data as Umm
    for (let year = 0; year < raw.monthLengths.length; year++) {
      let cursor = raw.startDays[year]
      for (let month = 0; month < 12; month++) {
        result.push(cursor * day)
        cursor += 29 + ((raw.monthLengths[year] >>> month) & 1)
      }
    }
    result.push(raw.startDays[raw.startDays.length - 1] * day)
  } else {
    const raw = data.data as Lunar
    result.push(...raw.checkpoints.map(value => value * day), raw.endDay * day)
    let cursor = raw.checkpoints[0]
    for (let year = 0; year < raw.years.length / 2; year++) {
      const packed =
        raw.dictionary[
          alphabet.indexOf(raw.years[year * 2]) * 64 +
            alphabet.indexOf(raw.years[year * 2 + 1])
        ]
      const months = packed >>> 13 ? 13 : 12
      for (let month = 0; month < months; month++) {
        if (cursor >= -25567 && cursor <= 47846) result.push(cursor * day)
        cursor += 29 + ((packed >>> month) & 1)
      }
    }
  }
  return result
}
it('matches every optional calendar across Date bounds, era changes, cycles and loaded table boundaries', () => {
  expect(new Set(calendars.map(provider => provider.calendar)).size).toBe(14)
  const shared = [
    -bound - day - 1,
    -bound - day,
    -bound - 1,
    -bound,
    -bound + 1,
    -1,
    0,
    1,
    bound - 1,
    bound,
    bound + day - 1,
    bound + day,
    bound + day + 1,
  ]
  for (const epochDay of [
    -35429, -35428, -20975, -20974, -15714, -15713, 6946, 6947, 18016, 18017,
  ])
    shared.push(epochDay * day - 1, epochDay * day, epochDay * day + 1)
  for (const year of [
    -271821, -100000, -10000, -1000, -1, 0, 1, 4, 100, 400, 622, 1582, 1868,
    1873, 1900, 1912, 1926, 1970, 1989, 2000, 2019, 2024, 2100, 275760,
  ])
    for (const month of [0, 1, 2, 8, 11]) {
      const date = new Date(0)
      date.setUTCFullYear(year, month, 1)
      if (Number.isFinite(date.getTime()))
        shared.push(
          date.getTime() - 1,
          date.getTime(),
          date.getTime() + day - 1
        )
    }
  let state = 0x9e3779b9
  for (let index = 0; index < 8192; index++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    shared.push(Math.floor(((state / 0x100000000) * 2 - 1) * bound))
  }
  for (const reference of calendars) {
    const data = pack(reference.calendar)
    const values = [
      ...new Set([
        ...shared,
        ...tableBoundaries(data).flatMap(value => [
          value - 1,
          value,
          value + 1,
        ]),
      ]),
    ].sort((a, b) => a - b)
    const expected = values.map(value =>
      safely(() => reference.dateFromTime(value))
    )
    const actual = run({
      method: 'fields',
      data: JSON.stringify(data),
      milliseconds: values,
    })
    expect(actual, reference.calendar).toEqual(expected)
  }
}, 300000)

type Input =
  | {type: 'date'; value: number}
  | {type: 'range'; first: number; second: number}
  | {
      type: 'epoch'
      value: string
      kind: TemporalDateTimeKind
      calendar?: string
    }
interface Case {
  locales: string[]
  options: Intl.DateTimeFormatOptions
  values: Input[]
}
function referenceCases(cases: Case[]): unknown[] {
  return cases.map(request =>
    safely(() => {
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
            Object.entries(links).map(([key, value]) => [
              key.toUpperCase(),
              value,
            ])
          ),
        }
      )
      return request.values.map(input =>
        safely(() => {
          if (input.type === 'date')
            return {
              parts: formatter.formatToParts(input.value),
              text: formatter.format(input.value),
            }
          if (input.type === 'range')
            return {
              parts: formatter.formatRangeToParts(input.first, input.second),
              text: formatter.formatRange(input.first, input.second),
            }
          const handled = HandleDateTimeValue(slots, {
            kind: input.kind,
            calendar: input.calendar,
            epochNanoseconds: BigInt(input.value),
          })
          const parts = FormatDateTimePattern(
            {} as Intl.DateTimeFormat,
            PartitionPattern<IntlDateTimeFormatPart['type']>(
              handled.format.pattern
            ),
            handled.epochNanoseconds,
            handled.isPlain,
            {
              getInternalSlots: () => handled.format,
              localeData: Reference.localeData,
              getDefaultTimeZone: () => Reference.getDefaultTimeZone(),
              tzData: Reference.tzData,
              calendarData: Reference.calendarData,
            }
          )
          return {parts, text: parts.map(part => part.value).join('')}
        })
      )
    })
  )
}
it('renders all calendars with localized names, leap/cyclic years, Temporal profiles and interval parts', () => {
  const dates = [
    -bound,
    -62167219200000,
    -62135596800000,
    -2208988800000,
    -1,
    0,
    951782400000,
    1556668800000,
    1710053999999,
    1710054000000,
    1711929600000,
    1725148800000,
    bound,
  ]
  const values: Input[] = dates.map(value => ({type: 'date', value}))
  for (const [first, second] of [
    [0, 0],
    [-1, 0],
    [0, 86400000],
    [1556582400000, 1556668800000],
    [1704067200000, 1725148800000],
    [1710053999999, 1710054000000],
    [-bound, bound],
  ])
    values.push({type: 'range', first, second})
  const options: Intl.DateTimeFormatOptions[] = [
    {},
    {year: 'numeric'},
    {month: 'long'},
    {month: 'numeric', day: 'numeric'},
    {era: 'long', year: 'numeric', month: 'long', day: 'numeric'},
    {dateStyle: 'full'},
    {dateStyle: 'short'},
    {dateStyle: 'long', timeStyle: 'long'},
    {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      fractionalSecondDigits: 3,
    },
  ]
  const tz = read('packages/intl-datetimeformat/tz-all.json')
  for (const locale of ['en', 'fr', 'ar', 'ja', 'zh-Hans', 'ru', 'hi', 'he'])
    for (const provider of calendars) {
      const entry = JSON.parse(
        read(`crates/intl_datetimeformat/locale-data/${locale}.json`)
      ) as Locale
      const patch = JSON.parse(
        read(
          `packages/intl-datetimeformat-calendar-${provider.calendar}/locale-data-json/${locale}.json`
        )
      ) as Patch
      Reference.localeData = {}
      Reference.availableLocales = new Set()
      Reference.__defaultLocale = ''
      Reference.calendarData = Object.create(null)
      Reference.__addCalendarData(provider)
      Reference.__addCalendarLocaleData(patch)
      Reference.__addLocaleData(entry)
      Reference.__addTZData(JSON.parse(tz))
      const inputs = [...values]
      for (const kind of [
        'Instant',
        'PlainDateTime',
        'PlainDate',
        'PlainTime',
        'PlainYearMonth',
        'PlainMonthDay',
      ] as const)
        inputs.push({
          type: 'epoch',
          kind,
          calendar: kind === 'Instant' ? undefined : provider.calendar,
          value: '1710054000123456789',
        })
      const cases: Case[] = []
      for (const timeZone of ['UTC', 'America/New_York', '+05:30'])
        for (const fields of options)
          cases.push({
            locales: [locale],
            options: {
              ...fields,
              timeZone,
              calendar: provider.calendar,
              numberingSystem: cases.length % 2 ? 'mathbold' : 'latn',
              hourCycle: cases.length % 2 ? 'h11' : 'h24',
            },
            values: inputs,
          })
      const actual = run<unknown[]>({
        method: 'render',
        data: JSON.stringify(pack(provider.calendar)),
        locale: JSON.stringify(entry),
        patch: JSON.stringify(patch),
        tz,
        cases,
      })
      const expected = referenceCases(cases)
      for (let index = 0; index < cases.length; index++)
        expect(
          actual[index],
          `${locale}/${provider.calendar}/${JSON.stringify(cases[index].options)}`
        ).toEqual(expected[index])
    }
}, 300000)
it('rejects malformed optional table packs before registration', () => {
  const raw = pack('chinese'),
    umm = pack('islamic-umalqura')
  const bad: unknown[] = [
    {},
    {calendar: 'unknown'},
    {calendar: 'buddhist', data: {}},
    {calendar: 'chinese'},
    {calendar: 'islamic-umalqura'},
  ]
  for (const mutate of [
    (data: Lunar) => {
      data.endDay++
    },
    (data: Lunar) => {
      data.checkpoints[1]++
    },
    (data: Lunar) => {
      data.dictionary[0] = 13 << 13
    },
    (data: Lunar) => {
      data.years = '!' + data.years.slice(1)
    },
    (data: Lunar) => {
      data.years = data.years.slice(1)
    },
    (data: Lunar) => {
      data.years = '__' + data.years.slice(2)
    },
    (data: Lunar) => {
      data.checkpoints = []
    },
  ]) {
    const data = structuredClone(raw)
    mutate(data.data as Lunar)
    bad.push(data)
  }
  for (const mutate of [
    (data: Umm) => {
      data.startDays[1]++
    },
    (data: Umm) => {
      data.monthLengths[0] = 65535
    },
    (data: Umm) => {
      data.startDays.pop()
    },
    (data: Umm) => {
      data.firstYear = 2147483647
    },
  ]) {
    const data = structuredClone(umm)
    mutate(data.data as Umm)
    bad.push(data)
  }
  expect(
    run({method: 'validate', data: bad.map(value => JSON.stringify(value))})
  ).toEqual(bad.map(() => false))
  const good = calendars.map(provider =>
    JSON.stringify(pack(provider.calendar))
  )
  expect(run({method: 'validate', data: good})).toEqual(good.map(() => true))
})

it('keeps Hebrew standalone month names independent of Gregorian names', () => {
  const entry = JSON.parse(
    read('crates/intl_datetimeformat/locale-data/ru.json')
  ) as Locale
  const patch = JSON.parse(
    read(
      'packages/intl-datetimeformat-calendar-hebrew/locale-data-json/ru.json'
    )
  ) as Patch
  const provider = calendars.find(data => data.calendar === 'hebrew')!
  const value = 1710115200000
  const fields = provider.dateFromTime(value)
  const expected = patch.data.month.long[fields.monthNameIndex!]
  expect(typeof expected).toBe('string')
  Reference.localeData = {}
  Reference.availableLocales = new Set()
  Reference.__defaultLocale = ''
  Reference.calendarData = Object.create(null)
  Reference.__addCalendarData(provider)
  Reference.__addCalendarLocaleData(patch)
  Reference.__addLocaleData(entry)
  const formatter = new Reference(['ru'], {
    calendar: 'hebrew',
    month: 'long',
    timeZone: 'UTC',
  })
  expect(formatter.format(value)).toBe(expected)
  expect(
    formatter.formatToParts(value).every(part => typeof part.value === 'string')
  ).toBe(true)
})

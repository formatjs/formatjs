import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {DateTimeFormat as Reference} from '@formatjs/intl-datetimeformat'
import {InitializeDateTimeFormat} from '#packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.js'
import {CalendarDateFromTime} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
import {DATE_TIME_PROPS} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'
import type {
  IntlDateTimeFormatInternal,
  TemporalDateTimeKind,
} from '#packages/ecma402-abstract/types/date-time.js'

type RawLocale = Parameters<typeof Reference.__addLocaleData>[number]
type Packed = RawLocale & {number: unknown}
interface CreationCase {
  locales: string[]
  options: Intl.DateTimeFormatOptions
  kinds: TemporalDateTimeKind[]
  reload?: {json: string; phase: 'beforeSnapshot' | 'afterSnapshot'}
}
const kinds: TemporalDateTimeKind[] = [
  'Instant',
  'PlainDateTime',
  'PlainDate',
  'PlainTime',
  'PlainYearMonth',
  'PlainMonthDay',
]
function path(file: string) {
  return runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${file}`)
}
function pack(locale: string): Packed {
  const data = JSON.parse(
    readFileSync(
      path(`packages/intl-datetimeformat/cldr-raw/${locale}.json`),
      'utf8'
    )
  ) as RawLocale
  return {
    ...data,
    number: JSON.parse(
      readFileSync(
        path(`crates/intl_numberformat/locale-data/${locale}.json`),
        'utf8'
      )
    ),
  }
}
function run(entry: Packed, cases: CreationCase[]): unknown[] {
  const executable = path('crates/intl_datetimeformat/pattern_conformance')
  const result = spawnSync(executable, [], {
    input:
      JSON.stringify({
        method: 'profiles',
        json: JSON.stringify(entry),
        providers: Object.keys(entry.data.formats),
        cases,
      }) + '\n',
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  })
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  return JSON.parse(result.stdout) as unknown[]
}
function profile(slots: IntlDateTimeFormatInternal) {
  return {
    ...Object.fromEntries(
      DATE_TIME_PROPS.filter(key => slots[key] !== undefined).map(key => [
        key,
        slots[key],
      ])
    ),
    ...(slots.hourCycle === undefined ? {} : {hourCycle: slots.hourCycle}),
    pattern: slots.pattern,
    rangePatterns: slots.rangePatterns,
    format: slots.format,
  }
}
function reference(entry: Packed, request: CreationCase): unknown {
  const options = {...request.options}
  if (request.reload) {
    const reload = request.reload
    const key = reload.phase === 'beforeSnapshot' ? 'second' : 'formatMatcher'
    Object.defineProperty(options, key, {
      get() {
        Reference.__addLocaleData(JSON.parse(reload.json) as RawLocale)
        return request.options[key]
      },
    })
  }
  try {
    const slots = Object.create(null) as IntlDateTimeFormatInternal
    InitializeDateTimeFormat(
      {} as Intl.DateTimeFormat,
      request.locales,
      options,
      {
        getInternalSlots: () => slots,
        availableLocales: Reference.availableLocales,
        localeData: Reference.localeData,
        getDefaultLocale: () => Reference.getDefaultLocale(),
        getDefaultTimeZone: () => 'UTC',
        relevantExtensionKeys: ['nu', 'ca', 'hc'],
        tzData: {UTC: []},
        uppercaseLinks: {},
      }
    )
    let identity = true
    const temporal = Object.fromEntries(
      request.kinds.map(kind => {
        try {
          const selected = slots.getTemporalFormat!(kind)
          identity &&= selected === slots.getTemporalFormat!(kind)
          return [kind, profile(selected)]
        } catch (error) {
          return [kind, {error: (error as Error).name}]
        }
      })
    )
    return {main: profile(slots), temporal, identity}
  } catch (error) {
    return {error: (error as Error).name}
  } finally {
    if (request.reload) Reference.__addLocaleData(entry)
  }
}
function compare(entry: Packed, cases: CreationCase[]) {
  Reference.localeData = {}
  Reference.availableLocales = new Set()
  Reference.__defaultLocale = ''
  Reference.calendarData = Object.create(null)
  for (const calendar of Object.keys(entry.data.formats))
    Reference.__addCalendarData({
      calendar,
      dateFromTime: milliseconds =>
        CalendarDateFromTime(milliseconds, 'gregory'),
    })
  Reference.__addLocaleData(entry)
  const expected = cases.map(request => reference(entry, request)),
    actual = run(entry, cases)
  expect(actual.length).toBe(expected.length)
  for (let index = 0; index < cases.length; index++)
    expect(
      actual[index],
      `${entry.locale}/${JSON.stringify(cases[index].options)}`
    ).toEqual(expected[index])
}
it('matches constructor defaults, style/hour preferences, numeric separators and cached Temporal profiles', () => {
  const components: Intl.DateTimeFormatOptions[] = [
    {},
    {era: 'long'},
    {timeZoneName: 'short'},
    {weekday: 'long'},
    {year: '2-digit', month: 'narrow', day: '2-digit'},
    {month: 'long'},
    {hour: 'numeric'},
    {minute: 'numeric'},
    {second: '2-digit'},
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    },
    {dayPeriod: 'long'},
    {hour: 'numeric', dayPeriod: 'narrow'},
    {second: 'numeric', fractionalSecondDigits: 1},
    {second: 'numeric', fractionalSecondDigits: 2},
    {fractionalSecondDigits: 3},
  ]
  for (const dateStyle of [
    undefined,
    'full',
    'long',
    'medium',
    'short',
  ] as const)
    for (const timeStyle of [
      undefined,
      'full',
      'long',
      'medium',
      'short',
    ] as const)
      if (dateStyle || timeStyle) components.push({dateStyle, timeStyle})
  const hourOptions: Intl.DateTimeFormatOptions[] = [
    {},
    ...(['h11', 'h12', 'h23', 'h24'] as const).map(hourCycle => ({hourCycle})),
    {hour12: true, hourCycle: 'h23'},
    {hour12: false, hourCycle: 'h11'},
  ]
  for (const locale of ['en', 'fr', 'ar', 'ja', 'zh-Hans', 'ru', 'hi', 'he']) {
    const entry = pack(locale),
      cases: CreationCase[] = []
    for (const formatMatcher of ['basic', 'best fit'] as const)
      for (const fields of components)
        for (const hour of hourOptions) {
          const index = cases.length
          const calendar = (
            [
              'gregory',
              'iso8601',
              'buddhist',
              'japanese',
              'hebrew',
              'chinese',
            ] as const
          )[index % 6]
          const numberingSystem = (
            ['latn', 'arab', 'mathbold', 'hanidec'] as const
          )[index % 4]
          cases.push({
            locales: [locale],
            options: {
              ...fields,
              ...hour,
              formatMatcher,
              calendar,
              numberingSystem,
            },
            kinds,
          })
        }
    compare(entry, cases)
  }
}, 300000)
it('captures calendar data and formats before late style/matcher getters', () => {
  const entry = pack('en'),
    replacement = structuredClone(entry)
  replacement.data.formats.gregory = {Hms: "HH:mm:ss 'replacement'"}
  replacement.data.hourCycle = 'h23'
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }
  compare(entry, [
    {
      locales: ['en'],
      options,
      kinds,
      reload: {json: JSON.stringify(replacement), phase: 'beforeSnapshot'},
    },
    {
      locales: ['en'],
      options,
      kinds,
      reload: {json: JSON.stringify(replacement), phase: 'afterSnapshot'},
    },
  ])
})
it('validates late options before reporting style/component conflicts', () => {
  const entry = pack('en')
  const options = [
    {dateStyle: 'full', year: 'numeric'},
    {timeStyle: 'short', second: 'numeric'},
    {dateStyle: 'wrong', year: 'numeric'},
    {formatMatcher: 'wrong', dateStyle: 'full', year: 'numeric'},
    {fractionalSecondDigits: 0},
    {fractionalSecondDigits: 4},
    {month: 'wrong'},
  ] as Intl.DateTimeFormatOptions[]
  compare(
    entry,
    options.map(options => ({locales: ['en'], options, kinds}))
  )
})

import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {
  parseDateTimeSkeleton,
  processDateTimePattern,
  splitRangePattern,
  splitFallbackRangePattern,
} from '#packages/ecma402-abstract/DateTimeFormat/skeleton.js'
import {BasicFormatMatcher} from '#packages/ecma402-abstract/DateTimeFormat/BasicFormatMatcher.js'
import {
  BestFitFormatMatcher,
  bestFitFormatMatcherScore,
} from '#packages/ecma402-abstract/DateTimeFormat/BestFitFormatMatcher.js'
import {DateTimeStyleFormat} from '#packages/ecma402-abstract/DateTimeFormat/DateTimeStyleFormat.js'
import {CalendarDateFromTime} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
import {DateTimeFormat as Reference} from '@formatjs/intl-datetimeformat'
import type {DateTimeFormatLocaleInternalData} from '#packages/ecma402-abstract/types/date-time.js'

type RawDateTimeLocaleData = Parameters<
  typeof Reference.__addLocaleData
>[number]

interface RawFormat {
  skeleton: string
  rawPattern?: string
  ranges?: Record<string, string>
  fallback?: string
}
function parse(raw: RawFormat) {
  return parseDateTimeSkeleton(
    raw.skeleton,
    raw.rawPattern,
    raw.ranges,
    raw.fallback
  )
}
function run<T = unknown>(requests: unknown[]): T[] {
  const executable = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/crates/intl_datetimeformat/pattern_conformance`
  )
  const result = spawnSync(executable, [], {
    input: requests.map(value => JSON.stringify(value)).join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  })
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const output = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line) as T)
  expect(output.length).toBe(requests.length)
  return output
}
function captured(callback: () => unknown): unknown {
  try {
    return callback()
  } catch (error) {
    return {error: (error as Error).name}
  }
}
it('matches LDML widths, quoting, Unicode whitespace and calendar interval fields', () => {
  const raw: RawFormat[] = []
  for (const token of 'GyYuUrQqMLwWdDFgEecabBhHKkjJCmsSAzZOvVXx')
    for (let width = 1; width <= 8; width++)
      raw.push({skeleton: token.repeat(width), rawPattern: token.repeat(width)})
  for (const pattern of [
    "EEEE, d 'de' MMMM y",
    "h 'o''clock' a",
    "'a' h:mm a",
    "''h'' a",
    "h 'unclosed",
    'h\u00a0a\u00a0z',
    '\ufeffH:mm\ufeff',
    '\u0085H:mm\u0085',
    '  a  ',
    'a h a',
    'r年U年MMMMd日',
    "y 'year' MMM 'month' d",
    '{1} at {0}',
    'j J C SSS',
  ])
    raw.push({skeleton: pattern, rawPattern: pattern})
  const intervals: Record<string, string>[] = [
    {y: 'y–y MMM d', d: 'MMM d–d, y'},
    {U: 'U年MMM d–d', r: 'r年MMM d–d'},
    {h: 'h:mm–h:mm a', B: 'h B–h B'},
  ]
  for (const skeleton of [
    'yMd',
    'yMMMd',
    'GyMMMd',
    'rUMMMd',
    'hm',
    'Hms',
    'Bhm',
  ])
    for (const ranges of intervals)
      raw.push({skeleton, rawPattern: skeleton, ranges, fallback: '{1} ～ {0}'})
  const actual = run(raw.map(value => ({method: 'parse', ...value})))
  for (let index = 0; index < raw.length; index++)
    expect(actual[index], JSON.stringify(raw[index])).toEqual(
      captured(() => parse(raw[index]))
    )
  const patterns = raw.map(value => value.rawPattern!)
  const processed = run(patterns.map(pattern => ({method: 'process', pattern})))
  for (let index = 0; index < patterns.length; index++) {
    const expected = captured(() => {
      const fields: Intl.DateTimeFormatOptions = {}
      const [pattern, pattern12] = processDateTimePattern(
        patterns[index],
        fields
      )
      return {pattern, pattern12, fields}
    })
    expect(processed[index], patterns[index]).toEqual(expected)
  }
})
it('matches shared/end-point interval sources and reversed fallback placeholders', () => {
  const patterns = [
    '{month} {day}–{day}, {year}',
    '{year}年{month}月{day}日～{day}日',
    '😀 {hour}:{minute} – {hour}:{minute} a',
    '{year}{year}{month}{month}',
    '{year} shared',
    '{year} unclosed {month',
    '{1} < {0}',
    '{0}--{1}--{0}',
    'literal only',
  ]
  for (const fallback of [false, true]) {
    const actual = run(
      patterns.map(pattern => ({method: 'split', pattern, fallback}))
    )
    for (let index = 0; index < patterns.length; index++)
      expect(actual[index], patterns[index]).toEqual(
        (fallback ? splitFallbackRangePattern : splitRangePattern)(
          patterns[index]
        )
      )
  }
})
const rawFormats: RawFormat[] = [
  ['yMd', 'M/d/y'],
  ['yMMMd', 'MMM d, y'],
  ['yMMMMd', 'd MMMM y'],
  ['yMMMEd', 'E, MMM d, y'],
  ['GyMMMd', 'G y MMM d'],
  ['Hm', 'HH:mm'],
  ['Hms', 'HH:mm:ss'],
  ['hm', 'h:mm a'],
  ['hms', 'h:mm:ss a'],
  ['ms', 'mm:ss'],
  ['m', 'mm'],
  ['s', 'ss'],
  ['Bh', 'h B'],
  ['Bhm', 'h:mm BBBB'],
  ['yM', 'y MMM'],
  ['e', 'EEE'],
  ['M', 'L'],
  ['MMMM', 'LLLL'],
  ['yMdHmsz', 'y-MM-dd HH:mm:ss z'],
  ['yMdHmszzzz', 'y-MM-dd HH:mm:ss zzzz'],
  ['rUMMMd', 'r年U年MMM d'],
  ['B', 'BBBBB'],
  ['G', 'GGGG'],
  ['EEEE', 'EEEE'],
  ['y', 'yy'],
].map(([skeleton, rawPattern]) => ({
  skeleton,
  rawPattern,
  ranges: {d: 'MMM d–d, y', h: 'h:mm–h:mm a'},
  fallback: '{0} – {1}',
}))
it('matches basic/best-fit selection, scores, field adjustment and hour preferences', () => {
  const formats = rawFormats.map(parse)
  const options: Intl.DateTimeFormatOptions[] = []
  for (const weekday of [undefined, 'long', 'narrow'] as const)
    for (const month of [
      undefined,
      'numeric',
      '2-digit',
      'short',
      'long',
      'narrow',
    ] as const)
      for (const hour of [undefined, 'numeric', '2-digit'] as const)
        for (const hour12 of [undefined, false, true])
          for (const timeZoneName of [
            undefined,
            'short',
            'long',
            'shortOffset',
            'longOffset',
            'shortGeneric',
            'longGeneric',
          ] as const) {
            const index = options.length
            options.push({
              weekday,
              month,
              hour,
              hour12,
              timeZoneName,
              year:
                index % 3 === 0
                  ? 'numeric'
                  : index % 3 === 1
                    ? '2-digit'
                    : undefined,
              day:
                index % 4 === 0
                  ? 'numeric'
                  : index % 4 === 1
                    ? '2-digit'
                    : undefined,
              minute:
                index % 3 === 0
                  ? 'numeric'
                  : index % 3 === 1
                    ? '2-digit'
                    : undefined,
              second:
                index % 5 === 0
                  ? 'numeric'
                  : index % 5 === 1
                    ? '2-digit'
                    : undefined,
              dayPeriod: ([undefined, 'short', 'long', 'narrow'] as const)[
                index % 4
              ],
              era: ([undefined, 'short', 'long', 'narrow'] as const)[
                Math.floor(index / 4) % 4
              ],
              fractionalSecondDigits: ([undefined, 1, 2, 3] as const)[
                Math.floor(index / 7) % 4
              ],
            })
          }
  const [actual] = run<unknown[]>([
    {method: 'batch', options, formats: rawFormats},
  ])
  expect(actual.length).toBe(options.length)
  for (let index = 0; index < options.length; index++) {
    const requested = options[index]
    expect(actual[index], JSON.stringify(requested)).toEqual({
      basic: BasicFormatMatcher(requested, formats),
      bestFit: BestFitFormatMatcher(requested, formats),
      scores: formats.map(format =>
        bestFitFormatMatcherScore(requested, format)
      ),
    })
  }
})
it('matches all date/time style combinations and opposite hour cycles without changing styles', () => {
  const date = {
    full: 'EEEE, MMMM d, y',
    long: 'MMMM d, y',
    medium: 'MMM d, y',
    short: 'M/d/yy',
  }
  const time = {
    full: 'h:mm:ss a zzzz',
    long: 'h:mm:ss a z',
    medium: 'h:mm:ss a',
    short: 'h:mm a',
  }
  const connector = {
    full: "{1} 'at' {0}",
    long: '{1}, {0}',
    medium: '{1} {0}',
    short: '{1}, {0}',
  }
  const rawData = {
    date: Object.fromEntries(
      Object.entries(date).map(([style, pattern]) => [
        style,
        {skeleton: pattern, ranges: {d: 'MMMM d–d, y'}, fallback: '{0} – {1}'},
      ])
    ),
    time: Object.fromEntries(
      Object.entries(time).map(([style, pattern]) => [
        style,
        {skeleton: pattern, ranges: {h: 'h:mm–h:mm a'}, fallback: '{0} – {1}'},
      ])
    ),
    connector: Object.fromEntries(
      Object.entries(connector).map(([style, pattern]) => [
        style,
        processDateTimePattern(pattern)[0],
      ])
    ),
  }
  const data = {
    dateFormat: Object.fromEntries(
      Object.entries(rawData.date).map(([style, raw]) => [style, parse(raw)])
    ),
    timeFormat: Object.fromEntries(
      Object.entries(rawData.time).map(([style, raw]) => [style, parse(raw)])
    ),
    dateTimeFormat: rawData.connector,
  } as DateTimeFormatLocaleInternalData
  const formats = rawFormats.map(parse),
    before = JSON.stringify(data)
  const requests: unknown[] = [],
    expected: unknown[] = []
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
      for (const hour12 of [undefined, false, true]) {
        if (dateStyle === undefined && timeStyle === undefined) continue
        requests.push({
          method: 'style',
          dateStyle,
          timeStyle,
          hour12,
          data: rawData,
          formats: rawFormats,
        })
        expected.push(
          DateTimeStyleFormat(dateStyle, timeStyle, data, formats, hour12)
        )
      }
  const actual = run(requests)
  for (let index = 0; index < expected.length; index++)
    expect(actual[index], JSON.stringify(requests[index])).toEqual(
      expected[index]
    )
  expect(JSON.stringify(data)).toBe(before)
})

it('matches real CLDR patterns and format matching across calendar and language families', () => {
  let patternCount = 0,
    calendarCount = 0
  for (const locale of ['en', 'fr', 'ar', 'ja', 'zh-Hans', 'ru', 'hi', 'he']) {
    const path = runfiles.resolve(
      `${process.env.TEST_WORKSPACE || '_main'}/packages/intl-datetimeformat/cldr-raw/${locale}.json`
    )
    const entry = JSON.parse(
      readFileSync(path, 'utf8')
    ) as RawDateTimeLocaleData
    const {data} = entry
    Reference.__addLocaleData(entry)
    const registered = Reference.localeData[locale]
    const calendarNameFields = [
      'era',
      'month',
      'monthStandalone',
      'yearNames',
      'leapMonthPatterns',
    ]
    const patternFields = [
      'dateFormat',
      'timeFormat',
      'dateTimeFormat',
      'formats',
      'intervalFormats',
      'calendarData',
    ]
    const [loaded] = run([
      {method: 'locale', json: JSON.stringify(entry), providers: []},
    ])
    expect(loaded, `${locale}/owned locale`).toEqual({
      locale: entry.locale,
      metadata: Object.fromEntries(
        Object.entries(data).filter(
          ([key]) =>
            !calendarNameFields.includes(key) && !patternFields.includes(key)
        )
      ),
      available: registered.ca,
      calendars: Object.fromEntries(
        Object.keys(registered.formats).map(calendar => {
          const fields = registered.calendarData?.[calendar] ?? registered
          return [
            calendar,
            {
              names: Object.fromEntries(
                Object.entries(fields).filter(([key]) =>
                  calendarNameFields.includes(key)
                )
              ),
              styles: {
                date: fields.dateFormat,
                time: fields.timeFormat,
                connector: fields.dateTimeFormat,
              },
              formats: registered.formats[calendar],
            },
          ]
        })
      ),
    })
    for (const [calendar, patterns] of Object.entries(data.formats)) {
      const calendarData = data.calendarData?.[calendar] ?? data
      const intervals = calendarData.intervalFormats
      const [prepared] = run([
        {method: 'calendar', data: {...calendarData, formats: patterns}},
      ])
      const referenceData = registered.calendarData?.[calendar] ?? registered
      expect(prepared, `${locale}/${calendar}/registration`).toEqual({
        formats: registered.formats[calendar],
        styles: {
          date: referenceData.dateFormat,
          time: referenceData.timeFormat,
          connector: referenceData.dateTimeFormat,
        },
      })
      const raw = Object.entries(patterns).map(
        ([skeleton, rawPattern]): RawFormat => ({
          skeleton,
          rawPattern,
          ranges:
            typeof intervals[skeleton] === 'object'
              ? intervals[skeleton]
              : undefined,
          fallback: intervals.intervalFormatFallback,
        })
      )
      const actual = run(raw.map(value => ({method: 'parse', ...value})))
      for (let index = 0; index < raw.length; index++) {
        expect(
          actual[index],
          `${locale}/${calendar}/${raw[index].skeleton}`
        ).toEqual(captured(() => parse(raw[index])))
      }
      const formats = raw.map(parse)
      const options: Intl.DateTimeFormatOptions[] = []
      for (const hour12 of [undefined, false, true])
        for (const month of [
          undefined,
          'numeric',
          '2-digit',
          'short',
          'long',
          'narrow',
        ] as const)
          for (const timeZoneName of [
            undefined,
            'short',
            'long',
            'shortOffset',
            'longOffset',
            'shortGeneric',
            'longGeneric',
          ] as const) {
            const index = options.length
            options.push({
              year: index % 3 === 0 ? '2-digit' : 'numeric',
              month,
              day: index % 2 === 0 ? 'numeric' : undefined,
              hour: index % 3 === 0 ? '2-digit' : 'numeric',
              hour12,
              minute: index % 2 === 0 ? '2-digit' : 'numeric',
              second: index % 3 === 0 ? 'numeric' : undefined,
              weekday: ([undefined, 'short', 'long', 'narrow'] as const)[
                index % 4
              ],
              timeZoneName,
            })
          }
      const [matched] = run<unknown[]>([
        {method: 'batch', options, formats: raw},
      ])
      for (let index = 0; index < options.length; index++) {
        const requested = options[index]
        expect(
          matched[index],
          `${locale}/${calendar}/${JSON.stringify(requested)}`
        ).toEqual({
          basic: BasicFormatMatcher(requested, formats),
          bestFit: BestFitFormatMatcher(requested, formats),
          scores: formats.map(format =>
            bestFitFormatMatcherScore(requested, format)
          ),
        })
      }
      patternCount += raw.length
      calendarCount++
    }
  }
  expect(calendarCount).toBe(120)
  expect(patternCount).toBeGreaterThan(70000)
}, 300000)

it('matches Gregorian/ISO calendar fields after timezone adjustment at Date bounds', () => {
  const milliseconds = [
    -8640000000000000 - 86399999,
    -8640000000000000,
    -62167219200000,
    -62135596800000,
    -1,
    0,
    1,
    951782400000,
    8640000000000000,
    8640000000000000 + 86399999,
  ]
  for (let index = 0; index < 128; index++)
    milliseconds.push(
      Math.floor(-8640000000000000 + index * (17280000000000000 / 127))
    )
  const requests = ['gregory', 'iso8601', 'not-loaded'].flatMap(calendar =>
    milliseconds.map(milliseconds => ({
      method: 'calendarFields',
      calendar,
      milliseconds,
    }))
  )
  const actual = run(requests)
  for (let index = 0; index < requests.length; index++) {
    const {calendar, milliseconds} = requests[index]
    expect(actual[index], `${calendar}/${milliseconds}`).toEqual(
      captured(() => CalendarDateFromTime(milliseconds, calendar))
    )
  }
})

it('loads optional calendar patterns lazily and advertises only calendars with arithmetic and formats', () => {
  const path = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/packages/intl-datetimeformat/cldr-raw/en.json`
  )
  const entry = JSON.parse(readFileSync(path, 'utf8')) as RawDateTimeLocaleData
  Reference.__addCalendarData({
    calendar: 'buddhist',
    dateFromTime: milliseconds => CalendarDateFromTime(milliseconds, 'gregory'),
  })
  const modified = structuredClone(entry)
  modified.data.formats.buddhist = {Q: 'Q'}
  modified.data.calendarData!.buddhist.dateFormat.full = 'Q'
  expect(() => Reference.__addLocaleData(modified)).not.toThrow()
  expect(() => Reference.localeData.en.formats.buddhist).toThrow(RangeError)
  const requests = [
    {
      method: 'locale',
      json: JSON.stringify(modified),
      providers: ['buddhist'],
      calendars: [],
    },
    {
      method: 'locale',
      json: JSON.stringify(modified),
      providers: ['buddhist'],
      calendars: ['buddhist'],
    },
  ]
  const [loaded, parsed] = run<{available: string[]} | {error: string}>(
    requests
  )
  expect(loaded).toMatchObject({available: Reference.localeData.en.ca})
  expect(parsed).toEqual({error: 'RangeError'})
  const baseOnly = structuredClone(entry)
  baseOnly.data.formats = {gregory: entry.data.formats.gregory}
  const [available] = run([
    {
      method: 'locale',
      json: JSON.stringify(baseOnly),
      providers: entry.data.ca,
      calendars: [],
    },
  ])
  Reference.__addLocaleData(baseOnly)
  expect(available).toMatchObject({available: Reference.localeData.en.ca})
  const invalidBase = structuredClone(entry)
  invalidBase.data.dateFormat.full = 'Q'
  expect(() => Reference.__addLocaleData(invalidBase)).toThrow(RangeError)
  expect(
    run([
      {
        method: 'locale',
        json: JSON.stringify(invalidBase),
        providers: [],
        calendars: [],
      },
    ])
  ).toEqual([{error: 'RangeError'}])
  Reference.__addLocaleData(entry)
})

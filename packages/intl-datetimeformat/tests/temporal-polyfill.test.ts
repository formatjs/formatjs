import 'temporal-polyfill/full/global'
import {Temporal} from 'temporal-polyfill/full'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import ko from '#packages/intl-datetimeformat/tests/locale-data/ko.json' with {type: 'json'}
import zh from '#packages/intl-datetimeformat/tests/locale-data/zh-Hans.json' with {type: 'json'}
import {expect, test} from 'vitest'

DateTimeFormat.__addLocaleData(en as any, ko as any, zh as any)

test('npm Temporal values work with all four formatting methods', () => {
  const formatter = new DateTimeFormat('en', {timeZone: 'UTC'})
  const start = new Temporal.PlainDate(2020, 2, 3)
  const end = new Temporal.PlainDate(2020, 2, 5)
  expect(formatter.format(start)).toBe('2/3/2020')
  expect(
    formatter
      .formatToParts(start)
      .map(part => part.value)
      .join('')
  ).toBe('2/3/2020')
  expect(formatter.formatRange(start, end)).toBe(
    formatter.formatRange(Date.UTC(2020, 1, 3), Date.UTC(2020, 1, 5))
  )
  expect(formatter.formatRangeToParts(start, end)).toEqual(
    formatter.formatRangeToParts(Date.UTC(2020, 1, 3), Date.UTC(2020, 1, 5))
  )
})

test('npm Temporal brands ignore instance properties', () => {
  const formatter = new DateTimeFormat('en', {timeZone: 'UTC'})
  const date = new Temporal.PlainDate(2020, 2, 3)
  for (const property of [
    'year',
    'month',
    'day',
    'calendarId',
    'toString',
    Symbol.toStringTag,
  ]) {
    Object.defineProperty(date, property, {
      get() {
        throw new Error('instance property read')
      },
    })
  }
  expect(formatter.format(date)).toBe('2/3/2020')
})

test('npm Temporal plain time ignores timezone; instant observes it', () => {
  const formatter = new DateTimeFormat('en', {
    timeZone: '+05:00',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  expect(formatter.format(new Temporal.PlainTime(12, 30))).toBe('12:30')
  expect(formatter.format(Temporal.Instant.from('2020-02-03T12:30Z'))).toBe(
    '17:30'
  )
})

test.each([
  'buddhist',
  'coptic',
  'ethiopic',
  'ethioaa',
  'roc',
  'indian',
  'islamic-civil',
  'islamic-tbla',
  'islamic-umalqura',
  'persian',
  'japanese',
  'hebrew',
  'chinese',
  'dangi',
])('%s uses its calendar fields and CLDR patterns', calendar => {
  for (const options of [
    {year: 'numeric', month: 'long', day: 'numeric', era: 'short'},
    {dateStyle: 'full'},
  ] as Intl.DateTimeFormatOptions[]) {
    const actual = new DateTimeFormat('en', {
      calendar,
      timeZone: 'UTC',
      ...options,
    })
    const expected = new Intl.DateTimeFormat('en', {
      calendar,
      timeZone: 'UTC',
      ...options,
    })
    expect(actual.resolvedOptions().calendar).toBe(calendar)
    for (const time of [
      Date.UTC(1989, 0, 7),
      Date.UTC(1989, 0, 8),
      Date.UTC(2019, 3, 30),
      Date.UTC(2019, 4, 1),
      Date.UTC(2020, 1, 29),
      Date.UTC(2024, 8, 10),
      Date.UTC(2024, 8, 11),
    ]) {
      expect(actual.formatToParts(time)).toEqual(expected.formatToParts(time))
      expect(actual.formatRange(time, time + 86400000)).toBe(
        expected.formatRange(time, time + 86400000)
      )
    }
  }
})

test.each(['chinese', 'dangi'])(
  '%s preserves cyclic years and leap-month markers across locales',
  calendar => {
    for (const locale of ['en', 'ko', 'zh-Hans']) {
      for (const month of [
        'numeric',
        '2-digit',
        'short',
        'long',
        'narrow',
      ] as const) {
        const options = {
          calendar,
          timeZone: 'UTC',
          year: 'numeric' as const,
          month,
          day: 'numeric' as const,
        }
        const actual = new DateTimeFormat(locale, options)
        const expected = new Intl.DateTimeFormat(locale, options)
        for (const time of [
          Date.UTC(2023, 2, 21),
          Date.UTC(2023, 2, 22),
          Date.UTC(2023, 3, 19),
          Date.UTC(2023, 3, 20),
        ]) {
          expect(
            actual.formatToParts(time),
            `${locale} ${month} ${new Date(time).toISOString()}`
          ).toEqual(expected.formatToParts(time))
          const actualRange = actual.formatRangeToParts(time, time + 86400000)
          const expectedStart = expected.formatToParts(time)
          const expectedEnd = expected.formatToParts(time + 86400000)
          // Interval selection differs across engines; verify endpoint values
          // and source attribution against independently formatted native dates.
          for (const part of actualRange) {
            if (part.type === 'literal') continue
            const endpoints =
              part.source === 'shared'
                ? [expectedStart, expectedEnd]
                : [part.source === 'startRange' ? expectedStart : expectedEnd]
            for (const endpoint of endpoints) {
              expect(
                endpoint,
                `${locale} ${month} ${part.source}`
              ).toContainEqual({type: part.type, value: part.value})
            }
          }
          for (const [source, endpoint] of [
            ['startRange', expectedStart],
            ['endRange', expectedEnd],
          ] as const) {
            for (const part of endpoint) {
              if (part.type === 'literal') continue
              expect(
                actualRange.some(
                  candidate =>
                    candidate.type === part.type &&
                    candidate.value === part.value &&
                    (candidate.source === source ||
                      candidate.source === 'shared')
                ),
                `${locale} ${month} retains ${source} ${part.type}`
              ).toBe(true)
            }
          }
        }
      }
    }
  }
)

test('Hebrew month names distinguish both Adars across common and leap years', () => {
  for (const month of [
    'numeric',
    '2-digit',
    'short',
    'long',
    'narrow',
  ] as const) {
    for (const withDay of [false, true]) {
      const options = {
        calendar: 'hebrew',
        timeZone: 'UTC',
        month,
        ...(withDay ? {day: 'numeric' as const} : {}),
      }
      const actual = new DateTimeFormat('en', options)
      const expected = new Intl.DateTimeFormat('en', options)
      for (const year of [2023, 2024]) {
        for (let isoMonth = 0; isoMonth < 12; isoMonth++) {
          for (const day of [1, 15, 28]) {
            const date = Date.UTC(year, isoMonth, day)
            expect(
              actual.formatToParts(date),
              new Date(date).toISOString()
            ).toEqual(expected.formatToParts(date))
          }
        }
      }
    }
  }
})

test.each([
  ['islamicc', 'islamic-civil'],
  ['ISLAMICC', 'islamic-civil'],
  ['ethiopic-amete-alem', 'ethioaa'],
  ['ISO8601', 'iso8601'],
])('calendar option %s resolves to %s', (calendar, canonical) => {
  const options = {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  } as const
  const formatter = new DateTimeFormat('en', {...options, calendar})
  const reference = new DateTimeFormat('en', {...options, calendar: canonical})
  expect(formatter.resolvedOptions().calendar).toBe(canonical)
  expect(formatter.formatToParts(Date.UTC(2024, 2, 11))).toEqual(
    reference.formatToParts(Date.UTC(2024, 2, 11))
  )
})

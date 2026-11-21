import {runfiles} from '@bazel/runfiles'
import {DurationFormat} from '#packages/intl-durationformat/index.js'
import {readFileSync} from 'node:fs'
import de from '#packages/intl-datetimeformat/tests/locale-data/de.json' with {type: 'json'}
import fr from '#packages/intl-datetimeformat/tests/locale-data/fr.json' with {type: 'json'}
import ja from '#packages/intl-datetimeformat/tests/locale-data/ja.json' with {type: 'json'}
import {afterAll, beforeAll, expect, test} from 'vitest'
import {configureLocaleFormatting} from '#packages/temporal/locale.js'
import packed from '@formatjs_generated/tz/all-tz.js'
import {Temporal} from '#packages/temporal/index.js'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import calendars from '#packages/intl-datetimeformat/calendars/all.js'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}

DateTimeFormat.__addTZData(packed)
DateTimeFormat.__addCalendarData(...calendars)
DateTimeFormat.__addLocaleData(en as any, de as any, fr as any, ja as any)
DateTimeFormat.__addTemporalNamespace(Temporal)

const clean = (text: string) => text.replaceAll('\u202f', ' ')
const NativeDateTimeFormat = Intl.DateTimeFormat
const originalDuration = Object.getOwnPropertyDescriptor(Intl, 'DurationFormat')
beforeAll(() => {
  Object.defineProperty(Intl, 'DurationFormat', {
    value: DurationFormat,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(Intl, 'DateTimeFormat', {
    value: DateTimeFormat,
    configurable: true,
    writable: true,
  })
  configureLocaleFormatting()
})
afterAll(() => {
  if (originalDuration)
    Object.defineProperty(Intl, 'DurationFormat', originalDuration)
  else Reflect.deleteProperty(Intl, 'DurationFormat')
  Object.defineProperty(Intl, 'DateTimeFormat', {
    value: NativeDateTimeFormat,
    configurable: true,
    writable: true,
  })
  configureLocaleFormatting()
})
const epoch = 1_580_725_840_321

test.each([
  [-544, '2'],
  [-543, '1'],
  [-542, '1'],
] as const)(
  'normalizes Buddhist display years for owned Temporal year %i',
  (year, displayYear) => {
    const date = new Temporal.PlainDate(year, 1, 1)
    const options = {
      calendar: 'buddhist',
      year: 'numeric',
      timeZone: 'UTC',
    } as const
    const formatter = new DateTimeFormat('en', options)
    expect(formatter.resolvedOptions().calendar).toBe('buddhist')
    expect(formatter.formatToParts(date as any)).toContainEqual({
      type: 'year',
      value: displayYear,
    })
    expect(date.toLocaleString('en', options)).toBe(`${displayYear} BE`)
  }
)

test('creates Temporal format parts without mutable Array.from', () => {
  const value = new Temporal.PlainDate(2020, 2, 3)
  const formatter = new DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
  const expected = formatter.formatToParts(value as any)
  const original = Array.from
  let actual: unknown, error: unknown
  try {
    Array.from = () => {
      throw new Error('Mutable array creation reached')
    }
    actual = formatter.formatToParts(value as any)
  } catch (caught) {
    error = caught
  } finally {
    Array.from = original
  }
  expect(error).toBeUndefined()
  expect(actual).toEqual(expected)
})

test('constructs and formats Temporal values without mutable isPrototypeOf', () => {
  const value = new Temporal.PlainDate(2020, 2, 3)
  const options = {timeZone: 'UTC'}
  const expected = new DateTimeFormat('en', options).format(value as any)
  const original = Object.prototype.isPrototypeOf
  let actual: unknown, error: unknown
  try {
    Object.prototype.isPrototypeOf = () => {
      throw new Error('Mutable prototype helper reached')
    }
    actual = new DateTimeFormat('en', options).format(value as any)
  } catch (caught) {
    error = caught
  } finally {
    Object.prototype.isPrototypeOf = original
  }
  expect(error).toBeUndefined()
  expect(actual).toBe(expected)
})

test('owned namespace brands work without replacing global Temporal', () => {
  const date = new Temporal.PlainDate(2020, 2, 3)
  const formatter = new DateTimeFormat('en', {timeZone: 'UTC'})
  expect(formatter.format(date)).toBe('2/3/2020')
  expect(
    formatter
      .formatToParts(date)
      .map(part => part.value)
      .join('')
  ).toBe('2/3/2020')
  const end = date.add({days: 2})
  expect(formatter.formatRange(date, end)).toBe(
    formatter.formatRange(Date.UTC(2020, 1, 3, 12), Date.UTC(2020, 1, 5, 12))
  )
  expect(formatter.formatRangeToParts(date, end)).toEqual(
    formatter.formatRangeToParts(
      Date.UTC(2020, 1, 3, 12),
      Date.UTC(2020, 1, 5, 12)
    )
  )
  for (const key of [
    'year',
    'month',
    'day',
    'calendarId',
    'toString',
    'valueOf',
    Symbol.toStringTag,
  ]) {
    Object.defineProperty(date, key, {
      get() {
        throw new Error('Instance property read')
      },
    })
  }
  expect(formatter.format(date)).toBe('2/3/2020')
  expect(() =>
    formatter.format({
      [Symbol.toStringTag]: 'Temporal.PlainDate',
      toString() {
        return '2020-02-03'
      },
    } as any)
  ).toThrow(RangeError)
})

test('intrinsic locale formatting applies defaults and calendar checks', () => {
  const ns = BigInt(epoch) * 1_000_000n
  const format = DateTimeFormat.__formatTemporal
  for (const [kind, options] of [
    ['PlainDate', {year: 'numeric', month: 'numeric', day: 'numeric'}],
    ['PlainTime', {hour: 'numeric', minute: 'numeric', second: 'numeric'}],
    [
      'PlainDateTime',
      {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      },
    ],
    [
      'Instant',
      {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      },
    ],
  ] as const) {
    expect(
      clean(
        format(
          {
            kind,
            calendar:
              kind === 'Instant' || kind === 'PlainTime'
                ? undefined
                : 'iso8601',
            epochNanoseconds: ns,
          },
          'en',
          {timeZone: 'UTC'}
        )
      )
    ).toBe(
      clean(
        new NativeDateTimeFormat('en', {...options, timeZone: 'UTC'}).format(
          epoch
        )
      )
    )
  }
  expect(() =>
    format({kind: 'PlainDate', calendar: 'hebrew', epochNanoseconds: ns}, 'en')
  ).toThrow(RangeError)
  expect(() =>
    format(
      {kind: 'PlainYearMonth', calendar: 'iso8601', epochNanoseconds: ns},
      'en'
    )
  ).toThrow(RangeError)
  expect(() =>
    format(
      {kind: 'PlainDate', calendar: 'iso8601', epochNanoseconds: ns},
      'en',
      {timeStyle: 'short'}
    )
  ).toThrow(TypeError)
  expect(() =>
    format({kind: 'PlainTime', epochNanoseconds: ns}, 'en', {
      dateStyle: 'short',
    })
  ).toThrow(TypeError)
})

test('zoned locale formatting supplies its timezone and rejects caller overrides before coercion', () => {
  const value = {
    kind: 'ZonedDateTime' as const,
    calendar: 'iso8601',
    epochNanoseconds: BigInt(epoch) * 1_000_000n,
    timeZone: 'America/New_York',
  }
  expect(clean(DateTimeFormat.__formatTemporal(value, 'en'))).toBe(
    clean(
      new NativeDateTimeFormat('en', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short',
      }).format(epoch)
    )
  )
  expect(() =>
    DateTimeFormat.__formatTemporal(value, 'en', {
      timeZone: {
        toString() {
          throw new Error('Offset coerced')
        },
      } as any,
    })
  ).toThrow(TypeError)
})

test('plain formatting retains nanoseconds beyond Date TimeClip', () => {
  const formatter = new DateTimeFormat('en', {
    calendar: 'gregory',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    era: 'short',
  })
  const value = Temporal.PlainDate.from('-271821-04-19')
  expect(formatter.format(value)).toBe('4/19/271822 BC')
})

test('public locale methods use captured formatter intrinsics and private slots', () => {
  const values = [
    [new Temporal.PlainDate(2020, 2, 3), '2/3/2020'],
    [new Temporal.PlainTime(12, 34, 56), '12:34:56\u202fPM'],
    [
      new Temporal.PlainDateTime(2020, 2, 3, 12, 34, 56),
      '2/3/2020, 12:34:56\u202fPM',
    ],
    [new Temporal.PlainYearMonth(2020, 2, 'gregory'), '2/2020'],
    [new Temporal.PlainMonthDay(2, 3, 'gregory'), '2/3'],
    [
      Temporal.Instant.from('2020-02-03T12:34:56Z'),
      '2/3/2020, 12:34:56\u202fPM',
    ],
    [
      Temporal.ZonedDateTime.from('2020-02-03T12:34:56Z[UTC]'),
      '2/3/2020, 12:34:56\u202fPM UTC',
    ],
  ] as const
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'DateTimeFormat')!
  try {
    Object.defineProperty(Intl, 'DateTimeFormat', {
      value: function () {
        throw new Error('Mutable constructor used')
      },
      configurable: true,
    })
    for (const [value, expected] of values) {
      for (const key of [
        'calendarId',
        'timeZoneId',
        'epochNanoseconds',
        'toString',
        'valueOf',
      ]) {
        Object.defineProperty(value, key, {
          get() {
            throw new Error('Instance property read')
          },
        })
      }
      expect(value.toLocaleString('en')).toBe(expected)
    }
  } finally {
    Object.defineProperty(Intl, 'DateTimeFormat', descriptor)
  }
})

test('public locale formatting matches independent ICU styles and skeletons', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-locale-fixtures.tsv`
  )
  let count = 0
  const mismatches: string[] = []
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [kind, locale, zone, milliseconds, rawOptions, expected] =
      line.split('\t')
    const ns = BigInt(milliseconds) * 1_000_000n
    const utc = new Temporal.ZonedDateTime(ns, 'UTC')
    const date = utc.toPlainDate().withCalendar('gregory')
    const value =
      kind === 'PlainDate'
        ? date
        : kind === 'PlainTime'
          ? utc.toPlainTime()
          : kind === 'PlainDateTime'
            ? utc.toPlainDateTime().withCalendar('gregory')
            : kind === 'PlainYearMonth'
              ? date.toPlainYearMonth()
              : kind === 'PlainMonthDay'
                ? date.toPlainMonthDay()
                : kind === 'Instant'
                  ? Temporal.Instant.fromEpochMilliseconds(Number(milliseconds))
                  : new Temporal.ZonedDateTime(ns, zone, 'gregory')
    const actual = value.toLocaleString(locale, JSON.parse(rawOptions))
    if (actual !== expected) mismatches.push(`${line}\tactual=${actual}`)
    count++
  }
  if (mismatches.length)
    console.error(
      'ICU locale differences',
      mismatches.length,
      JSON.stringify(mismatches)
    )
  expect(mismatches.slice(0, 20)).toEqual([])
  expect(count).toBe(768)
})

test('fixed-offset locale names follow current CLDR, including numeric zero', () => {
  for (const [zone, expected] of [
    ['+00:00', 'GMT+0'],
    ['+01:00', 'GMT+1'],
    ['-01:00', 'GMT-1'],
    ['+05:30', 'GMT+5:30'],
    ['-00:30', 'GMT-0:30'],
  ]) {
    expect(new Temporal.ZonedDateTime(0n, zone).toLocaleString('en')).toContain(
      expected
    )
  }
})

test('Duration locale formatting ignores shadowed public fields', () => {
  const value = Temporal.Duration.from('PT1H2M3.004005006S')
  for (const key of [
    'hours',
    'minutes',
    'seconds',
    'milliseconds',
    'microseconds',
    'nanoseconds',
    'toString',
    'valueOf',
  ]) {
    Object.defineProperty(value, key, {
      get() {
        throw new Error('Instance property read')
      },
    })
  }
  expect(
    value.toLocaleString('en', {style: 'digital', fractionalDigits: 9})
  ).toBe('1:02:03.004005006')
})

test.each(['every', 'some', 'includes', 'indexOf'] as const)(
  'owned formatters ignore replaced private-list %s operations',
  name => {
    const start = new Temporal.PlainDate(2024, 2, 29)
    const end = new Temporal.PlainDate(2024, 3, 1)
    const rangeFormatter = new DateTimeFormat('en', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    const expectedRange = rangeFormatter.formatRange(start, end)
    const original = Object.getOwnPropertyDescriptor(Array.prototype, name)!
    const originalApply = Reflect.apply
    const failure = {message: 'Mutable provider array predicate reached'}
    let actual: unknown
    try {
      Reflect.apply = function () {
        throw failure
      }
      Object.defineProperty(Array.prototype, name, {
        ...original,
        value: function () {
          throw failure
        },
      })
      const date = new Temporal.PlainDate(2024, 2, 29)
      actual = [
        new DateTimeFormat('en', {timeZone: 'UTC', year: 'numeric'}).format(
          date
        ),
        date.toLocaleString('en', {year: 'numeric'}),
        new Temporal.Duration(0, 0, 0, 0, 2).toLocaleString('en', {
          style: 'long',
        }),
        rangeFormatter.formatRange(start, end),
      ]
    } finally {
      Reflect.apply = originalApply
      Object.defineProperty(Array.prototype, name, original)
    }
    expect(actual).toEqual(['2024', '2024', '2 hours', expectedRange])
  }
)

test.each([
  ['cold constructor', {year: 'numeric'}, true],
  ['default fields', {}, false],
  ['basic components', {year: 'numeric', formatMatcher: 'basic'}, false],
  ['style fields', {dateStyle: 'short'}, false],
] as const)(
  '%s private records ignore mutable Object.assign',
  (_name, options, cold) => {
    const value = new Temporal.PlainDate(2024, 2, 29)
    const construct = () =>
      new DateTimeFormat('en', {timeZone: 'UTC', ...options})
    const expected = construct().format(value)
    const ready = cold ? undefined : construct()
    const original = Object.getOwnPropertyDescriptor(Object, 'assign')!
    let actual: unknown
    try {
      Object.defineProperty(Object, 'assign', {
        configurable: true,
        get() {
          throw new Error('Mutable formatter Object.assign reached')
        },
      })
      actual = (ready ?? construct()).format(value)
    } finally {
      Object.defineProperty(Object, 'assign', original)
    }
    expect(actual).toBe(expected)
  }
)

test('Temporal format slots bypass inherited setters', () => {
  const value = new Temporal.PlainDate(2024, 2, 29)
  const options = {
    timeZone: 'UTC',
    year: 'numeric',
    formatMatcher: 'basic',
  } as const
  const expected = new DateTimeFormat('en', options).format(value)
  const ready = new DateTimeFormat('en', options)
  const original = Object.getOwnPropertyDescriptor(Object.prototype, 'era')
  let actual: unknown
  try {
    Object.defineProperty(Object.prototype, 'era', {
      configurable: true,
      set() {
        throw new Error('Inherited formatter slot setter reached')
      },
    })
    actual = ready.format(value)
  } finally {
    if (original) Object.defineProperty(Object.prototype, 'era', original)
    else Reflect.deleteProperty(Object.prototype, 'era')
  }
  expect(actual).toBe(expected)
})

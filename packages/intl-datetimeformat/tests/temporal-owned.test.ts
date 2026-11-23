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

type DateTimeFormatParts = ReturnType<
  InstanceType<typeof DateTimeFormat>['formatToParts']
>

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

test.each(['aMeRiCa/nEw_YoRk', '+0530'])(
  'constructs a Temporal formatter for %s without mutable lookup hooks',
  timeZone => {
    const instant = new Temporal.Instant(0n)
    const reference = new DateTimeFormat('en', {timeZone})
    const hooks = [
      [String.prototype, 'charCodeAt'],
      [String.prototype, 'toUpperCase'],
      [RegExp.prototype, 'test'],
      [RegExp.prototype, 'exec'],
      [Array.prototype, 'map'],
      [Array.prototype, 'forEach'],
      [Object, 'keys'],
      [globalThis, 'parseInt'],
    ] as const
    const define = Object.defineProperty
    const descriptors = hooks.map(([owner, key]) =>
      Object.getOwnPropertyDescriptor(owner, key)!
    )
    let formatter
    try {
      for (let index = 0; index < hooks.length; index++) {
        const [owner, key] = hooks[index]
        define(owner, key, {
          ...descriptors[index],
          value() {
            throw new Error(`Unexpected timezone lookup hook ${key}`)
          },
        })
      }
      formatter = new DateTimeFormat('en', {timeZone})
    } finally {
      for (let index = 0; index < hooks.length; index++) {
        const [owner, key] = hooks[index]
        define(owner, key, descriptors[index])
      }
    }
    expect(formatter.resolvedOptions().timeZone).toBe(
      reference.resolvedOptions().timeZone
    )
    expect(formatter.format(instant)).toBe(reference.format(instant))
  }
)

test('caches the bound formatter without a mutable Object.defineProperty hook', () => {
  const options = {timeZone: 'UTC'}
  const instant = new Temporal.Instant(0n)
  const expected = new DateTimeFormat('en', options).format(instant)
  const formatter = new DateTimeFormat('en', options)
  const originalDefineProperty = Object.defineProperty
  let calls = 0
  let bound
  try {
    Object.defineProperty = () => {
      calls++
      throw new Error('Unexpected mutable Object.defineProperty')
    }
    bound = formatter.format
  } finally {
    Object.defineProperty = originalDefineProperty
  }
  expect(calls).toBe(0)
  expect(bound).toBe(formatter.format)
  expect(bound.name).toBe('')
  expect(bound.length).toBe(1)
  expect(bound(instant)).toBe(expected)
})

test('allocates owned Temporal formatters without a mutable Object.create hook', () => {
  const value = new Temporal.ZonedDateTime(0n, 'UTC')
  const expected = value.toLocaleString('en')
  const originalCreate = Object.create
  let actual
  try {
    Object.create = () => {
      throw new Error('Unexpected Object.create call')
    }
    actual = value.toLocaleString('en')
  } finally {
    Object.create = originalCreate
  }
  expect(actual).toBe(expected)
})

test('throws the intrinsic RangeError for a ZonedDateTime calendar mismatch', () => {
  const value = new Temporal.ZonedDateTime(0n, 'UTC', 'gregory')
  const originalRangeError = RangeError
  let actual: unknown
  try {
    globalThis.RangeError = new Proxy(originalRangeError, {
      construct() {
        return new Error('Unexpected global RangeError')
      },
    })
    value.toLocaleString('en', {calendar: 'iso8601'})
  } catch (error) {
    actual = error
  } finally {
    globalThis.RangeError = originalRangeError
  }
  expect(actual).toBeInstanceOf(originalRangeError)
})

test('rejects missing range endpoints with the intrinsic TypeError', () => {
  const formatter = new DateTimeFormat('en', {timeZone: 'UTC'})
  const OriginalTypeError = TypeError
  let reads = 0
  const endpoint = {
    [Symbol.toPrimitive]() {
      reads++
      return 0
    },
  }
  const errors: unknown[] = []
  try {
    globalThis.TypeError = new Proxy(OriginalTypeError, {
      construct() {
        return new Error('Unexpected global TypeError')
      },
    })
    for (const operation of [
      () => formatter.formatRange(endpoint as any, undefined as any),
      () => formatter.formatRangeToParts(undefined as any, endpoint as any),
    ]) {
      try {
        operation()
      } catch (error) {
        errors.push(error)
      }
    }
  } finally {
    globalThis.TypeError = OriginalTypeError
  }
  expect(reads).toBe(0)
  expect(errors).toHaveLength(2)
  for (const error of errors) expect(error).toBeInstanceOf(OriginalTypeError)
})

test.each(['formatRange', 'formatRangeToParts'] as const)(
  '%s rejects an uninitialized receiver before converting endpoints',
  method => {
    const originalTypeError = TypeError
    let converted = false
    const endpoint = {
      [Symbol.toPrimitive]() {
        converted = true
        return 0
      },
    }
    let actual: unknown
    try {
      globalThis.TypeError = new Proxy(originalTypeError, {
        construct() {
          return new Error('Unexpected global TypeError')
        },
      })
      Reflect.apply(DateTimeFormat.prototype[method], {}, [endpoint, 0])
    } catch (error) {
      actual = error
    } finally {
      globalThis.TypeError = originalTypeError
    }
    expect(actual).toBeInstanceOf(originalTypeError)
    expect(converted).toBe(false)
  }
)

test('compares PlainDateTime ranges in the display zone across a formatter DST fold', () => {
  const formatter = new DateTimeFormat('en', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const start = Temporal.PlainDateTime.from('2024-11-03T05:30')
  const end = Temporal.PlainDateTime.from('2024-11-03T06:30')
  const hours = formatter
    .formatRangeToParts(start, end)
    .filter(part => part.type === 'hour')
  expect(hours).toEqual([
    {type: 'hour', value: '05', source: 'startRange'},
    {type: 'hour', value: '06', source: 'endRange'},
  ])
})

test.each([
  ['Array.find', Array.prototype, 'find'],
  ['Array.map', Array.prototype, 'map'],
  ['Array.join', Array.prototype, 'join'],
  ['Array.push', Array.prototype, 'push'],
  ['Array iterator', Array.prototype, Symbol.iterator],
  ['String.includes', String.prototype, 'includes'],
  ['Math.max', Math, 'max'],
  ['Math.floor', Math, 'floor'],
] as const)(
  'formats private range parts without replacement %s',
  (_, target, property) => {
    const formatter = new DateTimeFormat('en', {
      timeZone: 'UTC',
      second: 'numeric',
      fractionalSecondDigits: 3,
    })
    const start = Temporal.PlainDateTime.from('1970-01-01T00:00:00.123')
    const end = Temporal.PlainDateTime.from('1970-01-01T00:00:00.456')
    const expected = formatter.formatRangeToParts(start as any, end as any)
    expect(expected.filter(part => part.type === 'fractionalSecond')).toEqual([
      {type: 'fractionalSecond', value: '123', source: 'startRange'},
      {type: 'fractionalSecond', value: '456', source: 'endRange'},
    ])
    const original = Object.getOwnPropertyDescriptor(target, property)!
    let calls = 0
    let actual
    try {
      Object.defineProperty(target, property, {
        ...original,
        value() {
          calls++
          throw new Error('Replacement invoked during range formatting')
        },
      })
      actual = formatter.formatRangeToParts(start as any, end as any)
    } finally {
      Object.defineProperty(target, property, original)
    }
    expect(calls).toBe(0)
    expect(actual).toEqual(expected)
  }
)

test.each([
  ['collapsed', 'source', 'formatRange', 'set'],
  ['collapsed', 'source', 'formatRangeToParts', 'set'],
  ['distinct', 'source', 'formatRange', 'set'],
  ['distinct', 'source', 'formatRangeToParts', 'set'],
  ['distinct', 'localTime', 'formatRange', 'set'],
  ['distinct', 'localTime', 'formatRangeToParts', 'set'],
  ['collapsed', 'numberFormatters', 'formatRange', 'set'],
  ['distinct', 'numberFormatters', 'formatRangeToParts', 'get'],
  ['collapsed', 'fractionalSecondDigits', 'formatRangeToParts', 'get'],
  ['distinct', 'fractionalSecondDigits', 'formatRange', 'get'],
  ['distinct', 'weekdayStandalone', 'formatRangeToParts', 'get'],
  ['cold distinct', 'weekdayStandalone', 'formatRange', 'get'],
  ['cold distinct', 'timeZoneName', 'formatRangeToParts', 'get'],
  ['time distinct', 'monthStandalone', 'formatRange', 'get'],
] as const)(
  'formats %s Temporal ranges without inherited %s (%s, %s)',
  (kind, property, method, accessor) => {
    const construct = () =>
      new DateTimeFormat(
        'en',
        kind === 'time distinct'
          ? {timeZone: 'UTC', hour: 'numeric'}
          : {
              timeZone: 'UTC',
              year: 'numeric',
              month: kind === 'cold distinct' ? 'short' : 'numeric',
              day: 'numeric',
            }
      )
    const start =
      kind === 'time distinct'
        ? new Temporal.PlainTime(10)
        : new Temporal.PlainDate(1970, 1, 1)
    const end =
      kind === 'collapsed'
        ? start
        : kind === 'time distinct'
          ? new Temporal.PlainTime(12)
          : new Temporal.PlainDate(1970, 1, 2)
    const control = construct()
    const expected = control[method](start as any, end as any)
    const formatter = kind === 'cold distinct' ? construct() : control
    const original = Object.getOwnPropertyDescriptor(Object.prototype, property)
    let calls = 0,
      actual: unknown,
      error: unknown
    try {
      Object.defineProperty(Object.prototype, property, {
        configurable: true,
        [accessor]() {
          calls++
          throw new Error(`Inherited range ${property} accessor`)
        },
      })
      actual = formatter[method](start as any, end as any)
    } catch (caught) {
      error = caught
    } finally {
      if (original) Object.defineProperty(Object.prototype, property, original)
      else Reflect.deleteProperty(Object.prototype, property)
    }
    expect(calls).toBe(0)
    expect(error).toBeUndefined()
    expect(actual).toEqual(expected)
  }
)

test.each(['get', 'set'] as const)(
  'formats owned Temporal values without WeakMap.prototype.%s',
  method => {
    const value = new Temporal.PlainDate(2024, 1, 2)
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    } as const
    for (const warm of [false, true]) {
      const formatter = new DateTimeFormat('en', options)
      if (warm) formatter.formatToParts(value as any)
      const original = WeakMap.prototype[method]
      let actual: string[] | undefined, error: unknown
      try {
        WeakMap.prototype[method] = () => {
          throw new Error(`Mutable WeakMap.${method}`)
        }
        actual = [
          formatter.format(value as any),
          formatter
            .formatToParts(value as any)
            .map(part => part.value)
            .join(''),
          value.toLocaleString('en', options),
        ]
      } catch (caught) {
        error = caught
      } finally {
        Object.defineProperty(WeakMap.prototype, method, {value: original})
      }
      expect(error, `warm=${warm}: ${(error as Error)?.stack}`).toBeUndefined()
      expect(actual).toEqual(Array(3).fill('01/02/2024'))
    }
  }
)

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

test.each([false, true])(
  'Temporal numeric producer uses private options, warm=%s',
  warm => {
    const value = new Temporal.PlainDateTime(2024, 2, 29, 12, 34, 56, 789)
    const formatter = new DateTimeFormat('en', {
      timeZone: 'UTC',
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
    if (warm) formatter.formatToParts(value)
    const original = Object.create
    let actual: unknown, error: unknown
    try {
      Object.create = () => {
        throw new Error('Mutable producer Object.create')
      }
      actual = formatter.formatToParts(value)
    } catch (caught) {
      error = caught
    } finally {
      Object.create = original
    }
    if (error) throw error
    expect(actual).toEqual([
      {type: 'hour', value: '12'},
      {type: 'literal', value: ':'},
      {type: 'minute', value: '34'},
      {type: 'literal', value: ':'},
      {type: 'second', value: '56'},
      {type: 'literal', value: '.'},
      {type: 'fractionalSecond', value: '789'},
    ])
  }
)

test.each([false, true])(
  'Temporal numeric producer avoids late NumberFormat getters, warm=%s',
  warm => {
    const numberingSystem = warm ? 'mathdbl' : 'mathsans'
    const formatter = new DateTimeFormat('en', {
      timeZone: 'UTC',
      year: 'numeric',
      numberingSystem,
    })
    const value = new Temporal.PlainDate(2024, 2, 29)
    if (warm) formatter.formatToParts(value)
    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!
    const define = Object.defineProperty
    let actual: unknown,
      error: unknown,
      calls = 0
    try {
      define(Intl, 'NumberFormat', {
        configurable: true,
        get() {
          calls++
          throw new Error('Mutable producer NumberFormat getter')
        },
      })
      actual = formatter.formatToParts(value)
    } catch (caught) {
      error = caught
    } finally {
      define(Intl, 'NumberFormat', descriptor)
    }
    if (error) throw error
    expect(calls).toBe(0)
    expect(actual).toEqual([{type: 'year', value: warm ? '𝟚𝟘𝟚𝟜' : '𝟤𝟢𝟤𝟦'}])
  }
)

// Real engine providers; observable digit output checks lazy provider selection and profile reuse.
test('Temporal numeric producers retain late supplied providers after first rendering', () => {
  const Original = Intl.NumberFormat
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!
  class FirstProvider extends Original {
    constructor(
      locales?: Intl.LocalesArgument,
      options?: Intl.NumberFormatOptions
    ) {
      super(locales, {...options, numberingSystem: 'arab'})
    }
  }
  class SecondProvider extends Original {
    constructor(
      locales?: Intl.LocalesArgument,
      options?: Intl.NumberFormatOptions
    ) {
      super(locales, {...options, numberingSystem: 'latn'})
    }
  }
  const value = new Temporal.PlainDate(2024, 2, 29)
  const first = new DateTimeFormat('en', {timeZone: 'UTC', year: 'numeric'})
  const second = new DateTimeFormat('en', {timeZone: 'UTC', year: 'numeric'})
  let firstText: string | undefined,
    secondText: string | undefined,
    retainedText: string | undefined
  try {
    Intl.NumberFormat = FirstProvider as unknown as typeof Original
    firstText = first.format(value)
    Intl.NumberFormat = SecondProvider as unknown as typeof Original
    secondText = second.format(value)
    retainedText = first.format(value)
  } finally {
    Object.defineProperty(Intl, 'NumberFormat', descriptor)
  }
  expect(firstText).toBe('٢٠٢٤')
  expect(secondText).toBe('2024')
  expect(retainedText).toBe('٢٠٢٤')
})

test('Temporal day periods ignore mutable Array.find', () => {
  const formatter = new DateTimeFormat('en', {
    timeZone: 'UTC',
    dayPeriod: 'long',
  })
  const exact = new Temporal.PlainTime(12)
  const interval = new Temporal.PlainTime(18)
  const original = Array.prototype.find
  let actual: unknown, error: unknown
  try {
    Array.prototype.find = () => {
      throw new Error('Mutable producer Array.find')
    }
    actual = [formatter.formatToParts(exact), formatter.formatToParts(interval)]
  } catch (caught) {
    error = caught
  } finally {
    Array.prototype.find = original
  }
  expect(error).toBeUndefined()
  expect(actual).toEqual([
    [{type: 'dayPeriod', value: 'noon'}],
    [{type: 'dayPeriod', value: 'in the evening'}],
  ])
})

test.each([
  'replace',
  'split',
  'indexOf',
  'lastIndexOf',
  'slice',
  'replaceAll',
  Symbol.split,
] as const)('Temporal GMT producer ignores mutable String.%s', method => {
  const positive = new DateTimeFormat('en', {
    timeZone: '+05:30',
    timeZoneName: 'longOffset',
  })
  const negative = new DateTimeFormat('en', {
    timeZone: '-01:00',
    timeZoneName: 'shortOffset',
  })
  const value = new Temporal.Instant(0n)
  const original = Object.getOwnPropertyDescriptor(String.prototype, method)
  let actual: DateTimeFormatParts[] | undefined, error: unknown
  try {
    Object.defineProperty(String.prototype, method, {
      configurable: true,
      writable: true,
      ...original,
      value() {
        throw new Error('Mutable GMT string method')
      },
    })
    actual = [positive.formatToParts(value), negative.formatToParts(value)]
  } catch (caught) {
    error = caught
  } finally {
    if (original) Object.defineProperty(String.prototype, method, original)
    else Reflect.deleteProperty(String.prototype, method)
  }
  expect(error).toBeUndefined()
  expect(
    actual!.map(parts => parts.filter(part => part.type === 'timeZoneName'))
  ).toEqual([
    [{type: 'timeZoneName', value: 'GMT+05:30'}],
    [{type: 'timeZoneName', value: 'GMT-1'}],
  ])
})

test('Temporal leap month producer ignores mutable String.replace', () => {
  const formatter = new DateTimeFormat('en-u-ca-chinese', {
    timeZone: 'UTC',
    month: 'long',
  })
  const value = new Temporal.Instant(1_679_443_200_000_000_000n)
  expect(formatter.resolvedOptions().calendar).toBe('chinese')
  const original = String.prototype.replace
  let actual: unknown, error: unknown
  try {
    String.prototype.replace = () => {
      throw new Error('Mutable leap month replacement')
    }
    actual = formatter.formatToParts(value)
  } catch (caught) {
    error = caught
  } finally {
    String.prototype.replace = original
  }
  expect(error).toBeUndefined()
  expect(actual).toEqual([{type: 'month', value: 'Second Monthbis'}])
})

test.each(['exec', Symbol.replace] as const)(
  'Temporal GMT producer ignores mutable RegExp %s',
  key => {
    const formatter = new DateTimeFormat('en', {
      timeZone: '+05:30',
      timeZoneName: 'shortOffset',
    })
    const value = new Temporal.Instant(0n)
    const original = Object.getOwnPropertyDescriptor(RegExp.prototype, key)!
    let actual: DateTimeFormatParts | undefined, error: unknown
    try {
      Object.defineProperty(RegExp.prototype, key, {
        ...original,
        value() {
          throw new Error('Mutable GMT RegExp operation')
        },
      })
      actual = formatter.formatToParts(value)
    } catch (caught) {
      error = caught
    } finally {
      Object.defineProperty(RegExp.prototype, key, original)
    }
    expect(error).toBeUndefined()
    expect(actual!.filter(part => part.type === 'timeZoneName')).toEqual([
      {type: 'timeZoneName', value: 'GMT+5:30'},
    ])
  }
)

test.each([false, true])(
  'Temporal numeric fields retain bound NumberFormat format getters, warm=%s',
  warm => {
    const Original = Intl.NumberFormat
    class FreshNumericProvider extends Original {}
    const providerDescriptor = Object.getOwnPropertyDescriptor(
      Intl,
      'NumberFormat'
    )!
    const formatDescriptor = Object.getOwnPropertyDescriptor(
      Original.prototype,
      'format'
    )!
    const define = Object.defineProperty
    const value = new Temporal.PlainDateTime(2024, 1, 2, 3, 4, 5, 6)
    const chineseValue = new Temporal.PlainDate(2024, 2, 10)
    let text: string | undefined,
      parts: DateTimeFormatParts | undefined,
      related: DateTimeFormatParts | undefined,
      error: unknown,
      hooks = 0
    try {
      define(Intl, 'NumberFormat', {
        ...providerDescriptor,
        value: FreshNumericProvider,
      })
      const formatter = new DateTimeFormat('en', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hourCycle: 'h23',
      })
      const chinese = new DateTimeFormat('en', {
        timeZone: 'UTC',
        calendar: 'chinese',
        year: 'numeric',
      })
      if (warm) {
        formatter.formatToParts(value)
        chinese.formatToParts(chineseValue)
      }
      define(Original.prototype, 'format', {
        ...formatDescriptor,
        get() {
          hooks++
          throw new Error('Mutable numeric format getter')
        },
      })
      text = formatter.format(value)
      parts = formatter.formatToParts(value)
      related = chinese.formatToParts(chineseValue)
    } catch (caught) {
      error = caught
    } finally {
      define(Original.prototype, 'format', formatDescriptor)
      define(Intl, 'NumberFormat', providerDescriptor)
    }
    if (error) throw error
    expect(hooks).toBe(0)
    expect(text).toBe('01/02/2024, 03:04:05.006')
    expect(parts).toEqual([
      {type: 'month', value: '01'},
      {type: 'literal', value: '/'},
      {type: 'day', value: '02'},
      {type: 'literal', value: '/'},
      {type: 'year', value: '2024'},
      {type: 'literal', value: ', '},
      {type: 'hour', value: '03'},
      {type: 'literal', value: ':'},
      {type: 'minute', value: '04'},
      {type: 'literal', value: ':'},
      {type: 'second', value: '05'},
      {type: 'literal', value: '.'},
      {type: 'fractionalSecond', value: '006'},
    ])
    expect(related!.filter(part => part.type === 'relatedYear')).toEqual([
      {type: 'relatedYear', value: '2024'},
    ])
  }
)

test.each(['parts', 'includes', 'replaceAll', 'find', Symbol.replace] as const)(
  'cold Temporal fractional-second pattern ignores private %s lookup',
  key => {
    const options = {
      timeZone: 'UTC',
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    } as const
    const value = new Temporal.PlainTime(12, 34, 56, 789)
    const reference = new DateTimeFormat('en', options)
    const expectedParts = reference.formatToParts(value)
    const formatter = new DateTimeFormat('en', options)
    const owner =
      key === 'parts'
        ? Intl.NumberFormat.prototype
        : key === 'find'
          ? Array.prototype
          : String.prototype
    const property = key === 'parts' ? 'formatToParts' : key
    const descriptor = Object.getOwnPropertyDescriptor(owner, property)
    const define = Object.defineProperty
    let text: string | undefined,
      parts: unknown,
      error: unknown,
      calls = 0
    try {
      define(owner, property, {
        configurable: true,
        get() {
          calls++
          throw new Error('Private fractional-second pattern lookup')
        },
      })
      text = formatter.format(value)
      parts = formatter.formatToParts(value)
    } catch (caught) {
      error = caught
    } finally {
      if (descriptor) define(owner, property, descriptor)
      else Reflect.deleteProperty(owner, property)
    }
    if (error) throw error
    expect(calls).toBe(0)
    expect(text).toBe('12:34:56.789')
    expect(parts).toEqual(expectedParts)
  }
)

for (const warm of [false, true])
  test.each([
    'keys',
    'map',
    Symbol.iterator,
    'startsWith',
    'endsWith',
  ] as const)(
    `selected Temporal interval metadata uses private %s operations, warm=${warm}`,
    key => {
      // Instant permits all time-style fields, so selection reuses the chosen style
      // without invoking an unrelated format matcher before interval adaptation.
      const formatter = new DateTimeFormat('en', {
        timeZone: 'UTC',
        hourCycle: 'h23',
        timeStyle: 'long',
      })
      const value = new Temporal.Instant(0n)
      const expectedParts = new DateTimeFormat('en', {
        timeZone: 'UTC',
        hourCycle: 'h23',
        timeStyle: 'long',
      }).formatToParts(value)
      if (warm) formatter.format(value)
      const owner =
        key === 'keys'
          ? Object
          : key === 'map' || key === Symbol.iterator
            ? Array.prototype
            : String.prototype
      const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
      const define = Object.defineProperty
      let text: string | undefined,
        parts: unknown,
        error: unknown,
        calls = 0
      try {
        define(owner, key, {
          ...descriptor,
          value() {
            calls++
            throw new Error('Private selected interval metadata hook')
          },
        })
        text = formatter.format(value)
        parts = formatter.formatToParts(value)
      } catch (caught) {
        error = caught
      } finally {
        define(owner, key, descriptor)
      }
      if (error) throw error
      expect(calls).toBe(0)
      expect(text).toBe('00:00:00 UTC')
      expect(parts).toEqual(expectedParts)
    }
  )

for (const formatMatcher of ['basic', 'best fit'] as const)
  for (const warm of [false, true])
    test.each(['iterator', 'isArray', 'min', 'max'] as const)(
      `Temporal ${formatMatcher} component matching ignores private %s, warm=${warm}`,
      key => {
        const options = {
          formatMatcher,
          timeZone: 'UTC',
          hourCycle: 'h23',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        } as const
        const value = new Temporal.PlainDateTime(2024, 1, 2, 3, 4, 5)
        const expectedParts = new DateTimeFormat('en', options).formatToParts(
          value
        )
        const formatter = new DateTimeFormat('en', options)
        if (warm) formatter.format(value)
        const owner =
          key === 'iterator'
            ? Array.prototype
            : key === 'isArray'
              ? Array
              : Math
        const property = key === 'iterator' ? Symbol.iterator : key
        const descriptor = Object.getOwnPropertyDescriptor(owner, property)!
        const define = Object.defineProperty
        let text: string | undefined,
          parts: unknown,
          error: unknown,
          calls = 0
        try {
          define(owner, property, {
            ...descriptor,
            value() {
              calls++
              throw new Error('Private Temporal component matcher hook')
            },
          })
          text = formatter.format(value)
          parts = formatter.formatToParts(value)
        } catch (caught) {
          error = caught
        } finally {
          define(owner, property, descriptor)
        }
        if (error) throw error
        expect(calls).toBe(0)
        expect(text).toBe(
          formatMatcher === 'basic'
            ? '1/2/2024, 3:04:05'
            : '01/02/2024, 03:04:05'
        )
        expect(parts).toEqual(expectedParts)
      }
    )

test.each([
  'defineProperties',
  'keys',
  'slice',
  'get',
  Symbol.iterator,
] as const)(
  'cold Temporal kind interval initialization ignores private %s',
  key => {
    // Re-registration creates fresh lazy candidate records. Constructing the
    // combined Date profile initializes only its chosen interval record.
    DateTimeFormat.__addLocaleData(en as any)
    const formatter = new DateTimeFormat('en', {
      timeZone: 'UTC',
      formatMatcher: 'basic',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const value = new Temporal.PlainTime(3, 4, 5)
    expect(formatter.format(new Date('2024-01-02T03:04:05Z'))).toBe(
      '1/2/2024, 3:04:05'
    )
    const owner =
      key === 'defineProperties' || key === 'keys'
        ? Object
        : key === 'slice'
          ? String.prototype
          : key === 'get'
            ? Map.prototype
            : Array.prototype
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const define = Object.defineProperty
    let text: string | undefined,
      parts: unknown,
      error: unknown,
      hooks = 0
    try {
      define(owner, key, {
        configurable: true,
        get() {
          hooks++
          throw new Error('Mutable lazy interval initializer')
        },
      })
      // PlainTime selects a time-only candidate, not the combined base candidate.
      text = formatter.format(value)
      parts = formatter.formatToParts(value)
    } catch (caught) {
      error = caught
    } finally {
      define(owner, key, descriptor)
    }
    if (error) throw error
    expect(hooks).toBe(0)
    expect(text).toBe('3:04:05')
    expect(parts).toEqual([
      {type: 'hour', value: '3'},
      {type: 'literal', value: ':'},
      {type: 'minute', value: '04'},
      {type: 'literal', value: ':'},
      {type: 'second', value: '05'},
    ])
    expect(formatter.format(value)).toBe('3:04:05')
  }
)

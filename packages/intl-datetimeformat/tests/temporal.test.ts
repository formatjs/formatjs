import {ToDateTimeFormattable} from '#packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.js'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import {runInNewContext} from 'node:vm'
import {expect, test} from 'vitest'

// The dedicated target uses the same stable Temporal runtime as Test262.
const Temporal = (globalThis as any).Temporal
DateTimeFormat.__addLocaleData(en as any)

function formatter(options: Intl.DateTimeFormatOptions = {}) {
  return new DateTimeFormat('en', {timeZone: 'UTC', ...options}) as any
}

test.each([
  ['get', 'best fit'],
  ['get', 'lookup'],
  ['set', 'best fit'],
  ['set', 'lookup'],
] as const)(
  'formats branded Temporal inputs without WeakMap.prototype.%s (%s)',
  (method, localeMatcher) => {
    const value = new Temporal.PlainDate(2024, 1, 2)
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      localeMatcher,
    } as const
    for (const warm of [false, true]) {
      const dtf = formatter(options)
      if (warm) dtf.formatToParts(value)
      const original = WeakMap.prototype[method]
      let actual: string[] | undefined, error: unknown
      try {
        WeakMap.prototype[method] = () => {
          throw new Error(`Mutable WeakMap.${method}`)
        }
        actual = [
          dtf.format(value),
          dtf
            .formatToParts(value)
            .map((part: any) => part.value)
            .join(''),
          dtf.formatRange(value, value),
          dtf
            .formatRangeToParts(value, value)
            .map((part: any) => part.value)
            .join(''),
          formatter(options).format(value),
        ]
      } catch (caught) {
        error = caught
      } finally {
        Object.defineProperty(WeakMap.prototype, method, {value: original})
      }
      expect(error, `warm=${warm}: ${(error as Error)?.stack}`).toBeUndefined()
      expect(actual).toEqual(Array(5).fill('01/02/2024'))
    }
  }
)

test('plain values ignore timezone while instants use it', () => {
  const dtf = formatter({
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: '+05:00',
  })
  expect(dtf.format(new Temporal.PlainTime(12, 30))).toBe('12:30')
  expect(dtf.format(new Temporal.PlainDateTime(2020, 1, 1, 12, 30))).toBe(
    '12:30'
  )
  expect(dtf.format(Temporal.Instant.from('2020-01-01T12:30Z'))).toBe('17:30')
  expect(dtf.resolvedOptions().timeZone).toBe('+05:00')
})

test('type-specific defaults do not change Date defaults', () => {
  const dtf = formatter({hourCycle: 'h23'})
  expect(dtf.format(new Temporal.PlainDate(2020, 2, 3))).toBe('2/3/2020')
  expect(dtf.format(new Temporal.PlainTime(12, 30, 45))).toBe('12:30:45')
  expect(dtf.format(new Date('2020-02-03T12:30:45Z'))).toBe('2/3/2020')
  expect(
    dtf
      .formatToParts(new Temporal.PlainDateTime(2020, 2, 3, 12, 30, 45))
      .filter((p: any) => p.type !== 'literal')
      .map((p: any) => p.type)
  ).toEqual(['month', 'day', 'year', 'hour', 'minute', 'second'])
})

test('intrinsic branding ignores user getters, subclasses, and foreign realms', () => {
  const date = new Temporal.PlainDate(2020, 2, 3)
  for (const key of [
    'year',
    'month',
    'day',
    'calendarId',
    'toString',
    'valueOf',
    Symbol.toPrimitive,
    Symbol.toStringTag,
  ]) {
    Object.defineProperty(date, key, {
      get() {
        throw new Error('user getter')
      },
    })
  }
  expect(formatter().format(date)).toBe('2/3/2020')
  expect(
    formatter().format(runInNewContext('new Temporal.PlainDate(2020, 2, 3)'))
  ).toBe('2/3/2020')
  class Subclass extends Temporal.PlainDate {
    constructor(year: number, month: number, day: number) {
      super(year, month, day)
    }
  }
  expect(formatter().format(new Subclass(2020, 2, 3))).toBe('2/3/2020')
  const impostor = {
    [Symbol.toStringTag]: 'Temporal.PlainDate',
    valueOf: () => 0,
  }
  expect(formatter().format(impostor)).toBe('1/1/1970')
})

test('range conversion finishes before type validation', () => {
  let converted = false
  const dtf = formatter()
  expect(() =>
    dtf.formatRange(new Temporal.PlainDate(2020, 1, 1), {
      valueOf() {
        converted = true
        return 0
      },
    })
  ).toThrow(TypeError)
  expect(converted).toBe(true)
  expect(() =>
    dtf.formatRangeToParts(
      new Temporal.PlainDate(2020, 1, 1),
      new Temporal.PlainTime()
    )
  ).toThrow(TypeError)
  expect(() => dtf.format(new Temporal.ZonedDateTime(0n, 'UTC'))).toThrow(
    TypeError
  )
})

test('non-overlapping fields and calendars reject', () => {
  expect(() =>
    formatter({hour: 'numeric'}).format(new Temporal.PlainDate(2020, 1, 1))
  ).toThrow(TypeError)
  expect(() =>
    formatter({dateStyle: 'full'}).format(new Temporal.PlainTime())
  ).toThrow(TypeError)
  expect(() =>
    formatter().format(new Temporal.PlainYearMonth(2020, 1))
  ).toThrow(RangeError)
  expect(
    formatter({calendar: 'iso8601'}).format(
      new Temporal.PlainYearMonth(2020, 1)
    )
  ).toBe('2020-01')
})

test('Temporal bypasses Date limits and floors negative fractional milliseconds', () => {
  const dtf = formatter({year: 'numeric', month: 'numeric', day: 'numeric'})
  expect(dtf.format(new Temporal.PlainDate(-271821, 4, 19))).toBe('4/19/271822')
  expect(() => dtf.format(-8640000000000001)).toThrow(RangeError)
  const time = formatter({
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
  })
  expect(time.format(new Temporal.Instant(-1n))).toBe('23:59:59.999')
})

test('Temporal variants retain original options without rereading getters', () => {
  let reads = 0
  const options = {
    get year(): 'numeric' {
      reads++
      return 'numeric'
    },
  }
  const dtf = new DateTimeFormat('en', options) as any
  expect(reads).toBe(1)
  expect(dtf.format(new Temporal.PlainDate(2020, 2, 3))).toBe('2020')
  expect(dtf.format(new Temporal.PlainDateTime(2021, 2, 3))).toBe('2021')
  expect(reads).toBe(1)
})

test('MonthDay retains its reference date and ranges keep source attribution', () => {
  const dtf = formatter({calendar: 'iso8601'})
  expect(dtf.format(new Temporal.PlainMonthDay(2, 29))).toBe('02-29')
  const start = new Temporal.PlainDate(2020, 2, 3)
  const end = new Temporal.PlainDate(2020, 2, 5)
  const parts = dtf.formatRangeToParts(start, end)
  expect(parts.map((part: any) => part.value).join('')).toBe(
    dtf.formatRange(start, end)
  )
  expect(parts.some((part: any) => part.source === 'startRange')).toBe(true)
  expect(parts.some((part: any) => part.source === 'endRange')).toBe(true)
})

test('same-day datetime ranges share the date even without a CLDR time interval', () => {
  const dtf = formatter()
  const start = new Temporal.PlainDateTime(2021, 8, 4, 0, 30, 45)
  const end = new Temporal.PlainDateTime(2021, 8, 4, 23, 30, 45)
  const parts = dtf.formatRangeToParts(start, end)
  for (const type of ['year', 'month', 'day']) {
    expect(parts.filter((part: any) => part.type === type)).toEqual([
      expect.objectContaining({type, source: 'shared'}),
    ])
  }
  expect(parts.map((part: any) => part.value).join('')).toBe(
    '8/4/2021, 12:30:45\u202fAM\u2009–\u200911:30:45\u202fPM'
  )
})

test('nanosecond endpoints retain the preceding millisecond at Date limits', () => {
  const dtf = formatter({
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
  })
  for (const nanoseconds of [
    -1n,
    1n,
    8640000000000000000000n - 1n,
    -8640000000000000000000n + 1n,
  ]) {
    const instant = new Temporal.Instant(nanoseconds)
    const milliseconds = Number(
      nanoseconds / 1000000n -
        (nanoseconds < 0n && nanoseconds % 1000000n !== 0n ? 1n : 0n)
    )
    expect(dtf.format(instant)).toBe(dtf.format(milliseconds))
    expect(dtf.formatToParts(instant)).toEqual(dtf.formatToParts(milliseconds))
    expect(dtf.formatRange(instant, instant)).toBe(
      dtf.formatRange(milliseconds, milliseconds)
    )
    expect(dtf.formatRangeToParts(instant, instant)).toEqual(
      dtf.formatRangeToParts(milliseconds, milliseconds)
    )
  }
  expect(dtf.format(-0.9)).toBe(dtf.format(0))
  expect(dtf.format(new Temporal.Instant(-1n))).not.toBe(dtf.format(-0.9))
})

test.each(['Number', 'isSafeInteger'] as const)(
  'formats Temporal instants without mutable %s hooks',
  hook => {
    const value = new Temporal.Instant(-1n)
    const dtf = formatter({second: '2-digit', fractionalSecondDigits: 3})
    const render = () => [
      dtf.format(value),
      dtf.formatToParts(value),
      dtf.formatRange(value, value),
      dtf.formatRangeToParts(value, value),
    ]
    const expected = render()
    const owner = hook === 'Number' ? globalThis : Number
    const descriptor = Object.getOwnPropertyDescriptor(owner, hook)!
    const define = Object.defineProperty
    let actual: unknown, error: unknown
    try {
      define(owner, hook, {
        ...descriptor,
        value: () => {
          throw new Error(`Mutable ${hook}`)
        },
      })
      actual = render()
    } catch (caught) {
      error = caught
    } finally {
      define(owner, hook, descriptor)
    }
    expect(error).toBeUndefined()
    expect(actual).toEqual(expected)
  }
)

test.each([1, 2, 3] as const)(
  'fractional seconds truncate at width %i across the epoch',
  digits => {
    const dtf = formatter({second: '2-digit', fractionalSecondDigits: digits})
    for (const [nanoseconds, expected] of [
      [-1n, '999'],
      [0n, '000'],
      [1n, '000'],
      [123999999n, '123'],
      [999999999n, '999'],
      [-1000001n, '998'],
    ] as const) {
      expect(
        dtf
          .formatToParts(new Temporal.Instant(nanoseconds))
          .find(
            (part: {type: string; value: string}) =>
              part.type === 'fractionalSecond'
          )?.value
      ).toBe(expected.slice(0, digits))
    }
  }
)

test.each(['UTC', '+05:30', '-05:30'])(
  'Temporal formatting preserves legacy RegExp statics in %s',
  timeZone => {
    const dtf = formatter({calendar: 'iso8601', timeZone})
    for (const value of [
      new Temporal.PlainDate(2020, 2, 3),
      new Temporal.PlainDateTime(2020, 2, 3, 12, 30),
      new Temporal.PlainTime(12, 30),
      new Temporal.PlainYearMonth(2020, 2),
      new Temporal.PlainMonthDay(2, 3),
      new Temporal.Instant(0n),
    ]) {
      for (const method of [
        'format',
        'formatToParts',
        'formatRange',
        'formatRangeToParts',
      ] as const) {
        ;/sent(inel)/.exec('sentinel')
        const before = [
          RegExp.input,
          RegExp.lastMatch,
          RegExp.lastParen,
          RegExp.leftContext,
          RegExp.rightContext,
          RegExp.$1,
        ]
        dtf[method](value, value)
        const after = [
          RegExp.input,
          RegExp.lastMatch,
          RegExp.lastParen,
          RegExp.leftContext,
          RegExp.rightContext,
          RegExp.$1,
        ]
        expect(
          after,
          `${method} ${Object.prototype.toString.call(value)}`
        ).toEqual(before)
      }
    }
  }
)

test('intrinsic ISO parsing retains signed years and fractional seconds', () => {
  const dtf = formatter({
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
  })
  for (const year of [-123456, -1, 2000, 123456]) {
    const value = new Temporal.PlainDateTime(
      year,
      2,
      3,
      12,
      30,
      45,
      123,
      456,
      789
    )
    expect(dtf.formatToParts(value)).toEqual(
      dtf.formatToParts(Date.UTC(year, 1, 3, 12, 30, 45, 123))
    )
  }
  expect(
    formatter({second: 'numeric', fractionalSecondDigits: 3})
      .formatToParts(new Temporal.PlainTime(0, 0, 0, 123, 456, 789))
      .find(
        (part: {type: string; value: string}) =>
          part.type === 'fractionalSecond'
      )?.value
  ).toBe('123')
})

test.each(['String', 'BigInt', 'Number', 'indexOf', 'slice'] as const)(
  'formats captured Temporal serialization without mutable %s',
  hook => {
    const values = [
      new Temporal.PlainDate(1, 2, 3),
      new Temporal.PlainYearMonth(2020, 2, 'gregory'),
      new Temporal.PlainMonthDay(2, 3, 'gregory'),
      new Temporal.PlainTime(12, 34, 56, 123, 456, 789),
      new Temporal.PlainDateTime(-1, 2, 3, 12, 34, 56, 123, 456, 789),
      new Temporal.Instant(-1n),
    ]
    const dtf = formatter({hourCycle: 'h23'})
    const render = () => values.map(value => dtf.formatToParts(value))
    // Warm renderer dependencies before exercising the captured brand bridge.
    const expected = render()
    const owner =
      hook === 'indexOf' || hook === 'slice' ? String.prototype : globalThis
    const descriptor = Object.getOwnPropertyDescriptor(owner, hook)!
    const define = Object.defineProperty
    let actual: unknown,
      error: unknown,
      calls = 0
    try {
      define(owner, hook, {
        ...descriptor,
        value: () => {
          calls++
          throw new Error('Mutable Temporal serialization')
        },
      })
      actual = render()
    } catch (caught) {
      error = caught
    } finally {
      define(owner, hook, descriptor)
    }
    expect(error).toBeUndefined()
    expect(calls).toBe(0)
    expect(actual).toEqual(expected)
  }
)

test.each(['iterator', 'call'] as const)(
  'reads six native Temporal brands without private %s lookup',
  hook => {
    const values = [
      new Temporal.PlainDate(1970, 1, 1),
      new Temporal.PlainYearMonth(1970, 1, 'gregory'),
      new Temporal.PlainMonthDay(1, 1, 'gregory'),
      new Temporal.PlainTime(12, 34, 56, 123, 456, 789),
      new Temporal.PlainDateTime(1970, 1, 1, 12, 34, 56, 123, 456, 789),
      new Temporal.Instant(-1n),
    ]
    const expected = [
      {
        kind: 'PlainDate',
        calendar: 'iso8601',
        epochNanoseconds: 43_200_000_000_000n,
      },
      {
        kind: 'PlainYearMonth',
        calendar: 'gregory',
        epochNanoseconds: 43_200_000_000_000n,
      },
      {
        kind: 'PlainMonthDay',
        calendar: 'gregory',
        epochNanoseconds: 63_115_200_000_000_000n,
      },
      {
        kind: 'PlainTime',
        calendar: undefined,
        epochNanoseconds: 45_296_123_456_789n,
      },
      {
        kind: 'PlainDateTime',
        calendar: 'iso8601',
        epochNanoseconds: 45_296_123_456_789n,
      },
      {kind: 'Instant', epochNanoseconds: -1n},
    ]
    expect(values.map(value => ToDateTimeFormattable(value))).toEqual(expected)
    const owner = hook === 'call' ? Function.prototype : Array.prototype
    const key = hook === 'call' ? 'call' : Symbol.iterator
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const define = Object.defineProperty
    const actual: unknown[] = []
    let error: unknown,
      calls = 0
    try {
      define(owner, key, {
        ...descriptor,
        value() {
          calls++
          throw new Error('Mutable private brand iterator')
        },
      })
      for (let index = 0; index < values.length; index++)
        actual[index] = ToDateTimeFormattable(values[index])
    } catch (caught) {
      error = caught
    } finally {
      define(owner, key, descriptor)
    }
    expect(error).toBeUndefined()
    expect(calls).toBe(0)
    expect(actual).toEqual(expected)
  }
)

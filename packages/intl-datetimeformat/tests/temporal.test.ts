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
  class Subclass extends Temporal.PlainDate {}
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
  ).toBe('1/2020')
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
  expect(dtf.format(new Temporal.PlainMonthDay(2, 29))).toBe('2/29')
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

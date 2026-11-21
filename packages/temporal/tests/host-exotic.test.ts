import {runInThisContext} from 'node:vm'
import {setFlagsFromString} from 'node:v8'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'

type HostExotic = Record<PropertyKey, unknown> &
  ((...args: unknown[]) => unknown)
function hostObject(fields: Record<string, unknown> = {}): HostExotic {
  setFlagsFromString('--allow-natives-syntax')
  try {
    return Object.assign(
      runInThisContext('%GetUndetectable()') as HostExotic,
      fields
    )
  } finally {
    setFlagsFromString('--no-allow-natives-syntax')
  }
}

it('reads host-exotic field bags for every supported Temporal conversion', () => {
  const date = hostObject({year: 2024, month: 2, day: 29})
  expect(Temporal.PlainDate.from(date).toString()).toBe('2024-02-29')
  expect(Temporal.PlainDateTime.from(date).toString()).toBe(
    '2024-02-29T00:00:00'
  )
  expect(Temporal.PlainYearMonth.from(date).toString()).toBe('2024-02')
  expect(Temporal.PlainMonthDay.from(date).toString()).toBe('02-29')
  expect(Temporal.PlainTime.from(hostObject({hour: 12})).hour).toBe(12)
  expect(Temporal.Duration.from(hostObject({hours: 2})).hours).toBe(2)
  expect(
    Temporal.Duration.from('PT1H').with(hostObject({minutes: 3})).minutes
  ).toBe(3)
  expect(
    Temporal.ZonedDateTime.from(
      hostObject({year: 2024, month: 2, day: 29, timeZone: 'UTC'})
    ).day
  ).toBe(29)
})

it('reads host-exotic options and primitive coercion hooks', () => {
  const options = hostObject({overflow: 'reject'})
  expect(() =>
    Temporal.PlainDate.from({year: 2024, month: 2, day: 30}, options)
  ).toThrow(RangeError)
  expect(
    new Temporal.Instant(1n).round(hostObject({smallestUnit: 'second'}))
      .epochNanoseconds
  ).toBe(0n)
  const value = hostObject()
  value[Symbol.toPrimitive] = function (hint: string) {
    expect(this).toBe(value)
    expect(hint).toBe('number')
    return 42n
  }
  expect(new Temporal.Instant(value).epochNanoseconds).toBe(42n)
})

it.each([
  [Temporal.Instant, [0n]],
  [Temporal.Duration, []],
  [Temporal.PlainDate, [2024, 2, 29]],
  [Temporal.PlainDateTime, [2024, 2, 29]],
  [Temporal.PlainTime, []],
  [Temporal.PlainYearMonth, [2024, 2]],
  [Temporal.PlainMonthDay, [2, 29]],
  [Temporal.ZonedDateTime, [0n, 'UTC']],
])('uses host-exotic newTarget.prototype for %s', (Constructor, args) => {
  const prototype = hostObject()
  function Target() {}
  Target.prototype = prototype
  expect(
    Object.getPrototypeOf(Reflect.construct(Constructor, args, Target))
  ).toBe(prototype)
})

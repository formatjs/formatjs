import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {Duration, Instant} from '#packages/temporal/index.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {roundDuration, type RoundingMode} from '#packages/temporal/rounding.js'

it.each([
  {owner: RegExp.prototype, key: 'exec'},
  {owner: RegExp.prototype, key: 'test'},
  {owner: String.prototype, key: 'slice'},
  {owner: String.prototype, key: 'padEnd'},
  {owner: Reflect, key: 'apply'},
])('parses duration strings without observing $key', ({owner, key}) => {
  expect(nativeTemporal()).toBeUndefined()
  const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
  const sentinel = new Error('Observable duration parser method')
  const inputs = [
    'PT0,123456789S',
    '-PT1.000000001H',
    'PT0.000000001M',
    'PT1S',
    'p1dt2h',
  ]
  const invalid = [
    'PT1.1234567890S',
    'PT1.0H0M',
    'PT1.0M0S',
    'P',
    'PT',
    'P1DT',
    'PT1S\n',
  ]
  const parsed: ReturnType<typeof Duration.from>[] = []
  const failures: unknown[] = []
  const invalidErrors: unknown[] = []
  let hooks = 0
  try {
    Object.defineProperty(owner, key, {
      configurable: true,
      get() {
        hooks++
        throw sentinel
      },
    })
    for (let index = 0; index < inputs.length; index++) {
      try {
        parsed.push(Duration.from(inputs[index]))
      } catch (error) {
        failures.push(error)
      }
    }
    for (let index = 0; index < invalid.length; index++) {
      try {
        Duration.from(invalid[index])
        invalidErrors.push(undefined)
      } catch (error) {
        invalidErrors.push(error)
      }
    }
  } finally {
    Object.defineProperty(owner, key, descriptor)
  }
  expect(hooks).toBe(0)
  expect(failures).toEqual([])
  expect(
    parsed.map(value => [
      value.days,
      value.hours,
      value.minutes,
      value.seconds,
      value.milliseconds,
      value.microseconds,
      value.nanoseconds,
    ])
  ).toEqual([
    [0, 0, 0, 0, 123, 456, 789],
    [0, -1, 0, 0, 0, -3, -600],
    [0, 0, 0, 0, 0, 0, 60],
    [0, 0, 0, 1, 0, 0, 0],
    [1, 2, 0, 0, 0, 0, 0],
  ])
  expect(invalidErrors).toHaveLength(invalid.length)
  for (const error of invalidErrors) expect(error).toBeInstanceOf(RangeError)
})

it('does not change legacy RegExp state when parsing duration strings', () => {
  ;/(duration marker)/.exec('duration marker')
  const expected = [RegExp.$1, RegExp.lastMatch, RegExp.input]
  const value = Duration.from('PT0.123456789S')
  const actual = [RegExp.$1, RegExp.lastMatch, RegExp.input]
  expect(actual).toEqual(expected)
  expect(value.nanoseconds).toBe(789)
})

it.each([
  ['', '0'],
  ['+', '1'],
  ['P1', '2'],
  ['PT1', '3'],
  ['PT1.2', '5'],
])(
  'rejects incomplete duration %j without reading inherited character %s',
  (text, key) => {
    const descriptor = Object.getOwnPropertyDescriptor(String.prototype, key)
    let hooks = 0,
      error: unknown
    try {
      Object.defineProperty(String.prototype, key, {
        configurable: true,
        get() {
          hooks++
          return 'D'
        },
      })
      try {
        Duration.from(text)
      } catch (caught) {
        error = caught
      }
    } finally {
      if (descriptor) Object.defineProperty(String.prototype, key, descriptor)
      else Reflect.deleteProperty(String.prototype, key)
    }
    expect(hooks).toBe(0)
    expect(error).toBeInstanceOf(RangeError)
  }
)

it('preserves exact duration parsing at calendar and nanosecond bounds', () => {
  for (const sign of [1, -1]) {
    const prefix = sign < 0 ? '-' : ''
    const value = Duration.from(`${prefix}PT9007199254740991.999999999S`)
    expect([
      value.seconds,
      value.milliseconds,
      value.microseconds,
      value.nanoseconds,
    ]).toEqual([sign * 9007199254740991, sign * 999, sign * 999, sign * 999])
    expect(Duration.from(`${prefix}P4294967295Y`).years).toBe(sign * 4294967295)
    expect(() => Duration.from(`${prefix}PT9007199254740992S`)).toThrow(
      RangeError
    )
    expect(() => Duration.from(`${prefix}P4294967296Y`)).toThrow(RangeError)
  }
  expect(Duration.from('p0001w02dt0003h').toString()).toBe('P1W2DT3H')
  expect(Object.is(Duration.from('-PT0S').seconds, -0)).toBe(false)
  for (const text of [
    'P1.0D',
    'PT.1S',
    'PT1.S',
    'P1D1Y',
    'PT1M1H',
    'PT1S1S',
    'PTT1S',
    'P1H',
    'P1DT',
    'PT1S\r',
    'PT1S\u2028',
    'PT1S\u2029',
    'PT1S\0',
    'PT1S ',
    '−PT1S',
    'PT１S',
  ])
    expect(() => Duration.from(text), JSON.stringify(text)).toThrow(RangeError)
})

it('does not observe array sorting while reading duration fields', () => {
  const value = Duration.from('P1DT2H')
  const original = Array.prototype.sort
  let changed: ReturnType<typeof Duration.from> | undefined
  Array.prototype.sort = function () {
    throw new Error('Observable Array sort')
  }
  try {
    changed = value.with({minutes: 3})
  } finally {
    Array.prototype.sort = original
  }
  expect(changed!.toString()).toBe('P1DT2H3M')
})

it('matches independent ICU signed rounding and rational-to-double totals', () => {
  const path = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-duration-fixtures.tsv`
  )
  const factors: Record<string, bigint> = {
    nanosecond: 1n,
    microsecond: 1000n,
    millisecond: 1_000_000n,
    second: 1_000_000_000n,
    minute: 60_000_000_000n,
    hour: 3_600_000_000_000n,
    day: 86_400_000_000_000n,
  }
  let count = 0
  for (const line of readFileSync(path, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [kind, value, unit, mode, expected] = line.split('\t'),
      ns = BigInt(value)
    if (kind === 'round')
      expect(roundDuration(ns, factors[unit], mode as RoundingMode), line).toBe(
        BigInt(expected)
      )
    else {
      const duration = Duration.from({
        seconds: Number(ns / 1_000_000_000n),
        nanoseconds: Number(ns % 1_000_000_000n),
      })
      expect(duration.total(unit), line).toBe(+expected)
    }
    count++
  }
  expect(count).toBeGreaterThan(3000)
  console.log(`${count} independent ICU signed duration rounding/total cases`)
})

it('preserves nanosecond fractions, unbalanced fields, brands and immutable copies', () => {
  for (const text of [
    'P1Y2M3W4DT5H66M71.50040904S',
    '-PT1.000000001H',
    'PT0.000000001M',
    'PT60S',
    '-P1DT0.123456789S',
  ]) {
    const value = Duration.from(text),
      control = reference.Duration.from(text)
    expect(value.toString(), text).toBe(control.toString())
    expect(value.negated().toJSON(), text).toBe(control.negated().toJSON())
    expect(value.with({years: value.years}).toJSON(), text).toBe(
      control.toJSON()
    )
    expect(Reflect.ownKeys(value)).toEqual([])
  }
  const value = Duration.from('PT1S')
  Object.defineProperty(value, 'seconds', {
    get() {
      throw new Error('public getter')
    },
  })
  expect(Duration.from(value).seconds).toBe(1)
  expect(() => Duration.prototype.negated.call(new Proxy(value, {}))).toThrow(
    TypeError
  )
})

it('constructs before allocation only after all numeric coercions and validation', () => {
  const order: string[] = []
  const target = new Proxy(function () {}, {
    get(value, key, receiver) {
      if (key === 'prototype') order.push('prototype')
      return Reflect.get(value, key, receiver)
    },
  })
  Reflect.construct(
    Duration,
    [
      {
        valueOf() {
          order.push('years')
          return 1
        },
      },
      {
        valueOf() {
          order.push('months')
          return 2
        },
      },
    ],
    target
  )
  expect(order).toEqual(['years', 'months', 'prototype'])
  expect(() => new Duration(1, -1)).toThrow(RangeError)
  expect(() => new Duration(4294967296)).toThrow(RangeError)
  expect(() => new Duration(0, 0, 0, 0, 0, 0, 9007199254740992)).toThrow(
    RangeError
  )
})

it('computes signed Instant differences with exact epoch arithmetic', () => {
  const values = [
    -8640000000000000000000n,
    -1n,
    0n,
    1n,
    8640000000000000000000n,
  ]
  for (const one of values)
    for (const two of values) {
      const left = new Instant(one),
        right = new Instant(two)
      expect(left.until(right).toJSON()).toBe(
        new reference.Instant(one).until(new reference.Instant(two)).toJSON()
      )
      expect(
        left
          .since(right, {smallestUnit: 'second', roundingMode: 'halfFloor'})
          .toJSON()
      ).toBe(
        new reference.Instant(one)
          .since(new reference.Instant(two), {
            smallestUnit: 'second',
            roundingMode: 'halfFloor',
          })
          .toJSON()
      )
    }
  expect(new Instant(0n).add('PT0.000000001S').epochNanoseconds).toBe(1n)
  expect(() => new Instant(0n).add('P1D')).toThrow(RangeError)
})

it.each([1, -1])(
  'composes six clock fields exactly at the signed duration boundary: %s',
  sign => {
    const fields = {
      hours: sign * 2_501_999_792_983,
      minutes: sign * 36,
      seconds: sign * 31,
      milliseconds: sign * 999,
      microseconds: sign * 999,
      nanoseconds: sign * 999,
    }
    const value = Duration.from(fields)
    expect(value.toJSON()).toBe(
      `${sign < 0 ? '-' : ''}PT2501999792983H36M31.999999999S`
    )
    expect(value.total('nanoseconds')).toBe(
      sign * 9_007_199_254_740_992_000_000_000
    )
    expect(() => Duration.from({...fields, nanoseconds: sign * 1000})).toThrow(
      RangeError
    )
  }
)

it.each(['BigInt.prototype.toString', 'Reflect.apply'])(
  'totals private nanoseconds without observing %s',
  hook => {
    expect(nativeTemporal()).toBeUndefined()
    const cases = [
      ['PT0.000000001S', 'day', 1 / 86400000000000],
      ['-PT0.000000001S', 'day', -1 / 86400000000000],
      ['PT9007199.254740993S', 'nanosecond', 9007199254740992],
      ['PT9007199.254740995S', 'nanosecond', 9007199254740996],
      ['-PT9007199.254740995S', 'nanosecond', -9007199254740996],
      ['PT9007199254740991.999999999S', 'second', 9007199254740992],
    ] as const
    const durations = cases.map(([text]) => Duration.from(text))
    const owner = hook === 'Reflect.apply' ? Reflect : BigInt.prototype
    const key = hook === 'Reflect.apply' ? 'apply' : 'toString'
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const sentinel = new Error('Observable duration total method')
    const actual: number[] = []
    let error: unknown
    try {
      Object.defineProperty(owner, key, {
        ...descriptor,
        value() {
          throw sentinel
        },
      })
      for (let index = 0; index < cases.length; index++)
        actual[index] = durations[index].total(cases[index][1])
    } catch (caught) {
      error = caught
    } finally {
      Object.defineProperty(owner, key, descriptor)
    }
    expect(error).toBeUndefined()
    expect(actual).toEqual(cases.map(entry => entry[2]))
  }
)

it('rounds duration strings without observing array search', () => {
  expect(nativeTemporal()).toBeUndefined()
  const positive = Duration.from('PT1.2345S')
  const negative = Duration.from('-PT1.2345S')
  const unbalanced = Duration.from('PT66M71.50040904S')
  const zero = Duration.from('PT0S')
  const descriptor = Object.getOwnPropertyDescriptor(
    Array.prototype,
    'findIndex'
  )!
  const sentinel = new Error('Observable duration field search')
  const actual: string[] = []
  let hooks = 0
  try {
    Object.defineProperty(Array.prototype, 'findIndex', {
      configurable: true,
      get() {
        hooks++
        throw sentinel
      },
    })
    actual.push(
      positive.toString(),
      positive.toString({fractionalSecondDigits: 9}),
      positive.toString({fractionalSecondDigits: 3}),
      negative.toString({fractionalSecondDigits: 3, roundingMode: 'floor'}),
      unbalanced.toString({fractionalSecondDigits: 3}),
      zero.toString({fractionalSecondDigits: 3})
    )
  } finally {
    Object.defineProperty(Array.prototype, 'findIndex', descriptor)
  }
  expect(hooks).toBe(0)
  expect(actual).toEqual([
    'PT1.2345S',
    'PT1.234500000S',
    'PT1.234S',
    '-PT1.235S',
    'PT67M11.500S',
    'PT0.000S',
  ])
})

import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {Duration, Instant} from '#packages/temporal/index.js'
import {roundDuration, type RoundingMode} from '#packages/temporal/rounding.js'

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

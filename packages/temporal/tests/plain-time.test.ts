import {it, expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {PlainTime} from '#packages/temporal/plain-time.js'
import {Temporal} from '#packages/temporal/index.js'
import {checkPlainTimeOracle} from '#packages/temporal/tests/plain-time-oracle.js'
import strings from '#packages/temporal/tests/plain-time-strings.json' with {type: 'json'}

it('shares strict ISO time parsing vectors with Rust', () => {
  for (const [text, expected] of strings.valid)
    expect(PlainTime.from(text).toJSON(), text).toBe(expected)
  for (const text of strings.invalid)
    expect(() => PlainTime.from(text), text).toThrow(RangeError)
})

it('matches independent ICU clock fields, carry, arithmetic and signed differences', () => {
  const rows = (file: string): string[][] =>
    readFileSync(
      runfiles.resolve(
        `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/${file}`
      ),
      'utf8'
    )
      .trim()
      .split('\n')
      .filter(line => !line.startsWith('#'))
      .map(line => line.split('\t'))
  const stats = checkPlainTimeOracle(
    Temporal,
    rows('temporal-iso-fixtures.tsv'),
    rows('temporal-time-carry-fixtures.tsv'),
    rows('temporal-duration-fixtures.tsv')
  )
  expect(stats.fields).toBeGreaterThan(25_000)
  expect(stats.rounds).toBeGreaterThan(7_000)
  expect(stats.differences).toBeGreaterThan(1_000)
  console.log(stats)
})

it('wraps time while ignoring calendar fields; preserves signed differences', () => {
  for (const text of [
    '00:00:00',
    '01:06',
    '23:59:59.999999999',
    'T1231',
    '2020-02-29T12:34:56.123456789+05:30',
  ]) {
    const actual = PlainTime.from(text),
      control = reference.PlainTime.from(text)
    expect(actual.toJSON()).toBe(control.toJSON())
    for (const duration of [
      'P1Y2M3W4DT25H',
      '-PT0.000000001S',
      'PT9007199254740991.999999999S',
    ]) {
      expect(actual.add(duration).toJSON()).toBe(control.add(duration).toJSON())
      expect(actual.subtract(duration).toJSON()).toBe(
        control.subtract(duration).toJSON()
      )
    }
    for (const mode of ['ceil', 'halfCeil', 'halfFloor', 'halfEven'] as const) {
      const options = {
        smallestUnit: 'minute' as const,
        roundingIncrement: 12,
        roundingMode: mode,
      }
      expect(actual.until('12:18', options).toJSON()).toBe(
        control.until('12:18', options).toJSON()
      )
      expect(actual.since('12:18', options).toJSON()).toBe(
        control.since('12:18', options).toJSON()
      )
    }
  }
  expect(
    PlainTime.from('01:06')
      .round({
        smallestUnit: 'minute',
        roundingIncrement: 12,
        roundingMode: 'halfEven',
      })
      .toJSON()
  ).toBe('01:00:00')
  expect(() =>
    PlainTime.prototype.toJSON.call(new Proxy(new PlainTime(), {}))
  ).toThrow(TypeError)
})

it.each([
  ['map', Array.prototype, 'map'],
  ['iterator', Array.prototype, Symbol.iterator],
  ['iterator next', Object.getPrototypeOf([][Symbol.iterator]()), 'next'],
  ['species constructor', Array.prototype, 'constructor'],
] as const)(
  'does not observe private clock array %s hooks',
  (_name, owner, key) => {
    const original = Object.getOwnPropertyDescriptor(owner, key)!
    const initial = new PlainTime(12, 34, 56, 123, 456, 789)
    const failure = {message: 'Private clock array hook reached'}
    const reads: string[] = []
    const fields = Object.create(null)
    for (const name of [
      'hour',
      'minute',
      'second',
      'millisecond',
      'microsecond',
      'nanosecond',
    ]) {
      Object.defineProperty(fields, name, {
        get() {
          reads.push(name)
          return name === 'hour' ? 12 : 1
        },
      })
    }
    let actual: unknown
    try {
      Object.defineProperty(owner, key, {
        configurable: true,
        get() {
          throw failure
        },
      })
      actual = [
        new PlainTime(12, 34, 56, 123, 456, 789).nanosecond,
        PlainTime.from(fields).toString(),
        initial.with({minute: 59}).toString(),
        initial.microsecond,
      ]
    } finally {
      Object.defineProperty(owner, key, original)
    }
    expect(actual).toEqual([
      789,
      '12:01:01.001001001',
      '12:59:56.123456789',
      456,
    ])
    expect(reads).toEqual([
      'hour',
      'microsecond',
      'millisecond',
      'minute',
      'nanosecond',
      'second',
    ])
  }
)

it.each([
  ['hour', 23],
  ['minute', 59],
  ['second', 59],
  ['millisecond', 999],
  ['microsecond', 999],
  ['nanosecond', 999],
] as const)('regulates %s independently before packing', (name, maximum) => {
  for (const value of [0, maximum]) {
    expect(PlainTime.from({[name]: value}, {overflow: 'reject'})[name]).toBe(
      value
    )
  }
  for (const value of [-1, -1e100, -Number.MAX_VALUE]) {
    expect(PlainTime.from({[name]: value})[name]).toBe(0)
    expect(() => PlainTime.from({[name]: value}, {overflow: 'reject'})).toThrow(
      RangeError
    )
  }
  for (const value of [maximum + 1, 1e100, Number.MAX_VALUE]) {
    expect(PlainTime.from({[name]: value})[name]).toBe(maximum)
    expect(() => PlainTime.from({[name]: value}, {overflow: 'reject'})).toThrow(
      RangeError
    )
  }
})

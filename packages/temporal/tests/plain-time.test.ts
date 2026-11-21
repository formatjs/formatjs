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

it.each(['complete', 'partial'] as const)(
  'reads and coerces %s clock fields once, before overflow options',
  completeness => {
    const events: string[] = []
    const supplied: Record<string, number> = {
      hour: 2.9,
      microsecond: 6.9,
      millisecond: 5.9,
      minute: 3.9,
      nanosecond: 7.9,
      second: 4.9,
    }
    const input = new Proxy(Object.create(null), {
      has() {
        throw new Error('Unexpected HasProperty')
      },
      ownKeys() {
        throw new Error('Unexpected enumeration')
      },
      get(_target, key) {
        events.push(`get ${String(key)}`)
        if (key === 'calendar' || key === 'timeZone') return undefined
        if (typeof key !== 'string' || !(key in supplied))
          throw new Error(`Unexpected property ${String(key)}`)
        return {
          [Symbol.toPrimitive](hint: string) {
            events.push(`coerce ${key} ${hint}`)
            return supplied[key]
          },
        }
      },
    })
    const options = {
      get overflow() {
        events.push('get overflow')
        return 'reject'
      },
    }
    const value =
      completeness === 'complete'
        ? PlainTime.from(input, options)
        : new PlainTime(12, 34, 56, 123, 456, 789).with(input, options)
    expect(value.toJSON()).toBe('02:03:04.005006007')
    expect(events).toEqual([
      ...(completeness === 'partial' ? ['get calendar', 'get timeZone'] : []),
      'get hour',
      'coerce hour number',
      'get microsecond',
      'coerce microsecond number',
      'get millisecond',
      'coerce millisecond number',
      'get minute',
      'coerce minute number',
      'get nanosecond',
      'coerce nanosecond number',
      'get second',
      'coerce second number',
      'get overflow',
    ])
  }
)

it.each([
  ['hour', '01:00:00', '01:34:56.123456789'],
  ['minute', '00:01:00', '12:01:56.123456789'],
  ['second', '00:00:01', '12:34:01.123456789'],
  ['millisecond', '00:00:00.001', '12:34:56.001456789'],
  ['microsecond', '00:00:00.000001', '12:34:56.123001789'],
  ['nanosecond', '00:00:00.000000001', '12:34:56.123456001'],
])('retains missing defaults around supplied %s', (name, complete, partial) => {
  const inherited = Object.create({[name]: 1.9})
  expect(PlainTime.from(inherited).toJSON()).toBe(complete)
  expect(
    new PlainTime(12, 34, 56, 123, 456, 789).with(inherited).toJSON()
  ).toBe(partial)
})

it.each(['complete', 'partial'] as const)(
  'rejects %s fields only after all undefined Gets; zero still counts',
  completeness => {
    const reads: PropertyKey[] = []
    const convert = (input: unknown, options?: unknown) =>
      completeness === 'complete'
        ? PlainTime.from(input, options)
        : new PlainTime(12, 34, 56, 123, 456, 789).with(input, options)
    const input = new Proxy(Object.create(null), {
      get(_target, key) {
        reads.push(key)
        return undefined
      },
    })
    expect(() =>
      convert(input, {
        get overflow() {
          throw new Error('Options reached before missing-field rejection')
        },
      })
    ).toThrow(TypeError)
    expect(reads).toEqual([
      ...(completeness === 'partial' ? ['calendar', 'timeZone'] : []),
      'hour',
      'microsecond',
      'millisecond',
      'minute',
      'nanosecond',
      'second',
    ])
    expect(convert({hour: -0.9}).toJSON()).toBe(
      completeness === 'complete' ? '00:00:00' : '00:34:56.123456789'
    )
  }
)

it.each(['complete', 'partial'] as const)(
  'stops %s field conversion at the exact getter or coercion throw',
  completeness => {
    const order = [
      'hour',
      'microsecond',
      'millisecond',
      'minute',
      'nanosecond',
      'second',
    ]
    for (let stop = 0; stop < order.length; stop++) {
      for (const stage of ['get', 'coerce']) {
        const events: string[] = []
        const failure = {stop, stage}
        const input = new Proxy(Object.create(null), {
          get(_target, key) {
            if (key === 'calendar' || key === 'timeZone') return undefined
            events.push(`get ${String(key)}`)
            if (key === order[stop] && stage === 'get') throw failure
            return {
              [Symbol.toPrimitive](hint: string) {
                events.push(`coerce ${String(key)} ${hint}`)
                if (key === order[stop]) throw failure
                return 1
              },
            }
          },
        })
        let actual: unknown
        try {
          const options = {
            get overflow() {
              throw new Error('Options reached after field failure')
            },
          }
          if (completeness === 'complete') PlainTime.from(input, options)
          else new PlainTime(12).with(input, options)
        } catch (error) {
          actual = error
        }
        expect(actual).toBe(failure)
        const expected: string[] = []
        for (let index = 0; index <= stop; index++) {
          expected.push(`get ${order[index]}`)
          if (index < stop || stage === 'coerce')
            expected.push(`coerce ${order[index]} number`)
        }
        expect(events).toEqual(expected)
      }
    }
  }
)

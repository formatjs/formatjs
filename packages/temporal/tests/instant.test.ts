import strings from '#packages/temporal/tests/instant-strings.json' with {type: 'json'}
import {expect, it} from 'vitest'
import {Instant, Temporal} from '#packages/temporal/index.js'

it('coerces before reading newTarget.prototype, propagates abrupt completions', () => {
  const order: string[] = []
  const value = {
    [Symbol.toPrimitive](hint: string) {
      order.push(hint)
      return 1n
    },
  }
  const target = new Proxy(function () {}, {
    get(object, key, receiver) {
      if (key === 'prototype') order.push('prototype')
      return Reflect.get(object, key, receiver)
    },
  })
  Reflect.construct(Instant, [value], target)
  expect(order).toEqual(['number', 'prototype'])
  const failure = new Error('coercion failed')
  order.length = 0
  expect(() =>
    Reflect.construct(
      Instant,
      [
        {
          [Symbol.toPrimitive]() {
            throw failure
          },
        },
      ],
      target
    )
  ).toThrow(failure)
  expect(order).toEqual([])
})
it('keeps private slots off instances and rejects forged/proxied receivers', () => {
  const instant = new Instant(-1n)
  expect(Reflect.ownKeys(instant)).toEqual([])
  expect(instant.epochMilliseconds).toBe(-1)
  const getter = Object.getOwnPropertyDescriptor(
    Instant.prototype,
    'epochNanoseconds'
  )!.get!
  for (const value of [
    {epochNanoseconds: 1n},
    Object.create(Instant.prototype),
    new Proxy(instant, {}),
  ])
    expect(() => getter.call(value)).toThrow(TypeError)
  Object.freeze(instant)
  expect(instant.epochNanoseconds).toBe(-1n)
})
it('coerces numeric factories once and keeps results intrinsic', () => {
  let calls = 0
  const input = {
    [Symbol.toPrimitive](hint: string) {
      calls++
      expect(hint).toBe('number')
      return 2
    },
  }
  expect(Instant.fromEpochMilliseconds(input).epochNanoseconds).toBe(2_000_000n)
  expect(calls).toBe(1)
  class Child extends Instant {}
  const child = new Child(1n)
  expect(child).toBeInstanceOf(Child)
  expect(Child.fromEpochNanoseconds(1n)).not.toBeInstanceOf(Child)
  expect(() =>
    Instant.fromEpochMilliseconds({
      valueOf() {
        return 1n
      },
    })
  ).toThrow(TypeError)
})

it('parses ISO instants, preserves offsets and copies branded values', () => {
  expect(Instant.from('1970-01-01T00:00:00.000000001Z').epochNanoseconds).toBe(
    1n
  )
  expect(
    Instant.from('1970-01-01T00:00:00+00:00:00.000000001').epochNanoseconds
  ).toBe(-1n)
  const original = new Instant(1n)
  Object.defineProperty(original, 'epochNanoseconds', {
    get() {
      throw new Error('observable getter')
    },
  })
  const copy = Instant.from(original)
  expect(copy).not.toBe(original)
  expect(copy.equals(original)).toBe(true)
  for (const text of [
    '2023-02-29T00:00:00Z',
    '-000000-01-01T00:00:00Z',
    '1970-01-01T00:00:00+24:00',
    '1970-01-01T00:00:00.1234567890Z',
  ])
    expect(() => Instant.from(text)).toThrow(RangeError)
})

it('shares exact parser expectations with the Rust core', () => {
  for (const {input, epochNanoseconds} of strings.valid)
    expect(Instant.from(input).epochNanoseconds, input).toBe(
      BigInt(epochNanoseconds)
    )
  for (const input of strings.invalid)
    expect(() => Instant.from(input), input).toThrow(RangeError)
})

it('compares exact instants, coercing left before right', () => {
  const order: string[] = []
  const input = (name: string, text: string) => ({
    toString() {
      order.push(name)
      return text
    },
  })
  expect(
    Instant.compare(
      input('left', '1970-01-01T00Z'),
      input('right', '1970-01-01T00:00:00.000000001Z')
    )
  ).toBe(-1)
  expect(order).toEqual(['left', 'right'])
  expect(Instant.compare(new Instant(1n), new Instant(0n))).toBe(1)
  expect(Instant.compare('19700101T00Z', new Instant(0n))).toBe(0)
})

it('allocates Temporal objects without observing mutable Object.create', () => {
  const cases: [string, () => {toString(): string}, string][] = [
    ['Instant constructor', () => new Instant(0n), '1970-01-01T00:00:00Z'],
    [
      'Instant.from',
      () => Instant.from('1970-01-01T00:00Z'),
      '1970-01-01T00:00:00Z',
    ],
    ['Duration constructor', () => new Temporal.Duration(0, 0, 0, 1), 'P1D'],
    ['Duration.from', () => Temporal.Duration.from('P1D'), 'P1D'],
    [
      'PlainDate constructor',
      () => new Temporal.PlainDate(2020, 2, 29),
      '2020-02-29',
    ],
    [
      'PlainDate.from',
      () => Temporal.PlainDate.from('2020-02-29'),
      '2020-02-29',
    ],
    [
      'PlainDateTime constructor',
      () => new Temporal.PlainDateTime(2020, 2, 29),
      '2020-02-29T00:00:00',
    ],
    [
      'PlainDateTime.from',
      () => Temporal.PlainDateTime.from('2020-02-29'),
      '2020-02-29T00:00:00',
    ],
    ['PlainTime constructor', () => new Temporal.PlainTime(12, 34), '12:34:00'],
    ['PlainTime.from', () => Temporal.PlainTime.from('12:34'), '12:34:00'],
    [
      'PlainYearMonth constructor',
      () => new Temporal.PlainYearMonth(2020, 2),
      '2020-02',
    ],
    [
      'PlainYearMonth.from',
      () => Temporal.PlainYearMonth.from('2020-02'),
      '2020-02',
    ],
    [
      'PlainMonthDay constructor',
      () => new Temporal.PlainMonthDay(2, 29),
      '02-29',
    ],
    ['PlainMonthDay.from', () => Temporal.PlainMonthDay.from('02-29'), '02-29'],
    [
      'ZonedDateTime constructor',
      () => new Temporal.ZonedDateTime(0n, 'UTC'),
      '1970-01-01T00:00:00+00:00[UTC]',
    ],
    [
      'ZonedDateTime.from',
      () => Temporal.ZonedDateTime.from('1970-01-01T00:00[UTC]'),
      '1970-01-01T00:00:00+00:00[UTC]',
    ],
  ]
  const original = Object.create
  const failure = new Error('Mutable Object.create reached')
  for (const [name, create, expected] of cases) {
    let result: {toString(): string} | undefined, error: unknown
    try {
      Object.create = () => {
        throw failure
      }
      result = create()
    } catch (caught) {
      error = caught
    } finally {
      Object.create = original
    }
    expect(error, name).toBeUndefined()
    expect(result!.toString(), name).toBe(expected)
  }
})

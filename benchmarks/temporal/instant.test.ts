import {expect, it} from 'vitest'
import {Instant} from './instant.js'

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

it('parses the supported ISO instant subset, preserves offsets and copies branded values', () => {
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

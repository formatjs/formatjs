import {ToTemporalDurationRecord} from '#packages/ecma402-abstract/DurationFormat/ToTemporalDurationRecord.js'
import {runInThisContext} from 'node:vm'
import {setFlagsFromString} from 'node:v8'
import {configureLocaleFormatting} from '#packages/temporal/locale.js'
import {expect, it} from 'vitest'
import {DurationFormat} from '#packages/intl-durationformat/core.js'
import {Temporal} from '#packages/temporal/index.js'
import {Temporal as Reference} from 'temporal-polyfill/implementation'
import {installLegacyDurationFormat} from '#packages/temporal/legacy-durationformat.js'

it('registers late namespaces and retains captured brands and parsers', () => {
  const formatter = new DurationFormat('en', {style: 'digital'})
  for (const namespace of [Temporal, Reference]) {
    DurationFormat.__addTemporalNamespace(namespace)
    const duration = namespace.Duration.from('PT1H2M3.004005006S'),
      original = Object.getOwnPropertyDescriptor(namespace.Duration, 'from')!
    Object.defineProperty(duration, 'hours', {
      get() {
        throw new Error('public getter')
      },
    })
    try {
      Object.defineProperty(namespace.Duration, 'from', {
        get() {
          throw new Error('public parser')
        },
        configurable: true,
      })
      DurationFormat.__addTemporalNamespace(namespace)
      expect(formatter.format(duration)).toBe('1:02:03.004005006')
      expect(formatter.format('PT1H2M3.004005006S')).toBe('1:02:03.004005006')
      expect(
        formatter
          .formatToParts(duration)
          .map(part => part.value)
          .join('')
      ).toBe('1:02:03.004005006')
    } finally {
      Object.defineProperty(namespace.Duration, 'from', original)
    }
  }
})

it('keeps ordinary property reads ordered and rejects receivers before reading input', () => {
  DurationFormat.__addTemporalNamespace(Temporal)
  const formatter = new DurationFormat('en', {style: 'digital'}),
    reads: string[] = [],
    duration = new Proxy(
      {hours: 1},
      {
        get(target, key) {
          reads.push(String(key))
          return Reflect.get(target, key)
        },
      }
    )
  expect(formatter.format(duration)).toBe('1:00:00')
  expect(reads).toEqual([
    'days',
    'hours',
    'microseconds',
    'milliseconds',
    'minutes',
    'months',
    'nanoseconds',
    'seconds',
    'weeks',
    'years',
  ])
  reads.length = 0
  for (const method of ['format', 'formatToParts'] as const)
    expect(() => Reflect.apply(formatter[method], null, [duration])).toThrow(
      TypeError
    )
  expect(reads).toEqual([])
})

it('adapts existing host formatters without changing their prototype or descriptors', () => {
  const Native = (Intl as unknown as {DurationFormat: typeof DurationFormat})
      .DurationFormat,
    prototype = Native.prototype,
    descriptors = Object.getOwnPropertyDescriptors(prototype),
    hook = Object.getOwnPropertyDescriptor(Native, '__addTemporalNamespace'),
    formatter = new Native('en', {style: 'digital'}),
    duration = Temporal.Duration.from('PT1H2M3S')
  Object.defineProperty(duration, 'hours', {
    get() {
      throw new Error('public getter')
    },
  })
  try {
    installLegacyDurationFormat(Temporal)
    installLegacyDurationFormat(Temporal)
    expect(Native.prototype).toBe(prototype)
    expect(formatter.format(duration)).toBe('1:02:03')
    expect(formatter.format('PT1H2M3S')).toBe('1:02:03')
    expect(
      formatter
        .formatToParts(duration)
        .map(part => part.value)
        .join('')
    ).toBe('1:02:03')
    for (const method of ['format', 'formatToParts'] as const) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, method)!
      expect({...descriptor, value: undefined}).toEqual({
        ...descriptors[method],
        value: undefined,
      })
      expect(prototype[method].name).toBe(method)
      expect(prototype[method].length).toBe(1)
      const input = new Proxy(
        {},
        {
          get() {
            throw new Error('input read')
          },
        }
      )
      expect(() => Reflect.apply(prototype[method], null, [input])).toThrow(
        TypeError
      )
      expect(
        () => new (prototype[method] as unknown as new () => object)()
      ).toThrow(TypeError)
    }
  } finally {
    Object.defineProperties(prototype, descriptors)
    if (hook) Object.defineProperty(Native, '__addTemporalNamespace', hook)
    else Reflect.deleteProperty(Native, '__addTemporalNamespace')
  }
})

it('formats durations with host-exotic options through the owned provider', () => {
  const options = hostObject({style: 'digital' as const})
  const original = Object.getOwnPropertyDescriptor(Intl, 'DurationFormat')!
  try {
    Object.defineProperty(Intl, 'DurationFormat', {
      ...original,
      value: DurationFormat,
    })
    configureLocaleFormatting()
    expect(
      Temporal.Duration.from('PT1H2M3S').toLocaleString('en', options)
    ).toBe('1:02:03')
    expect(
      new DurationFormat('en', options).format({
        hours: 1,
        minutes: 2,
        seconds: 3,
      })
    ).toBe('1:02:03')
  } finally {
    Object.defineProperty(Intl, 'DurationFormat', original)
    configureLocaleFormatting()
  }
})

function hostObject<T extends object>(fields: T): T {
  setFlagsFromString('--allow-natives-syntax')
  try {
    return Object.assign(runInThisContext('%GetUndetectable()') as T, fields)
  } finally {
    setFlagsFromString('--no-allow-natives-syntax')
  }
}

it('reads host-exotic duration fields once in specification order', () => {
  const fields = hostObject({hours: 1, minutes: 2, seconds: 3})
  const order: string[] = []
  for (const field of [
    'days',
    'hours',
    'microseconds',
    'milliseconds',
    'minutes',
    'months',
    'nanoseconds',
    'seconds',
    'weeks',
    'years',
  ] as const) {
    const value = (fields as Record<string, unknown>)[field]
    Object.defineProperty(fields, field, {
      get() {
        order.push(field)
        expect(this).toBe(fields)
        return value
      },
    })
  }
  expect(new DurationFormat('en', {style: 'digital'}).format(fields)).toBe(
    '1:02:03'
  )
  expect(order).toEqual([
    'days',
    'hours',
    'microseconds',
    'milliseconds',
    'minutes',
    'months',
    'nanoseconds',
    'seconds',
    'weeks',
    'years',
  ])
})

it('formats branded durations without private Object.create or Array.push hooks', () => {
  DurationFormat.__addTemporalNamespace(Temporal)
  const formatter = new DurationFormat('en', {style: 'long'})
  const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1)
  const expected = [
    {type: 'integer', value: '1', unit: 'minute'},
    {type: 'literal', value: ' ', unit: 'minute'},
    {type: 'unit', value: 'minute', unit: 'minute'},
  ]
  expect(formatter.format(duration)).toBe('1 minute')
  expect(formatter.formatToParts(duration)).toEqual(expected)
  for (const [target, key] of [
    [Object, 'create'],
    [Array.prototype, 'push'],
  ] as const) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)!
    let calls = 0,
      text: string | undefined,
      parts: unknown,
      error: unknown
    try {
      Object.defineProperty(target, key, {
        ...descriptor,
        value() {
          calls++
          throw new Error('private duration hook')
        },
      })
      try {
        text = formatter.format(duration)
        parts = formatter.formatToParts(duration)
      } catch (caught) {
        error = caught
      }
    } finally {
      Object.defineProperty(target, key, descriptor)
    }
    expect(error).toBeUndefined()
    expect(calls).toBe(0)
    expect(text).toBe('1 minute')
    expect(parts).toEqual(expected)
  }
})

it('creates own DurationFormat part units without inherited setters', () => {
  DurationFormat.__addTemporalNamespace(Temporal)
  const formatter = new DurationFormat('en', {style: 'long'})
  const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1)
  const expected = [
    {type: 'integer', value: '1', unit: 'minute'},
    {type: 'literal', value: ' ', unit: 'minute'},
    {type: 'unit', value: 'minute', unit: 'minute'},
  ]
  expect(formatter.formatToParts(duration)).toEqual(expected)
  const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, 'unit')
  let calls = 0,
    parts: unknown,
    error: unknown
  try {
    Object.defineProperty(Object.prototype, 'unit', {
      configurable: true,
      set() {
        calls++
        throw new Error('inherited unit setter')
      },
    })
    try {
      parts = formatter.formatToParts(duration)
    } catch (caught) {
      error = caught
    }
  } finally {
    if (descriptor) Object.defineProperty(Object.prototype, 'unit', descriptor)
    else Reflect.deleteProperty(Object.prototype, 'unit')
  }
  expect(error).toBeUndefined()
  expect(calls).toBe(0)
  expect(parts).toEqual(expected)
  expect(
    Object.getOwnPropertyDescriptor((parts as object[])[0], 'unit')
  ).toEqual({
    value: 'minute',
    writable: true,
    enumerable: true,
    configurable: true,
  })
})

it('reads branded Duration slots without private Array iteration', () => {
  DurationFormat.__addTemporalNamespace(Temporal)
  const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1)
  const expected = {
    years: 0,
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 1,
    seconds: 0,
    milliseconds: 0,
    microseconds: 0,
    nanoseconds: 0,
  }
  expect(ToTemporalDurationRecord(duration)).toEqual(expected)
  const descriptor = Object.getOwnPropertyDescriptor(
    Array.prototype,
    Symbol.iterator
  )!
  const define = Object.defineProperty
  let actual: unknown,
    error: unknown,
    calls = 0
  try {
    define(Array.prototype, Symbol.iterator, {
      ...descriptor,
      value() {
        calls++
        throw new Error('Mutable private Duration reader iterator')
      },
    })
    actual = ToTemporalDurationRecord(duration)
  } catch (caught) {
    error = caught
  } finally {
    define(Array.prototype, Symbol.iterator, descriptor)
  }
  expect(error).toBeUndefined()
  expect(calls).toBe(0)
  expect(actual).toEqual(expected)
})

it.each(['iterator', 'next'] as const)(
  'formats a branded Duration without public Array %s hooks',
  hook => {
    DurationFormat.__addTemporalNamespace(Temporal)
    const formatter = new DurationFormat('en', {style: 'long'})
    const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1)
    const expected = [
      {type: 'integer', value: '1', unit: 'minute'},
      {type: 'literal', value: ' ', unit: 'minute'},
      {type: 'unit', value: 'minute', unit: 'minute'},
    ]
    expect(formatter.format(duration)).toBe('1 minute')
    expect(formatter.formatToParts(duration)).toEqual(expected)
    const owner =
      hook === 'iterator'
        ? Array.prototype
        : Object.getPrototypeOf([][Symbol.iterator]())
    const key = hook === 'iterator' ? Symbol.iterator : 'next'
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
          throw new Error('Mutable private Duration part iterator')
        },
      })
      text = formatter.format(duration)
      parts = formatter.formatToParts(duration)
    } catch (caught) {
      error = caught
    } finally {
      define(owner, key, descriptor)
    }
    if (error) throw error
    expect(calls).toBe(0)
    expect(text).toBe('1 minute')
    expect(parts).toEqual(expected)
  }
)

it.each(['iterator', 'next'] as const)(
  'converts inherited Duration fields without private Array %s hooks',
  hook => {
    DurationFormat.__addTemporalNamespace(Temporal)
    const owner =
      hook === 'iterator'
        ? Array.prototype
        : Object.getPrototypeOf([][Symbol.iterator]())
    const key = hook === 'iterator' ? Symbol.iterator : 'next'
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const define = Object.defineProperty
    for (const abrupt of [false, true]) {
      const prototype = Object.create(null)
      const bag = Object.create(prototype)
      const sentinel = new Error('minutes coercion')
      let trace = '',
        receiverCorrect = true
      for (const field of [
        'days',
        'hours',
        'microseconds',
        'milliseconds',
        'minutes',
        'months',
        'nanoseconds',
        'seconds',
        'weeks',
        'years',
      ]) {
        define(prototype, field, {
          get() {
            receiverCorrect = receiverCorrect && this === bag
            trace += `get:${field};`
            return field === 'minutes'
              ? {
                  valueOf() {
                    trace += 'coerce:minutes;'
                    if (abrupt) throw sentinel
                    return 1
                  },
                }
              : undefined
          },
        })
      }
      let actual: unknown,
        error: unknown,
        calls = 0
      try {
        define(owner, key, {
          ...descriptor,
          value() {
            calls++
            throw new Error('Mutable Duration field iterator')
          },
        })
        actual = ToTemporalDurationRecord(bag)
      } catch (caught) {
        error = caught
      } finally {
        define(owner, key, descriptor)
      }
      expect(calls).toBe(0)
      expect(receiverCorrect).toBe(true)
      const prefix =
        'get:days;get:hours;get:microseconds;get:milliseconds;get:minutes;coerce:minutes;'
      if (abrupt) {
        expect(error).toBe(sentinel)
        expect(trace).toBe(prefix)
      } else {
        expect(error).toBeUndefined()
        expect(trace).toBe(
          prefix + 'get:months;get:nanoseconds;get:seconds;get:weeks;get:years;'
        )
        expect(actual).toEqual({
          years: 0,
          months: 0,
          weeks: 0,
          days: 0,
          hours: 0,
          minutes: 1,
          seconds: 0,
          milliseconds: 0,
          microseconds: 0,
          nanoseconds: 0,
        })
      }
    }
  }
)

it.each(['iterator', 'next'] as const)(
  'preserves Duration decimal precision without private Array %s hooks',
  hook => {
    DurationFormat.__addTemporalNamespace(Temporal)
    const cases = [
      {
        name: 'fractional',
        duration: new Temporal.Duration(0, 0, 0, 0, 1, 2, 3, 4, 5, 6),
        text: '1:02:03.004005006',
      },
      {
        name: 'negative fractional',
        duration: new Temporal.Duration(0, 0, 0, 0, -1, -2, -3, -4, -5, -6),
        text: '-1:02:03.004005006',
      },
      {
        name: 'negative leading zero',
        duration: new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, -1),
        text: '-0:00:00.001',
      },
      {
        name: 'large exact seconds',
        duration: new Temporal.Duration(
          0,
          0,
          0,
          0,
          0,
          0,
          9_007_199_254_740_991,
          1,
          0,
          1
        ),
        text: '0:00:9007199254740991.001000001',
      },
    ]
    const owner =
      hook === 'iterator'
        ? Array.prototype
        : Object.getPrototypeOf([][Symbol.iterator]())
    const key = hook === 'iterator' ? Symbol.iterator : 'next'
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const define = Object.defineProperty
    for (const sample of cases) {
      const formatter = new DurationFormat('en', {style: 'digital'})
      expect(formatter.format(sample.duration), sample.name).toBe(sample.text)
      const expectedParts = formatter.formatToParts(sample.duration)
      expect(expectedParts.map(part => part.value).join(''), sample.name).toBe(
        sample.text
      )
      let text: string | undefined,
        parts: unknown,
        error: unknown,
        calls = 0
      try {
        define(owner, key, {
          ...descriptor,
          value() {
            calls++
            throw new Error('Mutable decimal normalization iterator')
          },
        })
        text = formatter.format(sample.duration)
        parts = formatter.formatToParts(sample.duration)
      } catch (caught) {
        error = caught
      } finally {
        define(owner, key, descriptor)
      }
      if (error) throw error
      expect(calls, sample.name).toBe(0)
      expect(text, sample.name).toBe(sample.text)
      expect(parts, sample.name).toEqual(expectedParts)
    }
  }
)

it.each(['Number.isFinite', 'Math.abs', 'BigInt'] as const)(
  'validates ordinary Duration fields without private %s lookup',
  hook => {
    DurationFormat.__addTemporalNamespace(Temporal)
    let gets = 0,
      receiverCorrect = true
    const prototype = Object.create(null)
    const bag = Object.create(prototype)
    Object.defineProperty(prototype, 'minutes', {
      get() {
        gets++
        receiverCorrect = receiverCorrect && this === bag
        return 1
      },
    })
    const owner =
      hook === 'BigInt' ? globalThis : hook === 'Math.abs' ? Math : Number
    const key =
      hook === 'BigInt' ? 'BigInt' : hook === 'Math.abs' ? 'abs' : 'isFinite'
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const define = Object.defineProperty
    let actual: unknown,
      error: unknown,
      calls = 0
    try {
      define(owner, key, {
        ...descriptor,
        value() {
          calls++
          throw new Error('Mutable Duration validation intrinsic')
        },
      })
      actual = ToTemporalDurationRecord(bag)
    } catch (caught) {
      error = caught
    } finally {
      define(owner, key, descriptor)
    }
    if (error) throw error
    expect(calls).toBe(0)
    expect(gets).toBe(1)
    expect(receiverCorrect).toBe(true)
    expect(actual).toEqual({
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 1,
      seconds: 0,
      milliseconds: 0,
      microseconds: 0,
      nanoseconds: 0,
    })
  }
)

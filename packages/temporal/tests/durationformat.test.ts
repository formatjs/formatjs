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

it.each([
  ['NumberFormat', 'en-u-nu-mathsans'],
  ['ListFormat', 'en-u-nu-mathdbl'],
] as const)(
  'formats cold Duration profiles without late Intl.%s lookup',
  (key, locale) => {
    DurationFormat.__addTemporalNamespace(Temporal)
    const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1)
    // Extension-bearing locale keeps both shared memoizer keys cold.
    const formatter = new DurationFormat(locale, {style: 'long'})
    expect(formatter.resolvedOptions().locale).toBe(locale)
    const reference = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'minute',
      unitDisplay: 'long',
    })
    const expectedText = reference.format(1)
    const expectedParts = reference
      .formatToParts(1)
      .map(part => ({...part, unit: 'minute'}))
    const descriptor = Object.getOwnPropertyDescriptor(Intl, key)!
    const define = Object.defineProperty
    let text: string | undefined,
      freshText: string | undefined,
      parts: unknown,
      error: unknown,
      calls = 0
    try {
      define(Intl, key, {
        configurable: true,
        get() {
          calls++
          throw new Error(`Late private Intl.${key} lookup`)
        },
      })
      text = formatter.format(duration)
      parts = formatter.formatToParts(duration)
      freshText = new DurationFormat(locale, {style: 'long'}).format(duration)
    } catch (caught) {
      error = caught
    } finally {
      define(Intl, key, descriptor)
    }
    if (error) throw error
    expect(calls).toBe(0)
    expect(text).toBe(expectedText)
    expect(freshText).toBe(expectedText)
    expect(parts).toEqual(expectedParts)
  }
)

it('preserves late supplied NumberFormat providers through first rendering', () => {
  DurationFormat.__addTemporalNamespace(Temporal)
  const Original = Intl.NumberFormat
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!
  const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1)
  const expected = (numberingSystem: string) =>
    new Original('en', {
      style: 'unit',
      unit: 'minute',
      unitDisplay: 'long',
      numberingSystem,
    }).format(1)
  class FirstProvider extends Original {
    constructor(
      locales?: Intl.LocalesArgument,
      options?: Intl.NumberFormatOptions
    ) {
      super(locales, {...options, numberingSystem: 'arab'})
    }
  }
  class SecondProvider extends Original {
    constructor(
      locales?: Intl.LocalesArgument,
      options?: Intl.NumberFormatOptions
    ) {
      super(locales, {...options, numberingSystem: 'latn'})
    }
  }
  try {
    Intl.NumberFormat = FirstProvider
    const first = new DurationFormat('en', {style: 'long'})
    Intl.NumberFormat = SecondProvider
    const second = new DurationFormat('en', {style: 'long'})
    Object.defineProperty(Intl, 'NumberFormat', descriptor)
    expect(first.format(duration)).toBe(expected('arab'))
    expect(second.format(duration)).toBe(expected('latn'))
  } finally {
    Object.defineProperty(Intl, 'NumberFormat', descriptor)
  }
})

it.each(['NumberFormat', 'ListFormat'] as const)(
  'keeps selected %s parts method for branded Duration rendering',
  key => {
    DurationFormat.__addTemporalNamespace(Temporal)
    const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1, 2)
    const formatter = new DurationFormat('en', {style: 'long'})
    const expectedText = formatter.format(duration)
    const expectedParts = formatter.formatToParts(duration)
    const durationFormatDescriptor = Object.getOwnPropertyDescriptor(
      Intl,
      'DurationFormat'
    )!
    Object.defineProperty(Intl, 'DurationFormat', {
      ...durationFormatDescriptor,
      value: DurationFormat,
    })
    configureLocaleFormatting()
    const prototype = Intl[key].prototype
    const descriptor = Object.getOwnPropertyDescriptor(
      prototype,
      'formatToParts'
    )!
    const define = Object.defineProperty
    let text: string | undefined,
      freshText: string | undefined,
      localeText: string | undefined,
      parts: unknown,
      error: unknown,
      calls = 0
    try {
      define(prototype, 'formatToParts', {
        configurable: true,
        get() {
          calls++
          throw new Error('Late private formatToParts lookup')
        },
      })
      text = formatter.format(duration)
      parts = formatter.formatToParts(duration)
      freshText = new DurationFormat('en', {style: 'long'}).format(duration)
      localeText = duration.toLocaleString('en', {style: 'long'})
    } catch (caught) {
      error = caught
    } finally {
      define(prototype, 'formatToParts', descriptor)
      define(Intl, 'DurationFormat', durationFormatDescriptor)
      configureLocaleFormatting()
    }
    if (error) throw error
    expect(calls).toBe(0)
    expect(text).toBe('1 minute, 2 seconds')
    expect(text).toBe(expectedText)
    expect(parts).toEqual(expectedParts)
    expect(freshText).toBe(expectedText)
    expect(localeText).toBe(expectedText)
  }
)

it.each(['stringify', 'toJSON'] as const)(
  'formats cold branded Duration profiles without private %s hooks',
  key => {
    DurationFormat.__addTemporalNamespace(Temporal)
    const Original = Intl.NumberFormat
    const providerDescriptor = Object.getOwnPropertyDescriptor(
      Intl,
      'NumberFormat'
    )!
    // Fresh real provider gives this public profile an independent constructor cache.
    class Provider extends Original {}
    let formatter: DurationFormat
    try {
      Intl.NumberFormat = Provider
      formatter = new DurationFormat('en-u-nu-fullwide', {style: 'long'})
    } finally {
      Object.defineProperty(Intl, 'NumberFormat', providerDescriptor)
    }
    const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1, 2)
    const owner = key === 'stringify' ? JSON : Object.prototype
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)
    const define = Object.defineProperty
    let text: string | undefined,
      parts: unknown,
      error: unknown,
      calls = 0
    try {
      define(owner, key, {
        configurable: true,
        writable: true,
        value() {
          calls++
          throw new Error('Private formatter cache serialization hook')
        },
      })
      text = formatter!.format(duration)
      parts = formatter!.formatToParts(duration)
    } catch (caught) {
      error = caught
    } finally {
      if (descriptor) define(owner, key, descriptor)
      else Reflect.deleteProperty(owner, key)
    }
    if (error) throw error
    expect(calls).toBe(0)
    expect(text).toBe('１ minute, ２ seconds')
    expect(parts).toEqual([
      {type: 'integer', value: '１', unit: 'minute'},
      {type: 'literal', value: ' ', unit: 'minute'},
      {type: 'unit', value: 'minute', unit: 'minute'},
      {type: 'literal', value: ', '},
      {type: 'integer', value: '２', unit: 'second'},
      {type: 'literal', value: ' ', unit: 'second'},
      {type: 'unit', value: 'seconds', unit: 'second'},
    ])
  }
)

it('reads owned Duration formatter slots without mutable WeakMap.get', () => {
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
  const descriptor = Object.getOwnPropertyDescriptor(WeakMap.prototype, 'get')!
  const define = Object.defineProperty
  let text: string | undefined,
    parts: unknown,
    error: unknown,
    calls = 0
  try {
    define(WeakMap.prototype, 'get', {
      ...descriptor,
      value() {
        calls++
        throw new Error('Mutable private Duration slot lookup')
      },
    })
    text = formatter.format(duration)
    parts = formatter.formatToParts(duration)
  } catch (caught) {
    error = caught
  } finally {
    define(WeakMap.prototype, 'get', descriptor)
  }
  if (error) throw error
  expect(calls).toBe(0)
  expect(text).toBe('1 minute')
  expect(parts).toEqual(expected)
})

it.each(['get', 'create'] as const)(
  'initializes owned Duration formatting without mutable private %s',
  key => {
    DurationFormat.__addTemporalNamespace(Temporal)
    const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1)
    const owner = key === 'get' ? WeakMap.prototype : Object
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const define = Object.defineProperty
    let text: string | undefined,
      error: unknown,
      calls = 0
    try {
      define(owner, key, {
        ...descriptor,
        value() {
          calls++
          throw new Error('Mutable private Duration initialization')
        },
      })
      text = new DurationFormat('en', {style: 'long'}).format(duration)
    } catch (caught) {
      error = caught
    } finally {
      define(owner, key, descriptor)
    }
    if (error) throw error
    expect(calls).toBe(0)
    expect(text).toBe('1 minute')
  }
)

it.each(['filter', 'forEach', 'resolvedOptions'] as const)(
  'initializes cold owned Duration formatting without private %s lookup',
  key => {
    DurationFormat.__addTemporalNamespace(Temporal)
    const Original = Intl.NumberFormat
    class Provider extends Original {}
    const providerDescriptor = Object.getOwnPropertyDescriptor(
      Intl,
      'NumberFormat'
    )!
    const durationFormatDescriptor = Object.getOwnPropertyDescriptor(
      Intl,
      'DurationFormat'
    )!
    const owner =
      key === 'resolvedOptions' ? Original.prototype : Array.prototype
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const define = Object.defineProperty
    const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1)
    let text: string | undefined,
      error: unknown,
      calls = 0
    try {
      Intl.NumberFormat = Provider
      define(Intl, 'DurationFormat', {
        ...durationFormatDescriptor,
        value: DurationFormat,
      })
      configureLocaleFormatting()
      define(owner, key, {
        ...descriptor,
        value() {
          calls++
          throw new Error('Private Duration initialization hook')
        },
      })
      text = duration.toLocaleString('en', {
        localeMatcher: 'lookup',
        style: 'long',
      })
    } catch (caught) {
      error = caught
    } finally {
      define(owner, key, descriptor)
      define(Intl, 'NumberFormat', providerDescriptor)
      define(Intl, 'DurationFormat', durationFormatDescriptor)
      configureLocaleFormatting()
    }
    if (error) throw error
    expect(calls).toBe(0)
    expect(text).toBe('1 minute')
  }
)

it('formats branded Duration precision without a replacement BigInt', () => {
  DurationFormat.__addTemporalNamespace(Temporal)
  const samples = [
    {
      formatter: new DurationFormat('en', {style: 'long'}),
      duration: new Temporal.Duration(0, 0, 0, 0, 0, 1),
      text: '1 minute',
    },
    {
      formatter: new DurationFormat('en', {
        style: 'digital',
        fractionalDigits: 9,
      }),
      duration: new Temporal.Duration(0, 0, 0, 0, 0, 0, 1, 473, 5, 6),
      text: '0:00:01.473005006',
    },
  ]
  const expectedParts = samples.map(sample =>
    sample.formatter.formatToParts(sample.duration)
  )
  for (const sample of samples)
    expect(sample.formatter.format(sample.duration)).toBe(sample.text)
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'BigInt')!
  const define = Object.defineProperty
  const texts: string[] = [],
    parts: unknown[] = []
  let error: unknown,
    calls = 0
  try {
    define(globalThis, 'BigInt', {
      ...descriptor,
      value() {
        calls++
        throw new Error('Private Duration BigInt conversion')
      },
    })
    for (let index = 0; index < samples.length; index++) {
      const sample = samples[index]
      texts[index] = sample.formatter.format(sample.duration)
      parts[index] = sample.formatter.formatToParts(sample.duration)
    }
  } catch (caught) {
    error = caught
  } finally {
    define(globalThis, 'BigInt', descriptor)
  }
  if (error) throw error
  expect(calls).toBe(0)
  expect(texts).toEqual(['1 minute', '0:00:01.473005006'])
  expect(parts).toEqual(expectedParts)
})

it('invokes owned Duration locale formatting without mutable Function.call', () => {
  DurationFormat.__addTemporalNamespace(Temporal)
  const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1)
  const durationFormatDescriptor = Object.getOwnPropertyDescriptor(
    Intl,
    'DurationFormat'
  )!
  const descriptor = Object.getOwnPropertyDescriptor(
    Function.prototype,
    'call'
  )!
  const define = Object.defineProperty
  let text: string | undefined,
    error: unknown,
    calls = 0
  try {
    define(Intl, 'DurationFormat', {
      ...durationFormatDescriptor,
      value: DurationFormat,
    })
    configureLocaleFormatting()
    define(Function.prototype, 'call', {
      ...descriptor,
      value() {
        calls++
        throw new Error('Private Duration locale call')
      },
    })
    text = duration.toLocaleString('en', {
      localeMatcher: 'lookup',
      style: 'long',
    })
  } catch (caught) {
    error = caught
  } finally {
    define(Function.prototype, 'call', descriptor)
    define(Intl, 'DurationFormat', durationFormatDescriptor)
    configureLocaleFormatting()
  }
  if (error) throw error
  expect(calls).toBe(0)
  expect(text).toBe('1 minute')
})

it.each(['test', 'exec', 'isNaN', 'floor', 'getCanonicalLocales'] as const)(
  'constructs cold Duration locale profile without mutable %s',
  hook => {
    DurationFormat.__addTemporalNamespace(Temporal)
    const duration = new Temporal.Duration(0, 0, 0, 0, 1, 2, 3, 4)
    const Original = Intl.NumberFormat
    class FreshProvider extends Original {}
    const numberDescriptor = Object.getOwnPropertyDescriptor(
      Intl,
      'NumberFormat'
    )!
    const durationDescriptor = Object.getOwnPropertyDescriptor(
      Intl,
      'DurationFormat'
    )
    const owner =
      hook === 'test' || hook === 'exec'
        ? RegExp.prototype
        : hook === 'floor'
          ? Math
          : hook === 'isNaN'
            ? globalThis
            : Intl
    const key = hook
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const define = Object.defineProperty
    let actual: unknown,
      error: unknown,
      hooks = 0
    try {
      define(Intl, 'NumberFormat', {...numberDescriptor, value: FreshProvider})
      define(Intl, 'DurationFormat', {
        configurable: true,
        writable: true,
        value: DurationFormat,
      })
      configureLocaleFormatting()
      define(
        owner,
        key,
        hook === 'getCanonicalLocales'
          ? {
              configurable: true,
              get() {
                hooks++
                throw new Error('Mutable duration canonicalizer lookup')
              },
            }
          : {
              ...descriptor,
              value() {
                hooks++
                throw new Error('Mutable duration initialization hook')
              },
            }
      )
      actual = duration.toLocaleString('en', {
        localeMatcher: 'lookup',
        style: 'digital',
        numberingSystem: 'latn',
        fractionalDigits: 3,
      })
    } catch (caught) {
      error = caught
    } finally {
      define(owner, key, descriptor)
      define(Intl, 'NumberFormat', numberDescriptor)
      if (durationDescriptor) define(Intl, 'DurationFormat', durationDescriptor)
      else delete (Intl as any).DurationFormat
      configureLocaleFormatting()
    }
    expect(error).toBeUndefined()
    expect(hooks).toBe(0)
    expect(actual).toBe('1:02:03.004')
  }
)

it.each(['constructor', 'hasInstance'] as const)(
  'Duration locale initialization avoids public %s guard lookup',
  hook => {
    DurationFormat.__addTemporalNamespace(Temporal)
    const duration = new Temporal.Duration(0, 0, 0, 0, 0, 1)
    const owner =
      hook === 'constructor' ? DurationFormat.prototype : DurationFormat
    const key = hook === 'constructor' ? 'constructor' : Symbol.hasInstance
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)
    const durationDescriptor = Object.getOwnPropertyDescriptor(
      Intl,
      'DurationFormat'
    )
    const define = Object.defineProperty
    let actual: unknown,
      error: unknown,
      hooks = 0
    try {
      define(Intl, 'DurationFormat', {
        configurable: true,
        writable: true,
        value: DurationFormat,
      })
      configureLocaleFormatting()
      define(owner, key, {
        configurable: true,
        get() {
          hooks++
          throw new Error('Mutable duration constructor guard')
        },
      })
      actual = duration.toLocaleString('en', {
        localeMatcher: 'lookup',
        style: 'long',
      })
    } catch (caught) {
      error = caught
    } finally {
      if (descriptor) define(owner, key, descriptor)
      else delete (owner as any)[key]
      if (durationDescriptor) define(Intl, 'DurationFormat', durationDescriptor)
      else delete (Intl as any).DurationFormat
      configureLocaleFormatting()
    }
    expect(error).toBeUndefined()
    expect(hooks).toBe(0)
    expect(actual).toBe('1 minute')
  }
)

it('Duration construction adopts a later data-valued canonicalizer provider', () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    Intl,
    'getCanonicalLocales'
  )!
  const original = descriptor.value
  const apply = Reflect.apply
  let calls = 0
  try {
    Object.defineProperty(Intl, 'getCanonicalLocales', {
      ...descriptor,
      value(locales: Intl.LocalesArgument) {
        calls++
        return apply(original, Intl, [locales])
      },
    })
    const formatter = new DurationFormat('en', {
      localeMatcher: 'lookup',
      style: 'long',
    })
    expect(formatter.format({minutes: 1})).toBe('1 minute')
    expect(calls).toBeGreaterThan(0)
  } finally {
    Object.defineProperty(Intl, 'getCanonicalLocales', descriptor)
  }
})

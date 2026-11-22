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

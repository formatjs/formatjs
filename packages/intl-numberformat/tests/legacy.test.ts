import {test, expect} from 'vitest'
import {NumberFormat} from '#packages/intl-numberformat/core.js'
NumberFormat.__addLocaleData(require(`./locale-data/en.json`))

test('legacy wrappers expose only format and resolvedOptions', () => {
  const receiver = Object.create(NumberFormat.prototype)
  expect(NumberFormat.call(receiver, 'en', {minimumFractionDigits: 2})).toBe(
    receiver
  )
  const symbols = Object.getOwnPropertySymbols(receiver)
  expect(symbols).toHaveLength(1)
  const formatter = receiver[symbols[0]]
  expect(formatter).toBeInstanceOf(NumberFormat)
  expect(Object.getOwnPropertyDescriptor(receiver, symbols[0])).toEqual({
    value: formatter,
    writable: false,
    enumerable: false,
    configurable: false,
  })
  expect(receiver.format('1.00')).toBe('1.00')
  expect(receiver.format).toBe(formatter.format)
  expect(Object.create(receiver).format(1)).toBe('1.00')
  expect(receiver.resolvedOptions()).toEqual(formatter.resolvedOptions())
  expect(
    formatter
      .formatToParts(1)
      .map((part: {value: string}) => part.value)
      .join('')
  ).toBe('1.00')
  expect(() => receiver.formatToParts(1)).toThrow(TypeError)
  expect(() => receiver.formatRange(1, 2)).toThrow(TypeError)
  expect(() => receiver.formatRangeToParts(1, 2)).toThrow(TypeError)
  expect(() => NumberFormat.call(receiver, 'en')).toThrow(TypeError)
})

test('calling an initialized formatter preserves its original slots', () => {
  const receiver = new NumberFormat('en', {minimumFractionDigits: 1})
  const bound = receiver.format
  expect(NumberFormat.call(receiver, 'en', {minimumFractionDigits: 2})).toBe(
    receiver
  )
  expect(receiver.format).toBe(bound)
  expect(receiver.format(1)).toBe('1.0')
  const symbol = Object.getOwnPropertySymbols(receiver)[0]
  expect((receiver as any)[symbol].format(1)).toBe('1.00')
})

test('legacy unwrapping performs an observable fallback property Get', () => {
  const receiver = Object.create(NumberFormat.prototype)
  NumberFormat.call(receiver, 'en')
  const symbol = Object.getOwnPropertySymbols(receiver)[0]
  const reads: PropertyKey[] = []
  const proxy = new Proxy(receiver, {
    get(target, key, proxyReceiver) {
      reads.push(key)
      return Reflect.get(target, key, proxyReceiver)
    },
  })
  const getter = Object.getOwnPropertyDescriptor(
    NumberFormat.prototype,
    'format'
  )!.get!
  expect(getter.call(proxy)(1)).toBe('1')
  expect(NumberFormat.prototype.resolvedOptions.call(proxy).locale).toBe('en')
  expect(reads).toEqual([symbol, symbol])
})

test('legacy instance checks ignore Symbol.hasInstance and accept callable objects', () => {
  const receiver = Object.setPrototypeOf(() => {}, NumberFormat.prototype)
  Object.defineProperty(NumberFormat, Symbol.hasInstance, {
    configurable: true,
    value() {
      throw new Error('Symbol.hasInstance called')
    },
  })
  try {
    expect(NumberFormat.call(receiver as any, 'en')).toBe(receiver)
    expect((receiver as any).format(1)).toBe('1')
  } finally {
    delete (NumberFormat as any)[Symbol.hasInstance]
  }
})

test('option reads precede legacy receiver checks and definition failure', () => {
  const events: string[] = []
  const receiver = new Proxy(Object.create(NumberFormat.prototype), {
    getPrototypeOf(target) {
      events.push('prototype')
      return Reflect.getPrototypeOf(target)
    },
    defineProperty() {
      events.push('define')
      return false
    },
  })
  expect(() =>
    NumberFormat.call(receiver, 'en', {
      get style(): 'decimal' {
        events.push('style')
        return 'decimal'
      },
    })
  ).toThrow(TypeError)
  expect(events).toEqual(['style', 'prototype', 'define'])
  events.length = 0
  expect(() =>
    NumberFormat.call(receiver, 'en', {
      get style(): 'decimal' {
        events.push('style')
        throw new RangeError('options')
      },
    })
  ).toThrow(RangeError)
  expect(events).toEqual(['style'])
})

test('newTarget controls the prototype without requiring NumberFormat inheritance', () => {
  function Custom() {}
  const receiver = Reflect.construct(NumberFormat, ['en'], Custom)
  expect(Object.getPrototypeOf(receiver)).toBe(Custom.prototype)
  expect(Object.getOwnPropertySymbols(receiver)).toEqual([])
  expect(NumberFormat.prototype.resolvedOptions.call(receiver).locale).toBe(
    'en'
  )
  expect(
    NumberFormat.prototype.formatToParts
      .call(receiver, 1)
      .map((part: {value: string}) => part.value)
      .join('')
  ).toBe('1')
})

test('construction reads newTarget.prototype once before locale/options', () => {
  const events: string[] = []
  const target = new Proxy(function () {}, {
    get(target, key, receiver) {
      if (key === 'prototype') {
        events.push('prototype')
        return undefined
      }
      return Reflect.get(target, key, receiver)
    },
  })
  const receiver = Reflect.construct(
    NumberFormat,
    [
      'en',
      {
        get style(): 'decimal' {
          events.push('style')
          return 'decimal'
        },
      },
    ],
    target
  )
  expect(Object.getPrototypeOf(receiver)).toBe(NumberFormat.prototype)
  expect(events).toEqual(['prototype', 'style'])
})

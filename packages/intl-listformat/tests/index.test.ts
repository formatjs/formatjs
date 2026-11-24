import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import ListFormat from '#packages/intl-listformat/index.js'
import en from '#packages/intl-listformat/tests/locale-data/en.json' with {type: 'json'}
import enAI from '#packages/intl-listformat/tests/locale-data/en-AI.json' with {type: 'json'}
import es from '#packages/intl-listformat/tests/locale-data/es.json' with {type: 'json'}
import he from '#packages/intl-listformat/tests/locale-data/he.json' with {type: 'json'}
import zh from '#packages/intl-listformat/tests/locale-data/zh.json' with {type: 'json'}
import zhHant from '#packages/intl-listformat/tests/locale-data/zh-Hant.json' with {type: 'json'}
import zhHans from '#packages/intl-listformat/tests/locale-data/zh-Hans.json' with {type: 'json'}
import {describe, expect, it} from 'vitest'
ListFormat.__addLocaleData(en, enAI, es, he, zh, zhHans, zhHant)

it('chooses Spanish and Hebrew templates without executing public regex operations', () => {
  const and = new ListFormat('es')
  const or = new ListFormat('es', {type: 'disjunction'})
  const hebrew = new ListFormat('he')
  const original = RegExp.prototype.exec
  void /probe(.)/.exec('probe!')
  const previous = RegExp.lastMatch
  let actual: string[]
  let after: string | undefined
  try {
    RegExp.prototype.exec = () => {
      throw new Error('Called a public RegExp operation')
    }
    actual = [
      and.format(['agua', 'isla']),
      and.format(['agua', 'hielo']),
      or.format(['7', '11 pesos']),
      or.format(['7', '110 pesos']),
      hebrew.format(['א', 'ב']),
      hebrew.format(['א', 'English']),
      hebrew.format(['א', '\uFB1D']),
    ]
    after = RegExp.lastMatch
  } finally {
    RegExp.prototype.exec = original
  }
  expect(actual!).toEqual([
    'agua e isla',
    'agua y hielo',
    '7 u 11 pesos',
    '7 o 110 pesos',
    'א וב',
    'א ו-English',
    'א ו\uFB1D',
  ])
  expect(after).toBe(previous)
})

it('retains the resolved templates when a style getter reloads the pack', () => {
  const replacement = {
    ...en,
    data: {
      ...en.data,
      conjunction: {
        ...en.data.conjunction,
        long: {...en.data.conjunction.long, pair: '{0} & {1}'},
      },
    },
  }
  try {
    const formatter = new ListFormat('en', {
      get style() {
        ListFormat.__addLocaleData(replacement)
        return 'long' as const
      },
    })
    expect(formatter.format(['A', 'B'])).toBe('A and B')
    expect(new ListFormat('en').format(['A', 'B'])).toBe('A & B')
  } finally {
    ListFormat.__addLocaleData(en)
  }
})

it('selects contextual language independently of a replaced split method', () => {
  const original = String.prototype.split
  let formatter: ListFormat
  try {
    formatter = new ListFormat('es', {
      get style() {
        String.prototype.split = () => {
          throw new Error('Called a public String split operation')
        }
        return 'long' as const
      },
    })
  } finally {
    String.prototype.split = original
  }
  expect(formatter!.format(['agua', 'isla'])).toBe('agua e isla')
})

it('refreshes inferred parent data when its owning pack reloads', () => {
  const pack = (locale: string, pair: string) => ({
    ...en,
    locale,
    data: {
      ...en.data,
      conjunction: {
        ...en.data.conjunction,
        long: {...en.data.conjunction.long, pair},
      },
    },
  })
  const options = {localeMatcher: 'lookup'} as const
  const format = () => new ListFormat('aa', options).format(['A', 'B'])
  ListFormat.__addLocaleData(pack('aa-DJ', '{0} and {1}'))
  const existing = new ListFormat('aa', options)
  ListFormat.__addLocaleData(pack('aa-ET', '{0} or {1}'))
  expect(format()).toBe('A and B')

  ListFormat.__addLocaleData(pack('aa-DJ', '{0} & {1}'))
  expect(format()).toBe('A & B')
  expect(existing.format(['A', 'B'])).toBe('A and B')

  ListFormat.__addLocaleData(pack('aa', '{0} with {1}'))
  ListFormat.__addLocaleData(pack('aa-DJ', '{0} plus {1}'))
  expect(format()).toBe('A with B')
})

it('honors the locale matcher while filtering supported requests', () => {
  ListFormat.__addLocaleData({...en, locale: 'de'})
  const requested = ['gsw-u-nu-latn', 'zz-ZZ', 'en-US']
  expect(ListFormat.supportedLocalesOf(requested)).toEqual([
    'gsw-u-nu-latn',
    'en-US',
  ])
  expect(
    ListFormat.supportedLocalesOf(requested, {localeMatcher: 'lookup'})
  ).toEqual(['en-US'])
})

describe('Intl.ListFormat', function () {
  it('reads NewTarget.prototype once and initializes custom receivers', () => {
    const prototype = Object.create(null, {
      constructor: {
        get() {
          throw new Error('Read the receiver constructor')
        },
      },
    })
    let reads = 0
    const newTarget = new Proxy(function () {}, {
      get(target, key) {
        if (key !== 'prototype') return Reflect.get(target, key)
        reads++
        return prototype
      },
    })
    const instance = Reflect.construct(ListFormat, ['en'], newTarget)
    expect(reads).toBe(1)
    expect(Object.getPrototypeOf(instance)).toBe(prototype)
    expect(ListFormat.prototype.resolvedOptions.call(instance).locale).toBe(
      'en'
    )

    const defaultTarget = function () {}
    Object.defineProperty(defaultTarget, 'prototype', {value: null})
    const defaultInstance = Reflect.construct(ListFormat, ['en'], defaultTarget)
    expect(Object.getPrototypeOf(defaultInstance)).toBe(ListFormat.prototype)
  })

  it('checks receiver slots before reading the iterable', () => {
    const receiver = Object.assign(Object.create(ListFormat.prototype), {
      toString() {
        throw new Error('coerced receiver')
      },
    })
    const list = {
      get [Symbol.iterator](): never {
        throw new Error('read iterable before checking receiver')
      },
    }
    expect(() => ListFormat.prototype.format.call(receiver, list)).toThrow(
      TypeError
    )
    expect(() =>
      ListFormat.prototype.formatToParts.call(receiver, list)
    ).toThrow(TypeError)
    expect(() => ListFormat.prototype.resolvedOptions.call(receiver)).toThrow(
      TypeError
    )
  })

  it('retains its slots after its prototype changes', () => {
    const receiver = new ListFormat('en')
    Object.setPrototypeOf(receiver, null)
    expect(ListFormat.prototype.format.call(receiver, ['a'])).toBe('a')
    expect(ListFormat.prototype.resolvedOptions.call(receiver).locale).toBe(
      'en'
    )
  })

  it('should support aliases', function () {
    expect(
      new ListFormat('zh-CN', {type: 'unit'}).format(['1', '2', '3'])
    ).toBe('123')
    expect(new ListFormat('zh-CN', {type: 'unit'}).format(['1', '2'])).toBe(
      '12'
    )
    expect(
      new ListFormat('zh-TW', {type: 'unit'}).format(['1', '2', '3'])
    ).toBe('1 2 3')
    expect(new ListFormat('zh-TW', {type: 'unit'}).format(['1', '2'])).toBe(
      '1 2'
    )
  })
  it('should resolve parent correctly', function () {
    expect(new ListFormat('en-AI').format(['1', '2'])).toBe('1 and 2')
    // Node 12 has an old version of CLDR
    if (process.version && process.version.startsWith('v10')) {
      expect(new ListFormat('en-AI').format(['1', '2', '3'])).toBe('1, 2 and 3')
    }
  })
  it('should normalize case correctly', function () {
    const lf = new ListFormat('en-ai', {style: 'short', type: 'unit'})
    expect(lf.resolvedOptions()).toEqual({
      locale: 'en-AI',
      type: 'unit',
      style: 'short',
    })
  })
})

describe('StringListFromIterable', () => {
  it('keeps internal lists independent of Array.prototype.push', () => {
    const formatter = new ListFormat('en')
    const input = new Set(['a', 'b', 'c'])
    const push = Array.prototype.push
    let formatted: string
    let parts: ReturnType<ListFormat['formatToParts']>
    try {
      Array.prototype.push = () => {
        throw new Error('called Array.prototype.push')
      }
      formatted = formatter.format(input)
      parts = formatter.formatToParts(input)
    } finally {
      Array.prototype.push = push
    }
    expect(formatted).toBe('a, b, and c')
    expect(parts).toEqual([
      {type: 'element', value: 'a'},
      {type: 'literal', value: ', '},
      {type: 'element', value: 'b'},
      {type: 'literal', value: ', and '},
      {type: 'element', value: 'c'},
    ])
  })

  it('formats long iterables without recursive expansion or argument limits', () => {
    const formatter = new ListFormat('en')
    const count = 70_000
    function* values() {
      for (let index = 0; index < count; index++) yield 'a'
    }
    expect(formatter.format(values())).toBe('a, '.repeat(count - 1) + 'and a')
  })

  for (const method of ['format', 'formatToParts'] as const) {
    it(`${method} accepts strings and rejects non-iterables`, () => {
      const formatter = new ListFormat('en')
      expect(formatter[method]('ab')).toEqual(formatter[method](['a', 'b']))
      expect(formatter[method]()).toEqual(formatter[method]([]))
      for (const value of [1, true, null, {}, Symbol('list')]) {
        expect(() => formatter[method](value as any)).toThrow(TypeError)
      }
    })
    it(`${method} closes the iterator without coercing invalid values`, () => {
      let closed = false
      function* values() {
        try {
          yield {
            toString() {
              throw new Error('must not coerce')
            },
          }
        } finally {
          closed = true
        }
      }
      expect(() => new ListFormat('en')[method](values() as any)).toThrow(
        TypeError
      )
      expect(closed).toBe(true)
    })
    it(`${method} reads each iterator value once`, () => {
      let reads = 0
      const iterable = {
        [Symbol.iterator]() {
          let done = false
          return {
            next(): IteratorResult<string> {
              if (done) return {done: true, value: undefined}
              done = true
              return {
                done: false,
                get value() {
                  reads++
                  return 'a'
                },
              }
            },
          }
        },
      }
      new ListFormat('en')[method](iterable)
      expect(reads).toBe(1)
    })
    it(`${method} preserves the original TypeError when iterator close throws`, () => {
      const formatter = new ListFormat('en')
      const OriginalTypeError = TypeError
      const closeError = new Error('close failed')
      const values = {
        [Symbol.iterator]() {
          return {
            next: () => ({done: false, value: 42}),
            return() {
              throw closeError
            },
          }
        },
      }
      let error: unknown
      try {
        globalThis.TypeError = Error as TypeErrorConstructor
        formatter[method](values as unknown as Iterable<string>)
      } catch (caught) {
        error = caught
      } finally {
        globalThis.TypeError = OriginalTypeError
      }
      // ECMA-262 §7.4.11 returns the original abrupt completion.
      // https://tc39.es/ecma262/#sec-iteratorclose
      expect(error).toBeInstanceOf(OriginalTypeError)
    })
    it(`${method} propagates a value getter failure without closing`, () => {
      const failure = new Error('value getter failed')
      let closes = 0
      const values = {
        [Symbol.iterator](): Iterator<string> {
          return {
            next: () => ({
              done: false,
              get value(): string {
                throw failure
              },
            }),
            return() {
              closes++
              return {done: true, value: undefined}
            },
          }
        },
      }
      expect(() => new ListFormat('en')[method](values)).toThrow(failure)
      expect(closes).toBe(0)
    })
  }
})

it('keeps root patterns separate from English in either registration order', () => {
  const root = {
    ...en,
    locale: 'und',
    data: {
      ...en.data,
      conjunction: {
        ...en.data.conjunction,
        long: {...en.data.conjunction.long, pair: 'ROOT {0} + {1}'},
      },
    },
  }
  for (const data of [
    [en, root],
    [root, en],
  ]) {
    ListFormat.__addLocaleData(...data)
    expect(new ListFormat('en').format(['a', 'b'])).toBe('a and b')
    expect(new ListFormat('und').format(['a', 'b'])).toBe('ROOT a + b')
  }
})

it.each([
  'getDefaultLocale',
  '__defaultLocale',
  'relevantExtensionKeys',
] as const)('keeps locale state private from %s', property => {
  const original = Object.getOwnPropertyDescriptor(ListFormat, property)
  try {
    Object.defineProperty(ListFormat, property, {
      configurable: true,
      get() {
        throw new Error(`Read public ${property}`)
      },
    })
    ListFormat.__addLocaleData(en)
    expect(new ListFormat('en').format(['a', 'b'])).toBe('a and b')
  } finally {
    if (original) Object.defineProperty(ListFormat, property, original)
    else Reflect.deleteProperty(ListFormat, property)
  }
})

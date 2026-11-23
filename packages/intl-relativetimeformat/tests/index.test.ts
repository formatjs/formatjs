import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/zh'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-pluralrules/locale-data/gsw'
import zh from '#packages/intl-relativetimeformat/tests/locale-data/zh.json' with {type: 'json'}
import zhHant from '#packages/intl-relativetimeformat/tests/locale-data/zh-Hant.json' with {type: 'json'}
import zhHans from '#packages/intl-relativetimeformat/tests/locale-data/zh-Hans.json' with {type: 'json'}
import en from '#packages/intl-relativetimeformat/tests/locale-data/en.json' with {type: 'json'}
import enAI from '#packages/intl-relativetimeformat/tests/locale-data/en-AI.json' with {type: 'json'}
import gsw from '#packages/intl-relativetimeformat/tests/locale-data/gsw.json' with {type: 'json'}
import bn from '#packages/intl-relativetimeformat/tests/locale-data/bn.json' with {type: 'json'}
import my from '#packages/intl-relativetimeformat/tests/locale-data/my.json' with {type: 'json'}
import ne from '#packages/intl-relativetimeformat/tests/locale-data/ne.json' with {type: 'json'}
import RelativeTimeFormat from '#packages/intl-relativetimeformat/index.js'
import {describe, expect, it} from 'vitest'
RelativeTimeFormat.__addLocaleData(
  en,
  enAI,
  zh,
  zhHans,
  zhHant,
  bn,
  my,
  ne,
  gsw
)

describe('Intl.RelativeTimeFormat', function () {
  it('creates private NumberFormat options without reading Object.create', () => {
    const original = Object.create
    let formatter: RelativeTimeFormat
    try {
      formatter = new RelativeTimeFormat('en', {
        get style() {
          Object.create = () => {
            throw new Error('Read public Object.create')
          }
          return 'long' as const
        },
      })
    } finally {
      Object.create = original
    }
    expect(formatter.format(1, 'day')).toBe('in 1 day')
  })

  it.each(['format', 'formatToParts'] as const)(
    '%s coerces the unit before rejecting a nonfinite value',
    method => {
      const formatter = new RelativeTimeFormat('en')
      const failure = new Error('Unit coercion')
      const calls: string[] = []
      const value = {
        [Symbol.toPrimitive](hint: string) {
          calls.push(`value:${hint}`)
          return NaN
        },
      }
      const unit = {
        [Symbol.toPrimitive](hint: string) {
          calls.push(`unit:${hint}`)
          throw failure
        },
      }
      let caught: unknown
      try {
        Reflect.apply(formatter[method], formatter, [value, unit])
      } catch (error) {
        caught = error
      }
      expect(caught).toBe(failure)
      expect(calls).toEqual(['value:number', 'unit:string'])
    }
  )

  it('retains locale patterns when the style getter reloads locale data', () => {
    const day = en.data.day
    const replacement = {
      ...en,
      data: {
        ...en.data,
        day: {...day, future: {...day.future, one: 'AFTER {0}'}},
      },
    }
    try {
      const constructing = new RelativeTimeFormat('en', {
        get style() {
          RelativeTimeFormat.__addLocaleData(replacement)
          return 'long' as const
        },
      })
      expect(constructing.format(1, 'day')).toBe('in 1 day')
      expect(new RelativeTimeFormat('en').format(1, 'day')).toBe('AFTER 1')
    } finally {
      RelativeTimeFormat.__addLocaleData(en)
    }
  })

  it('ignores inherited numeric auto patterns', () => {
    const formatter = new RelativeTimeFormat('en', {numeric: 'auto'})
    const key = '0.125'
    const previous = Object.getOwnPropertyDescriptor(Object.prototype, key)
    let actual: string
    try {
      Object.defineProperty(Object.prototype, key, {
        configurable: true,
        get() {
          throw new Error('read inherited numeric pattern')
        },
      })
      actual = formatter.format(0.125, 'day')
    } finally {
      if (previous) Object.defineProperty(Object.prototype, key, previous)
      else Reflect.deleteProperty(Object.prototype, key)
    }
    expect(actual).toBe('in 0.125 days')
  })

  it('uses internal number and plural operations after public Intl methods change', () => {
    const existing = new RelativeTimeFormat('en')
    const properties = [
      [Intl.NumberFormat.prototype, 'formatToParts'],
      [Intl.PluralRules.prototype, 'select'],
      [Intl, 'NumberFormat'],
      [Intl, 'PluralRules'],
    ] as const
    const descriptors = properties.map(([target, key]) =>
      Object.getOwnPropertyDescriptor(target, key)!
    )
    let formatted: string
    let parts: Intl.RelativeTimeFormatPart[]
    try {
      for (const [target, key] of properties) {
        Object.defineProperty(target, key, {
          configurable: true,
          get() {
            throw new Error('Read public Intl property ' + key)
          },
        })
      }
      formatted = existing.format(1, 'day')
      parts = new RelativeTimeFormat('en').formatToParts(-2, 'day')
    } finally {
      properties.forEach(([target, key], index) =>
        Object.defineProperty(target, key, descriptors[index])
      )
    }
    expect(formatted).toBe('in 1 day')
    expect(parts).toEqual([
      {type: 'integer', value: '2', unit: 'day'},
      {type: 'literal', value: ' days ago'},
    ])
  })

  it('returns parts without calling user-visible array methods', () => {
    const formatter = new RelativeTimeFormat('en')
    const {map, push} = Array.prototype
    let formatted: string
    let parts: Intl.RelativeTimeFormatPart[]
    try {
      Array.prototype.map = Array.prototype.push = () => {
        throw new Error('called public array method')
      }
      formatted = formatter.format(-2, 'days')
      parts = formatter.formatToParts(-2, 'days')
    } finally {
      Array.prototype.map = map
      Array.prototype.push = push
    }
    expect(formatted).toBe('2 days ago')
    expect(parts).toEqual([
      {type: 'integer', value: '2', unit: 'day'},
      {type: 'literal', value: ' days ago'},
    ])
  })

  it('should lookup zh-CN', function () {
    expect(new RelativeTimeFormat('zh-CN').format(-1, 'second')).toBe('1秒钟前')
  })
  it('should lookup zh-TW', function () {
    expect(new RelativeTimeFormat('zh-TW').format(-1, 'second')).toBe('1 秒前')
    expect(
      new RelativeTimeFormat('zh-TW', {
        style: 'short',
        numeric: 'auto',
      }).format(-1, 'seconds')
    ).toBe('1 秒前')
  })
  it('should resolve parent correctly', function () {
    expect(new RelativeTimeFormat('en-AI').format(-1, 'second')).toBe(
      '1 second ago'
    )
  })
  it('falls back to the other pattern when a plural category is missing', function () {
    // gsw has no counted relative-time patterns of its own. CLDR resolves them
    // from root, which only defines `other`, while gsw plural rules select `one`.
    const rtf = new RelativeTimeFormat('gsw')
    expect(rtf.format(-1, 'second')).toBe('-1 s')
    expect(rtf.format(1, 'day')).toBe('+1 d')
    expect(rtf.formatToParts(1, 'hour')).toEqual([
      {type: 'literal', value: '+'},
      {type: 'integer', value: '1', unit: 'hour'},
      {type: 'literal', value: ' h'},
    ])
  })
  it('ignores inherited plural patterns when the locale falls back to other', () => {
    const rtf = new RelativeTimeFormat('gsw')
    const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'one')
    let formatted: string
    let parts: Intl.RelativeTimeFormatPart[]
    try {
      Object.defineProperty(Object.prototype, 'one', {
        configurable: true,
        get() {
          throw new Error('Inherited plural pattern was read')
        },
      })
      formatted = rtf.format(1, 'day')
      parts = rtf.formatToParts(1, 'day')
    } finally {
      if (previous) Object.defineProperty(Object.prototype, 'one', previous)
      else Reflect.deleteProperty(Object.prototype, 'one')
    }
    expect(formatted).toBe('+1 d')
    expect(parts).toEqual([
      {type: 'literal', value: '+'},
      {type: 'integer', value: '1', unit: 'day'},
      {type: 'literal', value: ' d'},
    ])
  })
  it('honors the numberingSystem option for locales that default to non-latn digits', function () {
    for (const locale of ['my-MM', 'bn-BD', 'ne-NP']) {
      const rtf = new RelativeTimeFormat(locale, {
        numberingSystem: 'latn',
      } as Intl.RelativeTimeFormatOptions)
      expect(rtf.resolvedOptions().numberingSystem).toBe('latn')
      const formatted = rtf.format(1, 'day')
      expect(formatted).toMatch(/[0-9]/)
      expect(formatted).not.toMatch(
        /[\u1040-\u1049\u09e6-\u09ef\u0966-\u096f]/u
      )
    }
  })
})

it('rejects BigInt values in both formatting methods', () => {
  const formatter = new RelativeTimeFormat('en')
  for (const value of [1n, Object(1n), {valueOf: () => 1n}]) {
    expect(() => formatter.format(value as any, 'day')).toThrow(TypeError)
    expect(() => formatter.formatToParts(value as any, 'day')).toThrow(
      TypeError
    )
  }
})

it('resolves numeric systems from options and locale extensions', () => {
  const formatter = new RelativeTimeFormat('en', {
    numberingSystem: 'arab',
  } as Intl.RelativeTimeFormatOptions)
  expect(formatter.resolvedOptions().numberingSystem).toBe('arab')
  expect(formatter.format(1234.5, 'day')).toBe('in ١٬٢٣٤٫٥ days')
  expect(
    formatter
      .formatToParts(1234.5, 'day')
      .filter(part => part.type !== 'literal')
      .map(part => part.value)
      .join('')
  ).toBe('١٬٢٣٤٫٥')
  const extension = new RelativeTimeFormat('en-u-nu-arab', {
    numberingSystem: 'invalid',
  } as Intl.RelativeTimeFormatOptions)
  expect(extension.resolvedOptions()).toMatchObject({
    locale: 'en-u-nu-arab',
    numberingSystem: 'arab',
  })
  const override = new RelativeTimeFormat('en-u-nu-arab', {
    numberingSystem: 'latn',
  } as Intl.RelativeTimeFormatOptions)
  expect(override.resolvedOptions()).toMatchObject({
    locale: 'en',
    numberingSystem: 'latn',
  })
})

it('constructs subclasses without reading their constructor property', () => {
  class Derived extends RelativeTimeFormat {}
  Object.defineProperty(Derived.prototype, 'constructor', {
    get() {
      throw new Error('constructor getter must not run')
    },
  })
  const formatter = new Derived('en')
  expect(formatter).toBeInstanceOf(Derived)
  expect(formatter.format(1, 'day')).toBe('in 1 day')
  expect(() => Reflect.apply(RelativeTimeFormat, undefined, ['en'])).toThrow(
    TypeError
  )
})

it('uses its intrinsic prototype for a same-realm primitive NewTarget prototype', () => {
  const newTarget = function () {}
  Object.defineProperty(newTarget, 'prototype', {value: null})
  const instance = Reflect.construct(RelativeTimeFormat, ['en'], newTarget)
  expect(Object.getPrototypeOf(instance)).toBe(RelativeTimeFormat.prototype)
  expect(instance.resolvedOptions().locale).toBe('en')
})

it.each([
  'getDefaultLocale',
  '__defaultLocale',
  'relevantExtensionKeys',
] as const)('keeps locale state private from %s', property => {
  const original = Object.getOwnPropertyDescriptor(RelativeTimeFormat, property)
  try {
    Object.defineProperty(RelativeTimeFormat, property, {
      configurable: true,
      get() {
        throw new Error(`Read public ${property}`)
      },
    })
    RelativeTimeFormat.__addLocaleData(en)
    expect(new RelativeTimeFormat('en').format(-2, 'day')).toBe('2 days ago')
  } finally {
    if (original) Object.defineProperty(RelativeTimeFormat, property, original)
    else Reflect.deleteProperty(RelativeTimeFormat, property)
  }
})

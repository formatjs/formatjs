import {IsWellFormedUnitIdentifier} from '#packages/ecma402-abstract/IsWellFormedUnitIdentifier.js'
import {registerLocaleData} from '#packages/ecma402-abstract/registerLocaleData.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('polyfill utilities', () => {
  let intlDescriptor: PropertyDescriptor | undefined

  beforeEach(() => {
    intlDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Intl')
  })

  afterEach(() => {
    if (intlDescriptor) {
      Object.defineProperty(globalThis, 'Intl', intlDescriptor)
    } else {
      Reflect.deleteProperty(globalThis, 'Intl')
    }
  })

  it('creates a native-shaped Intl global when one is absent', () => {
    Reflect.deleteProperty(globalThis, 'Intl')

    const intl = ensureIntl()

    expect(intl).toBe(globalThis.Intl)
    expect(Object.getOwnPropertyDescriptor(intl, Symbol.toStringTag)).toEqual({
      value: 'Intl',
      writable: false,
      enumerable: false,
      configurable: true,
    })
    expect(Object.getOwnPropertyDescriptor(globalThis, 'Intl')).toMatchObject({
      writable: true,
      enumerable: false,
      configurable: true,
    })
  })

  it('defines polyfill exports with native-compatible descriptors', () => {
    const intl = {}
    const Example = function Example() {}

    defineProperty(intl, 'Example', {value: Example})

    expect(Object.getOwnPropertyDescriptor(intl, 'Example')).toEqual({
      value: Example,
      writable: true,
      enumerable: false,
      configurable: true,
    })
  })

  it.each(['read', 'write'])(
    'keeps canonicalizing locales when the provider registry rejects %s',
    async operation => {
      const key = Symbol.for('@formatjs/intlCanonicalizeLocaleList')
      const intl = new Proxy(Intl, {
        getOwnPropertyDescriptor(target, property) {
          if (property === key && operation === 'read') throw new Error('read')
          return Reflect.getOwnPropertyDescriptor(target, property)
        },
        defineProperty(target, property, descriptor) {
          if (property === key && operation === 'write')
            throw new Error('write')
          return Reflect.defineProperty(target, property, descriptor)
        },
      })
      Object.defineProperty(globalThis, 'Intl', {value: intl})
      vi.resetModules()
      try {
        const {CanonicalizeLocaleList, registerCanonicalizeLocaleList} =
          await import('#packages/ecma402-abstract/CanonicalizeLocaleList.js')
        expect(CanonicalizeLocaleList('EN-us')).toEqual(['en-US'])
        expect(() => CanonicalizeLocaleList('en-x')).toThrow(RangeError)
        registerCanonicalizeLocaleList(intl, () => ['fr-CA'])
        expect(CanonicalizeLocaleList('fr')).toEqual(['fr-CA'])
      } finally {
        vi.resetModules()
      }
    }
  )
})

it('validates compound units without a mutable string split hook', () => {
  const split = String.prototype.split
  let results: boolean[]
  try {
    String.prototype.split = () => {
      throw new Error('Unexpected string split')
    }
    results = [
      IsWellFormedUnitIdentifier('meter-per-second'),
      IsWellFormedUnitIdentifier('meter-per-second-per-hour'),
      IsWellFormedUnitIdentifier('meter-per-'),
    ]
  } finally {
    String.prototype.split = split
  }

  expect(results).toEqual([true, false, false])
})

describe('locale data registration', () => {
  it('registers default-content children and required fallback tags', () => {
    const data = {}
    const locales = new Set<string>()
    const record = {value: 'Serbian'}
    registerLocaleData('sr-Cyrl', record, data, locales)
    expect([...locales].sort()).toEqual([
      'sr',
      'sr-Cyrl',
      'sr-Cyrl-RS',
      'sr-RS',
    ])
    for (const locale of locales)
      expect(data[locale as keyof typeof data]).toBe(record)
  })
  it.each([
    ['ar', 'ar-EG'],
    ['ar-EG', 'ar'],
  ])('preserves explicit data loaded as %s then %s', (first, second) => {
    const data: Record<string, {locale: string}> = {}
    const locales = new Set<string>()
    registerLocaleData(first, {locale: first}, data, locales)
    registerLocaleData(second, {locale: second}, data, locales)
    expect(data.ar.locale).toBe('ar')
    expect(data['ar-EG'].locale).toBe('ar-EG')
  })
  it.each([
    ['en-US', 'en'],
    ['en', 'en-US'],
  ])(
    'preserves explicit default-content data loaded as %s then %s',
    (first, second) => {
      const data: Record<string, {locale: string}> = {}
      const locales = new Set<string>()
      registerLocaleData(first, {locale: first}, data, locales)
      registerLocaleData(second, {locale: second}, data, locales)
      expect(data.en.locale).toBe('en')
      expect(data['en-US'].locale).toBe('en-US')
    }
  )
  it('refreshes inherited default-content data when its parent is reloaded', () => {
    const data: Record<string, object> = {}
    const locales = new Set<string>()
    registerLocaleData('en', {}, data, locales)
    const replacement = {}
    registerLocaleData('en', replacement, data, locales)
    expect(data['en-US']).toBe(replacement)
  })
  it('creates fallback entries without consulting inherited object properties', () => {
    const prototype = Object.create(null, {
      'de-DE': {
        get() {
          throw new Error('read inherited fallback')
        },
      },
    })
    const data = Object.create(prototype)
    const record = {locale: 'de-Latn-DE'}
    const locales = new Set<string>()
    registerLocaleData('de-Latn-DE', record, data, locales)
    expect(locales.has('de-DE')).toBe(true)
    expect(data['de-DE']).toBe(record)
  })
  it('registers en-US from English data without consulting Intl.Locale', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'Locale')!
    Object.defineProperty(Intl, 'Locale', {
      get() {
        throw new Error('unexpected Intl.Locale access')
      },
      configurable: true,
    })
    try {
      const data: Record<string, object> = {}
      const locales = new Set<string>()
      registerLocaleData('en', {}, data, locales)
      expect(locales.has('en-US')).toBe(true)
      expect(data['en-US']).toBe(data.en)
      registerLocaleData('und', {}, data, locales)
      expect(data.und).not.toBe(data.en)
    } finally {
      Object.defineProperty(Intl, 'Locale', descriptor)
    }
  })
})

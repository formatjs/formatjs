import {registerLocaleData} from '#packages/ecma402-abstract/registerLocaleData.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'

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

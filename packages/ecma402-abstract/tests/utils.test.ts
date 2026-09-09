import {
  defineProperty,
  ensureIntl,
  getLocaleDataAlias,
} from '#packages/ecma402-abstract/utils.js'
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

describe('locale data aliases', () => {
  it.each(['und', 'und-Arab', 'und-IN'])(
    'keeps %s separate from a likely language',
    locale => {
      expect(getLocaleDataAlias(locale)).toBe(locale)
    }
  )
  it('still minimizes explicit language aliases', () => {
    expect(getLocaleDataAlias('en-Latn-US')).toBe('en')
  })
})

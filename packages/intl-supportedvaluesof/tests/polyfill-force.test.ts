import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('Intl.supportedValuesOf polyfill-force', () => {
  let intlDescriptor: PropertyDescriptor | undefined

  beforeEach(() => {
    intlDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Intl')
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
    if (intlDescriptor) {
      Object.defineProperty(globalThis, 'Intl', intlDescriptor)
    } else {
      Reflect.deleteProperty(globalThis, 'Intl')
    }
  })

  it('installs into a missing Intl global', async () => {
    Reflect.deleteProperty(globalThis, 'Intl')

    await import('#packages/intl-supportedvaluesof/polyfill-force.js')

    expect(globalThis.Intl).toBeDefined()
    expect(
      Object.getOwnPropertyDescriptor(globalThis.Intl, 'supportedValuesOf')
    ).toMatchObject({
      writable: true,
      enumerable: false,
      configurable: true,
    })
    expect(Array.isArray(globalThis.Intl.supportedValuesOf('calendar'))).toBe(
      true
    )
    // @ts-expect-error exercising runtime key validation
    expect(() => globalThis.Intl.supportedValuesOf('invalid')).toThrow(
      RangeError
    )
  })
})

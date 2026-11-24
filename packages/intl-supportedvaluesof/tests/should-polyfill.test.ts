import {shouldPolyfill} from '#packages/intl-supportedvaluesof/should-polyfill.js'
import {expect, it} from 'vitest'

it('replaces a non-callable host supportedValuesOf', async () => {
  const host = Object.getOwnPropertyDescriptor(Intl, 'supportedValuesOf')!
  try {
    expect(shouldPolyfill()).toBe(false)
    Object.defineProperty(Intl, 'supportedValuesOf', {value: {}})
    await import('#packages/intl-supportedvaluesof/polyfill.js')
    expect(typeof Reflect.get(Intl, 'supportedValuesOf')).toBe('function')
  } finally {
    Object.defineProperty(Intl, 'supportedValuesOf', host)
  }
})

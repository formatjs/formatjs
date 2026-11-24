import {shouldPolyfill} from '#packages/intl-collator/should-polyfill.js'
import {expect, it} from 'vitest'

it('replaces a non-callable host Collator', async () => {
  const host = Object.getOwnPropertyDescriptor(Intl, 'Collator')!
  try {
    expect(shouldPolyfill()).toBe(false)
    Object.defineProperty(Intl, 'Collator', {value: {}})
    await import('#packages/intl-collator/polyfill.js')
    expect(typeof Reflect.get(Intl, 'Collator')).toBe('function')
  } finally {
    Object.defineProperty(Intl, 'Collator', host)
  }
})

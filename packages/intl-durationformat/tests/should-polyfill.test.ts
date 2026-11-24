import {shouldPolyfill} from '#packages/intl-durationformat/should-polyfill.js'
import {expect, it} from 'vitest'

it('replaces a non-callable host DurationFormat', async () => {
  const host = Object.getOwnPropertyDescriptor(Intl, 'DurationFormat')!
  try {
    expect(shouldPolyfill()).toBe(false)
    Object.defineProperty(Intl, 'DurationFormat', {value: {}})
    await import('#packages/intl-durationformat/polyfill.js')
    expect(typeof Reflect.get(Intl, 'DurationFormat')).toBe('function')
  } finally {
    Object.defineProperty(Intl, 'DurationFormat', host)
  }
})

import {shouldPolyfill} from '#packages/intl-segmenter/should-polyfill.js'
import {expect, it} from 'vitest'

it('replaces a non-callable host Segmenter', async () => {
  const host = Object.getOwnPropertyDescriptor(Intl, 'Segmenter')!
  try {
    expect(shouldPolyfill()).toBe(false)
    Object.defineProperty(Intl, 'Segmenter', {value: {}})
    await import('#packages/intl-segmenter/polyfill.js')
    expect(typeof Reflect.get(Intl, 'Segmenter')).toBe('function')
  } finally {
    Object.defineProperty(Intl, 'Segmenter', host)
  }
})

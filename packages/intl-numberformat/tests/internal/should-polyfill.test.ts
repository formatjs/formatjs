import {expect, it} from 'vitest'
import {shouldPolyfill} from '#packages/intl-numberformat/should-polyfill.js'
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/en.js'
import {NumberFormat} from '#packages/intl-numberformat/core.js'
import en from '#packages/intl-numberformat/tests/locale-data/en.json' with {type: 'json'}
NumberFormat.__addLocaleData(en as any)

it('detects missing source precision in native NumberFormat', () => {
  const original = Intl.NumberFormat
  try {
    ;(Intl as any).NumberFormat = NumberFormat
    expect(shouldPolyfill('en')).toBeUndefined()
    ;(Intl as any).NumberFormat = class extends NumberFormat {
      constructor(...args: ConstructorParameters<typeof NumberFormat>) {
        super(...args)
        const format = this.format
        Object.defineProperty(this, 'format', {
          value: (input: any) =>
            format(typeof input === 'string' ? Number(input) : input),
        })
      }
    }
    expect(shouldPolyfill('en')).toBe('en')
  } finally {
    ;(Intl as any).NumberFormat = original
  }
})
